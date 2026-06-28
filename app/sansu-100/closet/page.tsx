'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import { SHOP_CATALOG, type ShopItemDef } from '../lib/shop-catalog';
import type { ItemSlot } from '../lib/types';

const SLOT_SECTIONS: { slot: ItemSlot; label: string; emoji: string }[] = [
  { slot: 'background', label: 'はいけい', emoji: '🖼️' },
  { slot: 'frame', label: 'フレーム', emoji: '⭕' },
  { slot: 'effect', label: 'うごき', emoji: '✨' },
];

// 着せ替え（きせかえ）専用画面。大きなアバターを見ながら、持っているアイテムをタップで着脱する。
export default function ClosetPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [busy, setBusy] = useState<string | null>(null);

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser) return <main className="p-8" />;

  const owned = new Set(currentUser.ownedItems ?? []);
  const equipped = currentUser.equippedItems ?? {};
  const ownedItems = SHOP_CATALOG.filter((i) => owned.has(i.id));

  const toggle = async (item: ShopItemDef) => {
    if (!currentUser) return;
    const isOn = equipped[item.slot] === item.id;
    setBusy(item.id);
    try {
      const res = await sansuApi.purchase(
        currentUser.id,
        isOn ? 'unequip' : 'equip',
        item.id
      );
      if (res.ok && res.user) saveUser(res.user);
    } finally {
      setBusy(null);
    }
  };

  const unequipSlot = async (slot: ItemSlot, anyOwnedId: string) => {
    if (!currentUser) return;
    setBusy(`none-${slot}`);
    try {
      // unequip はサーバーで slot を空にするので、その slot の任意の所持 itemId でよい
      const res = await sansuApi.purchase(currentUser.id, 'unequip', anyOwnedId);
      if (res.ok && res.user) saveUser(res.user);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-5 p-4">
        <Header
          title="🎨 きせかえ"
          description="もっている アイテムを タップして つけかえよう"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {/* 大きなアバター（キャラクター）プレビュー */}
        <section className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <AvatarDisplay user={currentUser} size="xl" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {currentUser.name}
          </p>
        </section>

        {ownedItems.length === 0 ? (
          <section className="space-y-3 rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              まだ アイテムを もっていないよ。
            </p>
            <Link
              href="/sansu-100/shop"
              className="inline-block rounded-xl bg-yellow-500 px-6 py-3 font-bold text-white hover:bg-yellow-600"
            >
              🛍️ おみせで かう
            </Link>
          </section>
        ) : (
          SLOT_SECTIONS.map((sec) => {
            const items = ownedItems.filter((i) => i.slot === sec.slot);
            if (items.length === 0) return null;
            const equippedId = equipped[sec.slot];
            return (
              <section
                key={sec.slot}
                className="space-y-3 rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800"
              >
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {sec.emoji} {sec.label}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {/* 「なし」= はずす */}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => unequipSlot(sec.slot, items[0].id)}
                    className={`flex size-16 flex-col items-center justify-center rounded-xl border-2 text-xs font-bold ${
                      !equippedId
                        ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-200'
                        : 'border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-xl" aria-hidden>
                      🚫
                    </span>
                    なし
                  </button>
                  {items.map((item) => {
                    const isOn = equippedId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={busy === item.id || busy !== null}
                        onClick={() => toggle(item)}
                        className={`flex size-16 flex-col items-center justify-center rounded-xl border-2 text-xs font-bold transition-transform active:scale-95 ${
                          busy === item.id ? 'animate-pulse opacity-60' : ''
                        } ${
                          isOn
                            ? 'border-green-400 bg-green-50 text-green-700 ring-2 ring-green-300 dark:bg-green-900/20 dark:text-green-200'
                            : 'border-transparent bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                        data-testid={`closet-${item.id}`}
                      >
                        <span className="text-2xl" aria-hidden>
                          {item.icon}
                        </span>
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <Link
          href="/sansu-100/shop"
          className="block rounded-xl bg-yellow-100 py-3 text-center font-bold text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200"
        >
          🛍️ おみせで もっと かう
        </Link>
      </div>
    </main>
  );
}
