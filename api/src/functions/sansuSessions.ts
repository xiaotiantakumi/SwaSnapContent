import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { calculateCoins } from '../shared/coins';
import {
  FEVER_MAX_PER_WINDOW,
  feverIntervalIndex,
  feverLevelForIndex,
  feverUsesInWindow,
  isStartedAtRecent,
} from '../shared/fever';
import {
  type SansuSession,
  type SansuSessionEntity,
  type SansuUserEntity,
  toPublic,
} from '../shared/sansuTypes';
import {
  reverseTimestamp,
  sessionsTable,
  USERS_PARTITION,
  usersTable,
} from '../shared/tableClient';

// 送信ペイロード = セッション + クライアントが算出したストリーク文脈
// （ストリークボーナスのみクライアント申告を許容。基本報酬/ベスト/上限はサーバーが再計算）。
type SubmitSessionBody = SansuSession & {
  isRetired?: boolean;
  streakDays?: number;
  prevStreakDays?: number;
};

app.http('sansuSessionsPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/sessions',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as SubmitSessionBody;
      if (!body.id || !body.userId) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const sTable = await sessionsTable();
      const entity: SansuSessionEntity = {
        partitionKey: body.userId,
        rowKey: `${reverseTimestamp(body.completedAt)}_${body.id}`,
        id: body.id,
        userName: body.userName,
        levelStr: String(body.level),
        operation: body.operation,
        isDaily: body.isDaily,
        startedAt: body.startedAt,
        completedAt: body.completedAt,
        durationMs: body.durationMs,
        totalProblems: body.totalProblems,
        correctCount: body.correctCount,
        pointsEarned: body.pointsEarned,
        newBadgesJson: JSON.stringify(body.newBadges ?? []),
      };
      // 新規作成できたかを記録。409（再送）の場合は集計・コイン加算をスキップして二重加算を防ぐ。
      let created = false;
      try {
        await sTable.createEntity(entity);
        created = true;
      } catch (e) {
        if ((e as { statusCode?: number }).statusCode !== 409) {
          throw e;
        }
      }

      // ユーザー集計＋コイン。残高/集計はサーバーを権威とする。
      const uTable = await usersTable();
      let publicUser: ReturnType<typeof toPublic> | undefined;
      let feverEligible = false; // 今回がフィーバー達成＝ルーレット権利あり
      try {
        const user = await uTable.getEntity<SansuUserEntity>(
          USERS_PARTITION,
          body.userId
        );
        if (!created) {
          // 再送: 何も変更せず、現在の権威値を返してクライアントを同期させる。
          publicUser = toPublic(user);
        } else {
          const badges = new Set<string>([
            ...(JSON.parse(user.earnedBadgesJson) as string[]),
            ...(body.newBadges ?? []),
          ]);
          const best = JSON.parse(user.bestTimesJson) as Record<string, number>;
          const key = `lv${body.level}:${body.operation}`;
          const isPerfect = body.correctCount === body.totalProblems;
          const isNewBest =
            isPerfect && (!best[key] || body.durationMs < best[key]);
          if (isNewBest) {
            best[key] = body.durationMs;
          }

          // コイン（サーバー再計算）。リタイヤは加算しない。
          const todayKey = new Date(body.completedAt)
            .toISOString()
            .slice(0, 10);
          const coin = calculateCoins({
            dailyCoinDate: user.dailyCoinDate ?? '',
            dailyCoinsEarned: user.dailyCoinsEarned ?? 0,
            dailySessionCount: user.dailySessionCount ?? 0,
            todayKey,
            isNewBest,
            // ストリークはクライアント申告を許容（上限150が歯止め）。
            streakDays: body.streakDays ?? 0,
            prevStreakDays: body.prevStreakDays ?? 0,
            isCountable: !body.isRetired,
          });

          // フィーバー判定: 開始時刻の15分枠の推奨レベルと一致＆その枠で未claim。
          const interval = feverIntervalIndex(body.startedAt);
          feverEligible =
            !body.isRetired &&
            coin.coinsEarned > 0 &&
            typeof body.level === 'number' &&
            body.level === feverLevelForIndex(interval) &&
            feverUsesInWindow(
              interval,
              user.feverWindowInterval,
              user.feverWindowUses
            ) < FEVER_MAX_PER_WINDOW &&
            isStartedAtRecent(body.startedAt, Date.now());

          const updated: Partial<SansuUserEntity> & {
            partitionKey: string;
            rowKey: string;
          } = {
            partitionKey: USERS_PARTITION,
            rowKey: body.userId,
            totalPoints: user.totalPoints + body.pointsEarned,
            totalSessions: user.totalSessions + 1,
            earnedBadgesJson: JSON.stringify(Array.from(badges)),
            bestTimesJson: JSON.stringify(best),
            lastPlayedAt: body.completedAt,
            lastPlayedDate: todayKey,
            coins: (user.coins ?? 0) + coin.coinsEarned,
            dailyCoinDate: coin.nextDailyCoinDate,
            dailyCoinsEarned: coin.nextDailyCoinsEarned,
            dailySessionCount: coin.nextDailySessionCount,
            // フィーバー達成なら倍率の対象(基本コイン)を保留。ルーレットでclaim。
            ...(feverEligible
              ? {
                  pendingFeverInterval: interval,
                  pendingFeverBase: coin.coinsEarned,
                }
              : {}),
          };
          await uTable.updateEntity(updated, 'Merge');
          const refreshed = await uTable.getEntity<SansuUserEntity>(
            USERS_PARTITION,
            body.userId
          );
          publicUser = toPublic(refreshed);
        }
      } catch (e) {
        context.warn('User aggregate update failed', e);
      }

      return {
        status: 201,
        jsonBody: { ok: true, user: publicUser, feverEligible },
      };
    } catch (e) {
      context.error('sansuSessionsPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

app.http('sansuSessionsGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sansu/sessions',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const userId = req.query.get('userId');
    if (!userId) return { status: 400, jsonBody: { error: 'userId required' } };
    try {
      const table = await sessionsTable();
      const iter = table.listEntities<SansuSessionEntity>({
        queryOptions: {
          filter: `PartitionKey eq '${userId.replace(/'/g, "''")}'`,
        },
      });
      const sessions: SansuSession[] = [];
      for await (const e of iter) {
        sessions.push({
          id: e.id,
          userId,
          userName: e.userName,
          level: /^\d+$/.test(e.levelStr) ? Number(e.levelStr) : 'mix',
          operation: e.operation as SansuSession['operation'],
          isDaily: e.isDaily,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          durationMs: e.durationMs,
          totalProblems: e.totalProblems,
          correctCount: e.correctCount,
          pointsEarned: e.pointsEarned,
          newBadges: JSON.parse(e.newBadgesJson),
        });
        if (sessions.length >= 200) break;
      }
      // already sorted descending due to reversed timestamp rowKey
      sessions.reverse(); // return ascending chronological for charts
      return { status: 200, jsonBody: sessions };
    } catch (e) {
      context.error('sansuSessionsGet error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

// Suppress unused export lint
void toPublic;
