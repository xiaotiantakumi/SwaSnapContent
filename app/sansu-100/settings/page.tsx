'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import { useSansuUser } from '../hooks/useSansuUser';
import { storage, type SansuSettings } from '../lib/storage';

const KEYPAD_OPTIONS: { value: SansuSettings['keypadMode']; label: string; desc: string }[] = [
  { value: 'auto', label: 'じどう', desc: 'スマホはタッチ、PCはキーボード' },
  { value: 'on-screen', label: 'タッチパッド', desc: '画面のボタンで入力' },
  { value: 'keyboard', label: 'キーボード', desc: 'キーボードで入力' },
];

export default function SettingsPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();
  const [settings, setSettings] = useState<SansuSettings>({
    soundOn: true,
    keypadMode: 'auto',
  });

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) {
      router.replace('/sansu-100');
      return;
    }
    setSettings(storage.getSettings());
  }, [loaded, currentUser, router]);

  const update = (patch: Partial<SansuSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    storage.setSettings(next);
  };

  if (!loaded || !currentUser) return <main className="p-8" />;

  return (
    <main
      className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900"
      data-testid="settings-page"
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title="⚙️ せってい"
          description="アプリの動作をカスタマイズ"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            🔊 サウンド
          </h2>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-700">
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                効果音
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {settings.soundOn ? 'ON（きこえる）' : 'OFF（しずか）'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundOn}
              onClick={() => update({ soundOn: !settings.soundOn })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.soundOn
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              data-testid="sound-toggle"
            >
              <span
                className={`inline-block size-6 rounded-full bg-white shadow transition-transform${
                  settings.soundOn ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ⌨️ キーパッドモード
          </h2>
          <div className="space-y-2" data-testid="keypad-mode-select">
            {KEYPAD_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  settings.keypadMode === opt.value
                    ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/30'
                    : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="keypadMode"
                  value={opt.value}
                  checked={settings.keypadMode === opt.value}
                  onChange={() => update({ keypadMode: opt.value })}
                  className="sr-only"
                />
                <div
                  className={`flex size-5 items-center justify-center rounded-full border-2 ${
                    settings.keypadMode === opt.value
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}
                >
                  {settings.keypadMode === opt.value && (
                    <div className="size-2 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {opt.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {opt.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            👤 アカウント
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ログイン中:{' '}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {currentUser.name}
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
