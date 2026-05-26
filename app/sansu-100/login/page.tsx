'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import PinPad from '../components/PinPad';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import { hashPin } from '../lib/pin-hash';
import type { SansuUserPublic } from '../lib/types';

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const { saveUser } = useSansuUser();
  const [name, setName] = useState('');
  const [foundUser, setFoundUser] = useState<SansuUserPublic | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const u = await sansuApi.findUser(name.trim());
      if (!u) {
        setError('みつからなかったよ');
      } else {
        setFoundUser(u);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラー');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (pinValue: string = pin) => {
    if (!foundUser || pinValue.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const hash = await hashPin(pinValue, foundUser.id);
      const res = await sansuApi.verifyPin(foundUser.id, hash);
      if (res.ok && res.user) {
        saveUser(res.user);
        router.push('/sansu-100');
      } else {
        setError('あいことばが ちがうみたい');
        setPin('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラー');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-6 px-4 py-8">
        <Header
          title="べつの たんまつで つくった"
          description="なまえで さがしてみよう"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {!foundUser ? (
          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              なまえ
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'さがしてる...' : 'さがす'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="flex flex-col items-center gap-2">
              <span className="text-6xl">{foundUser.avatar}</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {foundUser.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                これで あってる？
              </p>
            </div>
            <PinPad
              value={pin}
              onChange={setPin}
              onSubmit={handleVerify}
              error={error}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => {
                setFoundUser(null);
                setPin('');
                setError(null);
              }}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              ← べつの なまえを いれる
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
