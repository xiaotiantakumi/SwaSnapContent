'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { sansuApi } from '../lib/api-client';
import { AVATARS, THEME_COLORS } from '../lib/avatar';
import { hashPin } from '../lib/pin-hash';
import { storage } from '../lib/storage';
import type { SansuUserPublic } from '../lib/types';

import AvatarPicker from './AvatarPicker';
import ColorPicker from './ColorPicker';
import PinPad from './PinPad';

function newUserId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RegistrationForm(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'avatar' | 'color' | 'pin'>('name');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[2]);
  const [color, setColor] = useState<string>(THEME_COLORS[1]);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (pinValue: string = pin) => {
    if (pinValue.length !== 4) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = newUserId();
      const salt = id;
      const pinHash = await hashPin(pinValue, salt);
      const now = Date.now();
      const user: SansuUserPublic = {
        id,
        name: name.trim(),
        avatar,
        themeColor: color,
        createdAt: now,
        totalPoints: 0,
        earnedBadges: [],
        bestTimesByLevel: {},
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 0,
      };
      try {
        await sansuApi.createUser({
          name: user.name,
          avatar: user.avatar,
          themeColor: user.themeColor,
          pinHash,
          pinSalt: salt,
        });
      } catch (e) {
        // backend not reachable — proceed with local-only registration
        // (sync will retry later)
        console.warn('Backend registration failed, continuing locally', e);
      }
      storage.upsertUser(user);
      storage.setCurrentUserId(user.id);
      router.push('/sansu-100');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
      {step === 'name' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            なまえを いれてね
          </h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="ニックネーム（12文字まで）"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            data-testid="register-name-input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ※ ほんとうの なまえじゃなくても OK だよ
          </p>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => setStep('avatar')}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
            data-testid="register-name-next"
          >
            つぎへ →
          </button>
        </div>
      )}

      {step === 'avatar' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            アバターを えらんでね
          </h2>
          <div className="text-center text-6xl">{avatar}</div>
          <AvatarPicker value={avatar} onChange={setAvatar} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('name')}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-3 font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              ← もどる
            </button>
            <button
              type="button"
              onClick={() => setStep('color')}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
            >
              つぎへ →
            </button>
          </div>
        </div>
      )}

      {step === 'color' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            すきな いろは？
          </h2>
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('avatar')}
              className="flex-1 rounded-lg bg-gray-200 px-4 py-3 font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              ← もどる
            </button>
            <button
              type="button"
              onClick={() => setStep('pin')}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
            >
              つぎへ →
            </button>
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            あいことば（4けた）
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            たんじょうびの 月日（MMDD）でも OK だよ。ぜったいに わすれないでね！
          </p>
          <PinPad
            value={pin}
            onChange={setPin}
            onSubmit={handleSubmit}
            error={error}
            disabled={submitting}
            confirmLabel="これでとうろく！"
          />
          <button
            type="button"
            onClick={() => setStep('color')}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            ← もどる
          </button>
        </div>
      )}
    </div>
  );
}
