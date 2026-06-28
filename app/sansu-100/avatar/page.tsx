'use client';

import React, { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import DiceBearAvatar from '../components/DiceBearAvatar';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import {
  AVATAR_CATEGORIES,
  DEFAULT_AVATAR_CONFIG,
  type AvatarCategory,
} from '../lib/avatar-options';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';
import type { AvatarConfig } from '../lib/types';

function randomFrom(opts: readonly string[]): string {
  return opts[Math.floor(Math.random() * opts.length)];
}

// パーツ組み立て式アバター作成画面。顔・髪・目・口・色を選んでキャラを作る。
export default function AvatarBuilderPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [draft, setDraft] = useState<AvatarConfig | null>(null);
  const [activeKey, setActiveKey] = useState<AvatarCategory['key']>('hair');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // 初回に下書きを現在の構成（無ければ既定）から作る
  const config: AvatarConfig =
    draft ?? currentUser?.avatarConfig ?? DEFAULT_AVATAR_CONFIG;

  const previewUser = useMemo(
    () => (currentUser ? { ...currentUser, avatarConfig: config } : null),
    [currentUser, config]
  );

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser || !previewUser) return <main className="p-8" />;

  const setPart = (key: AvatarCategory['key'], value: string) => {
    setSaved(false);
    setDraft({ ...config, [key]: value });
  };

  const randomize = () => {
    setSaved(false);
    const next: AvatarConfig = { ...config };
    for (const cat of AVATAR_CATEGORIES) {
      next[cat.key] = randomFrom(cat.options);
    }
    setDraft(next);
    if (storage.getSettings().soundOn) sound.correct();
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await sansuApi.setAvatarConfig(currentUser.id, config);
      if (res.ok && res.user) {
        saveUser(res.user);
        setSaved(true);
        if (storage.getSettings().soundOn) sound.fanfare();
      }
    } catch {
      // 通信不可時は黙って失敗（あとで再保存できる）
    } finally {
      setBusy(false);
    }
  };

  const activeCat =
    AVATAR_CATEGORIES.find((c) => c.key === activeKey) ?? AVATAR_CATEGORIES[0];

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-4 p-4">
        <Header
          title="🧑‍🎨 キャラをつくる"
          description="かみ・め・くち・いろを えらんで じぶんだけの キャラに！"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {/* 大きなプレビュー（装備中の背景/フレーム/帽子も反映） */}
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

        {/* カテゴリタブ */}
        <div className="flex flex-wrap gap-2">
          {AVATAR_CATEGORIES.map((cat) => (
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

        {/* 選択肢グリッド */}
        <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
          {activeCat.kind === 'color' ? (
            <div className="grid grid-cols-5 gap-3">
              {activeCat.options.map((opt) => {
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
              {activeCat.options.map((opt) => {
                const on = config[activeCat.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-label={`${activeCat.label} ${opt}`}
                    onClick={() => setPart(activeCat.key, opt)}
                    className={`aspect-square overflow-hidden rounded-xl border-4 bg-gray-50 transition-transform active:scale-90 dark:bg-gray-700 ${
                      on
                        ? 'border-blue-500 ring-2 ring-blue-300'
                        : 'border-transparent'
                    }`}
                    data-testid={`opt-${activeCat.key}-${opt}`}
                  >
                    <DiceBearAvatar config={{ ...config, [activeCat.key]: opt }} />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 保存 */}
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
    </main>
  );
}
