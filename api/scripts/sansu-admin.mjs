#!/usr/bin/env node
// @ts-check
/**
 * 100マス計算 管理 CLI
 *
 * 保護者・先生（運用者）が「あいことば忘れた」「ユーザを消したい」等の
 * サポート依頼に対応するためのローカル管理ツール。
 *
 * Azure Table Storage（本番）/ Azurite（ローカル）に直接アクセスする。
 *
 * 接続先:
 *   - 既定           : ローカル Azurite（UseDevelopmentStorage=true）
 *   - --prod 指定時  : 環境変数 SANSU_STORAGE_CONNECTION（無ければ AzureWebJobsStorage）
 *                      本番の接続文字列は Key Vault 注入で渡すこと。値は一切表示しない。
 *
 * 使い方:
 *   node api/scripts/sansu-admin.mjs <command> [args] [--prod] [--json] [--yes]
 *
 *   list                          ユーザ一覧
 *   find   <名前|id>              ユーザ1件の詳細
 *   pin    <名前|id>              あいことば(PIN)を総当たりで復元
 *   set-pin <名前|id> <4桁>       あいことば(PIN)を再設定
 *   sessions <名前|id> [--limit N] 直近のプレイ記録
 *   delete <名前|id>              ユーザと全セッションを削除（確認あり）
 *   stats                         全体サマリ
 *
 * 本番例（Key Vault 注入経由・接続文字列は表示しない）:
 *   source ~/.agent/.env
 *   "$KV_INJECT" node api/scripts/sansu-admin.mjs list --prod
 */

import { createHash } from 'node:crypto';
import readline from 'node:readline';

import { TableClient, TableServiceClient } from '@azure/data-tables';

const USERS_PARTITION = 'v1';
const TABLE_USERS = 'SansuUsers';
const TABLE_SESSIONS = 'SansuSessions';
const LOCAL_CONNECTION = 'UseDevelopmentStorage=true';

// ---------- 引数パース ----------
const rawArgs = process.argv.slice(2);
const flags = {
  prod: false,
  json: false,
  yes: false,
  limit: 15,
};
const positionals = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--prod') flags.prod = true;
  else if (a === '--json') flags.json = true;
  else if (a === '--yes' || a === '-y') flags.yes = true;
  else if (a === '--limit') flags.limit = Number(rawArgs[++i]) || 15;
  else positionals.push(a);
}
const command = positionals[0];

// ---------- 接続 ----------
function getConnection() {
  if (flags.prod) {
    const c =
      process.env.SANSU_STORAGE_CONNECTION || process.env.AzureWebJobsStorage;
    if (!c) {
      console.error(
        '✗ 本番接続文字列が未設定です。Key Vault 注入で SANSU_STORAGE_CONNECTION を渡してください。\n' +
          '  例) source ~/.agent/.env && "$KV_INJECT" node api/scripts/sansu-admin.mjs list --prod'
      );
      process.exit(1);
    }
    return c;
  }
  return process.env.SANSU_STORAGE_CONNECTION || LOCAL_CONNECTION;
}

function isInsecure(conn) {
  return (
    conn.includes('UseDevelopmentStorage') ||
    conn.includes('http://127.0.0.1') ||
    conn.includes('http://localhost')
  );
}

const CONNECTION = getConnection();
const ALLOW_INSECURE = isInsecure(CONNECTION);
const ENV_LABEL = flags.prod ? '本番(PROD)' : 'ローカル(Azurite)';

function usersClient() {
  return TableClient.fromConnectionString(CONNECTION, TABLE_USERS, {
    allowInsecureConnection: ALLOW_INSECURE,
  });
}
function sessionsClient() {
  return TableClient.fromConnectionString(CONNECTION, TABLE_SESSIONS, {
    allowInsecureConnection: ALLOW_INSECURE,
  });
}

// ---------- ユーティリティ ----------
function hashPin(pin, salt) {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex');
}

function fmtDate(ms) {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('ja-JP', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function listAllUsers() {
  const table = usersClient();
  const out = [];
  const iter = table.listEntities({
    queryOptions: { filter: `PartitionKey eq '${USERS_PARTITION}'` },
  });
  for await (const e of iter) out.push(e);
  out.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return out;
}

/** 名前 or id からユーザを解決。複数一致時は候補を返す。 */
async function resolveUser(key) {
  const table = usersClient();
  // まず id (rowKey) として取得を試す
  try {
    const byId = await table.getEntity(USERS_PARTITION, key);
    return { user: byId, candidates: [byId] };
  } catch (e) {
    if (e?.statusCode !== 404) throw e;
  }
  // 名前で検索
  const matches = [];
  const iter = table.listEntities({
    queryOptions: {
      filter: `PartitionKey eq '${USERS_PARTITION}' and name eq '${String(
        key
      ).replace(/'/g, "''")}'`,
    },
  });
  for await (const e of iter) matches.push(e);
  return { user: matches.length === 1 ? matches[0] : null, candidates: matches };
}

async function requireUser(key) {
  if (!key) {
    console.error('✗ 名前または id を指定してください');
    process.exit(1);
  }
  const { user, candidates } = await resolveUser(key);
  if (user) return user;
  if (candidates.length === 0) {
    console.error(`✗ ユーザが見つかりません: ${key}`);
  } else {
    console.error(`✗ 同名ユーザが ${candidates.length} 人います。id で指定してください:`);
    for (const c of candidates) {
      console.error(`   ${c.avatar} ${c.name}  id=${c.rowKey}`);
    }
  }
  process.exit(1);
}

/** 4桁 PIN を総当たりで復元（salt=rowKey は既知）。 */
function recoverPin(entity) {
  const target = entity.pinHash;
  const salt = entity.pinSalt ?? entity.rowKey;
  for (let n = 0; n < 10000; n++) {
    const candidate = String(n).padStart(4, '0');
    if (hashPin(candidate, salt) === target) return candidate;
  }
  return null;
}

// ---------- コマンド ----------
async function cmdList() {
  const users = await listAllUsers();
  if (flags.json) {
    console.log(
      JSON.stringify(
        users.map((u) => ({
          id: u.rowKey,
          name: u.name,
          avatar: u.avatar,
          totalSessions: u.totalSessions,
          totalPoints: u.totalPoints,
          createdAt: u.createdAt,
          lastPlayedAt: u.lastPlayedAt,
          pinResetAt: u.pinResetAt ?? null,
        })),
        null,
        2
      )
    );
    return;
  }
  console.log(`\n[${ENV_LABEL}] ユーザ ${users.length} 人\n`);
  if (users.length === 0) {
    console.log('  （まだ誰も登録していません）\n');
    return;
  }
  for (const u of users) {
    console.log(
      `  ${u.avatar ?? '👤'} ${String(u.name).padEnd(10)} ` +
        `回数:${String(u.totalSessions ?? 0).padStart(4)}  ` +
        `pt:${String(u.totalPoints ?? 0).padStart(5)}  ` +
        `最終:${fmtDate(u.lastPlayedAt)}  ` +
        `id=${u.rowKey}` +
        (u.pinResetAt ? `  ⚠PIN再設定済(${fmtDate(u.pinResetAt)})` : '')
    );
  }
  console.log('');
}

async function cmdFind() {
  const u = await requireUser(positionals[1]);
  console.log(`\n  ${u.avatar ?? '👤'} ${u.name}`);
  console.log(`  id           : ${u.rowKey}`);
  console.log(`  テーマ色     : ${u.themeColor}`);
  console.log(`  登録日       : ${fmtDate(u.createdAt)}`);
  console.log(`  プレイ回数   : ${u.totalSessions ?? 0}`);
  console.log(`  ポイント     : ${u.totalPoints ?? 0}`);
  console.log(`  連続日数     : ${u.currentStreakDays ?? 0}`);
  console.log(`  最終プレイ   : ${fmtDate(u.lastPlayedAt)}`);
  if (u.pinResetAt) {
    console.log(`  PIN再設定    : ${fmtDate(u.pinResetAt)} by ${u.pinResetBy ?? '?'}`);
  }
  console.log('');
}

async function cmdPin() {
  const u = await requireUser(positionals[1]);
  process.stdout.write(`  ${u.avatar ?? '👤'} ${u.name} のあいことばを復元中... `);
  const pin = recoverPin(u);
  if (pin) {
    console.log(`\n\n  🔑 あいことば: ${pin}\n`);
  } else {
    console.log(
      '\n\n  ✗ 復元できませんでした（4桁以外で登録された可能性があります）\n'
    );
    process.exit(1);
  }
}

async function cmdSetPin() {
  const u = await requireUser(positionals[1]);
  const newPin = positionals[2];
  if (!/^\d{4}$/.test(newPin ?? '')) {
    console.error('✗ 新しいあいことばは4桁の数字で指定してください');
    process.exit(1);
  }
  const salt = u.pinSalt ?? u.rowKey;
  const table = usersClient();
  await table.updateEntity(
    {
      partitionKey: USERS_PARTITION,
      rowKey: u.rowKey,
      pinHash: hashPin(newPin, salt),
      pinSalt: salt,
      pinResetAt: Date.now(),
      pinResetBy: 'sansu-admin-cli',
    },
    'Merge'
  );
  console.log(`\n  ✓ ${u.avatar ?? '👤'} ${u.name} のあいことばを ${newPin} に再設定しました\n`);
}

async function cmdSessions() {
  const u = await requireUser(positionals[1]);
  const table = sessionsClient();
  const rows = [];
  const iter = table.listEntities({
    queryOptions: { filter: `PartitionKey eq '${u.rowKey.replace(/'/g, "''")}'` },
  });
  for await (const e of iter) rows.push(e);
  // rowKey は reverseTimestamp 接頭辞なので昇順=新しい順
  rows.sort((a, b) => String(a.rowKey).localeCompare(String(b.rowKey)));
  const shown = rows.slice(0, flags.limit);
  console.log(`\n  ${u.avatar ?? '👤'} ${u.name} のプレイ記録（全${rows.length}件中 ${shown.length}件）\n`);
  if (shown.length === 0) {
    console.log('  （記録なし）\n');
    return;
  }
  for (const s of shown) {
    console.log(
      `  ${fmtDate(s.completedAt)}  Lv.${s.levelStr ?? '?'} ${s.operation ?? ''}  ` +
        `${s.correctCount ?? 0}/${s.totalProblems ?? 0}  ` +
        `+${s.pointsEarned ?? 0}pt`
    );
  }
  console.log('');
}

async function cmdDelete() {
  const u = await requireUser(positionals[1]);
  const sessTable = sessionsClient();
  // 対象セッションを数える
  const sessionRows = [];
  const iter = sessTable.listEntities({
    queryOptions: { filter: `PartitionKey eq '${u.rowKey.replace(/'/g, "''")}'` },
  });
  for await (const e of iter) sessionRows.push(e);

  console.log(
    `\n  [${ENV_LABEL}] 削除対象:\n` +
      `    ${u.avatar ?? '👤'} ${u.name} (id=${u.rowKey})\n` +
      `    セッション ${sessionRows.length} 件\n`
  );

  if (!flags.yes) {
    const a1 = await ask('  本当に削除しますか？ (yes/no): ');
    if (a1.toLowerCase() !== 'yes') {
      console.log('  中止しました\n');
      return;
    }
    if (flags.prod) {
      const a2 = await ask('  ⚠ これは本番データです。ユーザ名を入力して確認: ');
      if (a2 !== u.name) {
        console.log('  名前が一致しないため中止しました\n');
        return;
      }
    }
  }

  // セッション削除
  for (const s of sessionRows) {
    await sessTable.deleteEntity(s.partitionKey, s.rowKey);
  }
  // ユーザ削除
  await usersClient().deleteEntity(USERS_PARTITION, u.rowKey);
  console.log(
    `\n  ✓ ${u.name} とセッション ${sessionRows.length} 件を削除しました\n`
  );
}

async function cmdStats() {
  const users = await listAllUsers();
  const sessTable = sessionsClient();
  let totalSessions = 0;
  const byDate = {};
  for (const u of users) {
    const iter = sessTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${u.rowKey.replace(/'/g, "''")}'` },
    });
    for await (const s of iter) {
      totalSessions++;
      const d = new Date(s.completedAt).toISOString().slice(0, 10);
      byDate[d] = (byDate[d] ?? 0) + 1;
    }
  }
  if (flags.json) {
    console.log(JSON.stringify({ totalUsers: users.length, totalSessions, byDate }, null, 2));
    return;
  }
  console.log(`\n  [${ENV_LABEL}] 全体サマリ`);
  console.log(`  ユーザ数     : ${users.length}`);
  console.log(`  セッション数 : ${totalSessions}`);
  const recent = Object.keys(byDate).sort().slice(-7);
  if (recent.length) {
    console.log('  直近の日別:');
    for (const d of recent) console.log(`    ${d}: ${byDate[d]}件`);
  }
  console.log('');
}

function printHelp() {
  console.log(
    `\n100マス計算 管理 CLI  [接続先: ${ENV_LABEL}]\n\n` +
      '使い方: node api/scripts/sansu-admin.mjs <command> [args] [--prod] [--json] [--yes]\n\n' +
      '  list                          ユーザ一覧\n' +
      '  find    <名前|id>             ユーザ1件の詳細\n' +
      '  pin     <名前|id>             あいことば(PIN)を総当たりで復元\n' +
      '  set-pin <名前|id> <4桁>       あいことば(PIN)を再設定\n' +
      '  sessions <名前|id> [--limit N] 直近のプレイ記録\n' +
      '  delete  <名前|id> [--yes]     ユーザと全セッションを削除\n' +
      '  stats                         全体サマリ\n\n' +
      'フラグ:\n' +
      '  --prod   本番ストレージに接続（要 SANSU_STORAGE_CONNECTION / Key Vault 注入）\n' +
      '  --json   JSON 出力（list / stats）\n' +
      '  --yes    確認をスキップ（delete）\n\n' +
      '本番例: source ~/.agent/.env && "$KV_INJECT" node api/scripts/sansu-admin.mjs list --prod\n'
  );
}

// ---------- ディスパッチ ----------
const COMMANDS = {
  list: cmdList,
  find: cmdFind,
  pin: cmdPin,
  'set-pin': cmdSetPin,
  sessions: cmdSessions,
  delete: cmdDelete,
  stats: cmdStats,
};

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }
  const fn = COMMANDS[command];
  if (!fn) {
    console.error(`✗ 不明なコマンド: ${command}`);
    printHelp();
    process.exit(1);
  }
  try {
    await fn();
  } catch (e) {
    // 接続文字列などの秘匿値を出さないよう、メッセージのみ表示
    console.error(`✗ エラー: ${e?.message ?? e}`);
    process.exit(1);
  }
}

main();
