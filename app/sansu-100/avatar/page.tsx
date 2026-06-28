'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import CoinBalance from '../components/CoinBalance';
import DiceBearAvatar from '../components/DiceBearAvatar';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import {
  AVATAR_CLOTHES_COLOR,
  AVATAR_EYEBROWS,
  AVATAR_EYES,
  AVATAR_HAIR,
  AVATAR_HAIR_COLOR,
  AVATAR_MOUTH,
  AVATAR_SKIN,
} from '../lib/avatar-options';
import {
  type AvatarItemCategory,
  ownedValuesOf,
} from '../lib/avatar-shop';
import { normalizeAvatarConfig } from '../lib/avatar-svg';
import {
  DRESSUP_CHARGE_COINS,
  DRESSUP_CHARGE_INTERVAL_SEC,
} from '../lib/minigame-economy';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';
import type { AvatarConfig } from '../lib/types';

type Cat = {
  key: keyof AvatarConfig;
  label: string;
  kind: 'parts' | 'color';
  free: readonly string[];
  paid?: AvatarItemCategory; // 所持していれば足す有料カテゴリ
};

const CATEGORIES: Cat[] = [
  { key: 'top', label: 'かみ・ぼうし', kind: 'parts', free: AVATAR_HAIR, paid: 'hat' },
  { key: 'hairColor', label: 'かみのいろ', kind: 'color', free: AVATAR_HAIR_COLOR },
  { key: 'eyes', label: 'め', kind: 'parts', free: AVATAR_EYES },
  { key: 'eyebrows', label: 'まゆげ', kind: 'parts', free: AVATAR_EYEBROWS },
  { key: 'mouth', label: 'くち', kind: 'parts', free: AVATAR_MOUTH },
  { key: 'accessory', label: 'メガネ', kind: 'parts', free: ['none'], paid: 'glasses' },
  { key: 'facialHair', label: 'ひげ', kind: 'parts', free: ['none'], paid: 'beard' },
  { key: 'clothing', label: 'ふく', kind: 'parts', free: ['shirtCrewNeck'], paid: 'clothing' },
  { key: 'skinColor', label: 'はだのいろ', kind: 'color', free: AVATAR_SKIN },
  { key: 'clothesColor', label: 'ふくのいろ', kind: 'color', free: AVATAR_CLOTHES_COLOR },
];

function randomFrom(opts: string[]): string {
  return opts[Math.floor(Math.random() * opts.length)];
}

// パーツ組み立て式アバター作成画面（DiceBear avataaars）。
// 土台は無料、ぼうし/メガネ/ふく/ひげ は「もっている」ものだけ選べる（ショップで購入）。
export default function AvatarBuilderPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [draft, setDraft] = useState<AvatarConfig | null>(null);
  const [activeKey, setActiveKey] = useState<keyof AvatarConfig>('top');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  // 未保存のまま離脱しようとした行き先（確認ダイアログを出す）
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const config: AvatarConfig =
    draft ?? normalizeAvatarConfig(currentUser?.avatarConfig);

  // 変更があってまだ保存していない＝離脱時に確認する
  const dirty = draft !== null && !saved;

  // --- 着せ替えの時間課金（一定時間ごとに 10コイン。尽きたら強制保存して戻る）---
  // テスト用に ?chargesec=N で間隔を短縮できる（既定 180秒）。
  const [chargeInterval] = useState(() => {
    if (typeof window === 'undefined') return DRESSUP_CHARGE_INTERVAL_SEC;
    const q = new URLSearchParams(window.location.search).get('chargesec');
    const n = q ? Number.parseInt(q, 10) : NaN;
    return !Number.isNaN(n) && n > 0 ? n : DRESSUP_CHARGE_INTERVAL_SEC;
  });
  const [secsLeft, setSecsLeft] = useState(chargeInterval);
  const [kicked, setKicked] = useState(false);
  const secsRef = useRef(chargeInterval);
  const chargingRef = useRef(false);
  const leavingRef = useRef(false);
  // 強制保存で使う「いまの見た目」と「ユーザー」を常に最新に保つ。
  const configRef = useRef(config);
  configRef.current = config;
  const userRef = useRef(currentUser);
  userRef.current = currentUser;

  useEffect(() => {
    if (!loaded || !userRef.current) return;
    secsRef.current = chargeInterval;
    setSecsLeft(chargeInterval);
    let stopped = false;

    const forceSaveAndLeave = async (): Promise<void> => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      stopped = true;
      setKicked(true);
      const u = userRef.current;
      if (u) {
        try {
          await sansuApi.setAvatarConfig(u.id, configRef.current);
        } catch {
          // 通信不可でもローカルには保存される（あとで同期）
          storage.upsertUser({ ...u, avatarConfig: configRef.current });
        }
      }
      window.setTimeout(() => router.replace('/sansu-100'), 1400);
    };

    const charge = async (): Promise<void> => {
      if (stopped || chargingRef.current || leavingRef.current) return;
      const uid = userRef.current?.id;
      if (!uid) return;
      chargingRef.current = true;
      try {
        const res = await sansuApi.spend(uid, 'dressup');
        if (res.ok && res.user) {
          saveUser(res.user);
        } else {
          await forceSaveAndLeave();
        }
      } catch {
        // 通信不可は課金せず次の周期で再試行
      } finally {
        chargingRef.current = false;
      }
    };

    const id = window.setInterval(() => {
      if (stopped) return;
      secsRef.current -= 1;
      if (secsRef.current <= 0) {
        secsRef.current = chargeInterval;
        void charge();
      }
      setSecsLeft(secsRef.current);
    }, 1000);

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
    // currentUser はコイン更新で毎回変わるが id は不変。userRef 経由で最新を見るので
    // ここでは loaded のときに1回だけタイマーを張る。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, chargeInterval, router, saveUser]);

  const owned = useMemo(() => currentUser?.ownedItems ?? [], [currentUser]);

  const previewUser = useMemo(
    () => (currentUser ? { ...currentUser, avatarConfig: config } : null),
    [currentUser, config]
  );

  // タブを閉じる/リロード/外部遷移のときはブラウザ標準の確認を出す
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // カテゴリごとの選べる値（無料＋所持している有料）
  const optionsFor = (cat: Cat): string[] => {
    if (cat.kind === 'color' || !cat.paid) return [...cat.free];
    return [...cat.free, ...ownedValuesOf(cat.paid, owned)];
  };

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser || !previewUser) return <main className="p-8" />;

  const setPart = (key: keyof AvatarConfig, value: string) => {
    setSaved(false);
    setDraft({ ...config, [key]: value });
  };

  const randomize = () => {
    setSaved(false);
    const next: AvatarConfig = { ...config };
    for (const cat of CATEGORIES) {
      next[cat.key] = randomFrom(optionsFor(cat));
    }
    setDraft(next);
    if (storage.getSettings().soundOn) sound.correct();
  };

  const save = async (): Promise<boolean> => {
    setBusy(true);
    try {
      const res = await sansuApi.setAvatarConfig(currentUser.id, config);
      if (res.ok && res.user) {
        saveUser(res.user);
        setSaved(true);
        if (storage.getSettings().soundOn) sound.fanfare();
        return true;
      }
      return false;
    } catch {
      // 通信不可時は黙って失敗（あとで再保存できる）
      return false;
    } finally {
      setBusy(false);
    }
  };

  // 未保存があれば確認ダイアログ、なければそのまま移動
  const requestNavigate = (href: string) => {
    if (dirty) setPendingHref(href);
    else router.push(href);
  };
  const navSaveAndGo = async () => {
    const href = pendingHref;
    const ok = await save();
    setPendingHref(null);
    if (ok && href) router.push(href);
  };
  const navDiscardAndGo = () => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  };

  const activeCat = CATEGORIES.find((c) => c.key === activeKey) ?? CATEGORIES[0];
  const activeOptions = optionsFor(activeCat);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-4 p-4">
        <Header
          title="🧑‍🎨 キャラをつくる"
          description="かお・かみ・ふくを えらんで じぶんだけの キャラに！"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
          onBackClick={() => requestNavigate('/sansu-100')}
        />

        <section
          className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3 shadow-sm ${
            (currentUser.coins ?? 0) < DRESSUP_CHARGE_COINS
              ? 'bg-red-50 dark:bg-red-900/30'
              : 'bg-amber-50 dark:bg-amber-900/30'
          }`}
          data-testid="dressup-charge"
        >
          <div className="text-sm font-bold text-amber-800 dark:text-amber-200">
            ⏱️ きせかえタイム のこり{' '}
            <span data-testid="dressup-secs">
              {Math.floor(secsLeft / 60)}:
              {String(secsLeft % 60).padStart(2, '0')}
            </span>
            <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
              （{Math.round(chargeInterval / 60) || 1}ふんで 🪙
              {DRESSUP_CHARGE_COINS}）
            </span>
          </div>
          <CoinBalance coins={currentUser.coins ?? 0} size="sm" />
        </section>

        <section className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <AvatarDisplay user={previewUser} size="xl" />
          <button
            type="button"
            onClick={randomize}
            className="mt-1 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-bold text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-200"
          >
            🎲 おまかせ
          </button>
        </section>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveKey(cat.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
                cat.key === activeKey
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
              data-testid={`tab-${cat.key}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
          {activeCat.kind === 'color' ? (
            <div className="grid grid-cols-5 gap-3">
              {activeOptions.map((opt) => {
                const on = config[activeCat.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-label={`いろ ${opt}`}
                    onClick={() => setPart(activeCat.key, opt)}
                    className={`size-12 rounded-full border-4 transition-transform active:scale-90 ${
                      on
                        ? 'border-blue-500 ring-2 ring-blue-300'
                        : 'border-white shadow dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: `#${opt}` }}
                    data-testid={`opt-${activeCat.key}-${opt}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {activeOptions.map((opt) => {
                const on = config[activeCat.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-label={`${activeCat.label} ${opt}`}
                    onClick={() => setPart(activeCat.key, opt)}
                    className={`aspect-square overflow-hidden rounded-xl border-4 bg-gray-50 transition-transform active:scale-90 dark:bg-gray-700 ${
                      on ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'
                    }`}
                    data-testid={`opt-${activeCat.key}-${opt}`}
                  >
                    <DiceBearAvatar config={{ ...config, [activeCat.key]: opt }} />
                  </button>
                );
              })}
            </div>
          )}

          {activeCat.paid ? (
            <button
              type="button"
              onClick={() => requestNavigate('/sansu-100/shop')}
              className="block w-full rounded-xl bg-yellow-100 py-2.5 text-center text-sm font-bold text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200"
            >
              🛍️ ショップで {activeCat.label} を かう
            </button>
          ) : null}
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white hover:bg-green-700 disabled:opacity-60"
          data-testid="avatar-save"
        >
          {busy ? 'ほぞんちゅう…' : saved ? '✅ ほぞんしたよ！' : '💾 このキャラにする'}
        </button>
      </div>

      {kicked ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="dressup-kicked"
        >
          <div className="w-full max-w-xs space-y-2 rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
            <p className="text-4xl" aria-hidden>
              🪙
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              コインが なくなったよ
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              いまの すがたを ほぞんして もどるね。
              <br />
              また あそんで コインを ためてね！
            </p>
          </div>
        </div>
      ) : null}

      {pendingHref !== null ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="avatar-unsaved-dialog"
        >
          <div className="w-full max-w-xs space-y-3 rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ほぞんして いない へんこうが あるよ
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              このまま いくと、きせかえが きえちゃうよ。どうする？
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={navSaveAndGo}
              className="w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
              data-testid="unsaved-save-go"
            >
              💾 ほぞんして いく
            </button>
            <button
              type="button"
              onClick={navDiscardAndGo}
              className="w-full rounded-xl bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              data-testid="unsaved-discard-go"
            >
              ほぞんせずに いく
            </button>
            <button
              type="button"
              onClick={() => setPendingHref(null)}
              className="w-full py-1 text-sm font-semibold text-blue-600 dark:text-blue-300"
              data-testid="unsaved-cancel"
            >
              キャンセル（ここに のこる）
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
