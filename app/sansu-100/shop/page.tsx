'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import CoinBalance from '../components/CoinBalance';
import DiceBearAvatar from '../components/DiceBearAvatar';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import {
  AVATAR_CATEGORY_ICON,
  AVATAR_CATEGORY_LABEL,
  AVATAR_SHOP,
  type AvatarItemCategory,
  type AvatarItemDef,
  previewConfigWith,
} from '../lib/avatar-shop';
import {
  RARITY_LABEL,
  SHOP_CATALOG,
  type ItemRarity,
  type ShopItemDef,
} from '../lib/shop-catalog';
import type { ItemSlot } from '../lib/types';

const SLOT_SECTIONS: { slot: ItemSlot; label: string; emoji: string }[] = [
  { slot: 'background', label: 'はいけい', emoji: '🖼️' },
  { slot: 'frame', label: 'フレーム', emoji: '⭕' },
  { slot: 'effect', label: 'うごき', emoji: '✨' },
];

const AVATAR_CATEGORIES: AvatarItemCategory[] = [
  'hat',
  'glasses',
  'clothing',
  'beard',
  'hairstyle',
  'haircolor',
  'eyes',
  'eyebrow',
  'mouthstyle',
  'clothescolor',
];

// 色そのものを見せたいカテゴリ（サムネはDiceBearプレビューでなく色丸にする）
const COLOR_CATEGORIES: ReadonlySet<AvatarItemCategory> = new Set([
  'haircolor',
  'clothescolor',
]);

const RARITY_BADGE: Record<ItemRarity, string> = {
  normal: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  rare: 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  epic: 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
};

export default function ShopPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser) return <main className="p-8" />;

  const coins = currentUser.coins ?? 0;
  const owned = new Set(currentUser.ownedItems ?? []);
  const equipped = currentUser.equippedItems ?? {};

  const act = async (
    action: 'buy' | 'equip' | 'unequip',
    item: ShopItemDef
  ) => {
    setBusy(item.id);
    setMessage(null);
    try {
      const res = await sansuApi.purchase(currentUser.id, action, item.id);
      if (res.ok && res.user) {
        saveUser(res.user);
        if (action === 'buy') setMessage(`「${item.name}」を かったよ！`);
      } else if (res.error === 'conflict') {
        setMessage(action === 'buy' ? 'コインが たりないよ' : 'まだ もっていないよ');
      }
    } catch {
      setMessage('いまは つうしんできないよ（あとでね）');
    } finally {
      setBusy(null);
    }
  };

  const buyAvatar = async (item: AvatarItemDef) => {
    setBusy(item.id);
    setMessage(null);
    try {
      const res = await sansuApi.purchase(currentUser.id, 'buy', item.id);
      if (res.ok && res.user) {
        saveUser(res.user);
        setMessage(`「${item.name}」を かったよ！🧑‍🎨キャラづくりで つけられるよ`);
      } else if (res.error === 'conflict') {
        setMessage('コインが たりないよ');
      }
    } catch {
      setMessage('いまは つうしんできないよ（あとでね）');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title="🛍️ おみせ"
          description="コインで きせかえアイテムを かおう"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <section className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <AvatarDisplay user={currentUser} size="lg" />
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100">
                {currentUser.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                いまの すがた
              </p>
            </div>
          </div>
          <CoinBalance coins={coins} size="lg" />
        </section>

        <Link
          href="/sansu-100/avatar"
          className="block rounded-xl bg-teal-100 py-2.5 text-center font-bold text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-200"
        >
          🧑‍🎨 キャラづくりで つけかえる
        </Link>

        {message ? (
          <div className="rounded-xl bg-yellow-100 px-4 py-3 text-center font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            {message}
          </div>
        ) : null}

        {/* アバター・アクセサリー（買うと キャラづくりで つけられる） */}
        {AVATAR_CATEGORIES.map((cat) => (
          <section
            key={cat}
            className="space-y-3 rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {AVATAR_CATEGORY_ICON[cat]} {AVATAR_CATEGORY_LABEL[cat]}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AVATAR_SHOP.filter((i) => i.category === cat).map((item) => {
                const isOwned = owned.has(item.id);
                const canAfford = coins >= item.price;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                      isOwned
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-600">
                      {COLOR_CATEGORIES.has(item.category) ? (
                        <div
                          aria-hidden
                          className="size-12 rounded-full border-4 border-gray-100 shadow dark:border-gray-500"
                          style={{ backgroundColor: `#${item.value}` }}
                        />
                      ) : (
                        <DiceBearAvatar
                          config={previewConfigWith(item.category, item.value)}
                        />
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_BADGE[item.rarity]}`}
                    >
                      {RARITY_LABEL[item.rarity]}
                    </span>
                    {isOwned ? (
                      <span className="mt-1 w-full rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white">
                        もってる✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === item.id || !canAfford}
                        onClick={() => buyAvatar(item)}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-yellow-500 px-2 py-1 text-xs font-bold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid={`buy-${item.id}`}
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* 背景・フレーム・うごき（従来どおり きせかえで装備） */}
        {SLOT_SECTIONS.map((sec) => (
          <section
            key={sec.slot}
            className="space-y-3 rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {sec.emoji} {sec.label}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SHOP_CATALOG.filter((i) => i.slot === sec.slot).map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = equipped[item.slot] === item.id;
                const canAfford = coins >= item.price;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                      isEquipped
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-transparent bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <span className="text-3xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_BADGE[item.rarity]}`}
                    >
                      {RARITY_LABEL[item.rarity]}
                    </span>
                    {isOwned ? (
                      isEquipped ? (
                        <button
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => act('unequip', item)}
                          className="mt-1 w-full rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-60"
                        >
                          つけてる✓
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => act('equip', item)}
                          className="mt-1 w-full rounded-lg bg-blue-500 px-2 py-1 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-60"
                        >
                          つける
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={busy === item.id || !canAfford}
                        onClick={() => act('buy', item)}
                        className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-yellow-500 px-2 py-1 text-xs font-bold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        🪙 {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
