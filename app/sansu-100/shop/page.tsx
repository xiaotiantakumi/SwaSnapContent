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
  getAvatarItem,
  type AvatarItemCategory,
  type AvatarItemDef,
  previewConfigWith,
} from '../lib/avatar-shop';
import { cartTotal } from '../lib/cart';
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
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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

  const toggleCart = (item: AvatarItemDef) => {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const priceOf = (id: string): number => getAvatarItem(id)?.price ?? 0;
  const cartLines = Array.from(cart)
    .map((id) => getAvatarItem(id))
    .filter((i): i is AvatarItemDef => Boolean(i));
  const total = cartTotal(cart, priceOf);
  const shortfall = Math.max(0, total - coins);

  const checkoutCart = async () => {
    if (cartLines.length === 0 || coins < total) return;
    setCheckingOut(true);
    setMessage(null);
    try {
      const res = await sansuApi.purchaseBatch(
        currentUser.id,
        Array.from(cart)
      );
      if (res.ok && res.user) {
        saveUser(res.user);
        setCart(new Set());
        setMessage(
          'カートの アイテムを ぜんぶ かったよ！🧑‍🎨キャラづくりで つけられるよ'
        );
        setCartOpen(false);
      } else if (res.error === 'insufficient') {
        setMessage(`あと 🪙${res.shortfall ?? 0} たりないよ`);
      } else if (res.error === 'unknown_item') {
        // サーバーが認識できないアイテムが混ざっている（カタログ変更等の稀なケース）。
        // カートに残したままだと再チェックアウトしても必ず失敗して詰むため、空にする。
        setCart(new Set());
        setMessage('カートの なかみが ふるくなっちゃった。もういちど えらんでね');
      } else {
        setMessage('いまは つうしんできないよ（あとでね）');
      }
    } catch {
      setMessage('いまは つうしんできないよ（あとでね）');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCartOpen((v) => !v)}
          className="relative flex size-11 items-center justify-center rounded-full bg-white text-xl shadow-md dark:bg-gray-800"
          aria-label="カートをひらく"
        >
          🛒
          {cart.size > 0 ? (
            <span
              data-testid="cart-badge"
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white"
            >
              {cart.size}
            </span>
          ) : null}
        </button>
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

        {cartOpen ? (
          <section
            data-testid="cart-panel"
            className="space-y-3 rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              🛒 カゴのなか
            </h2>
            {cartLines.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                まだ なにも はいっていないよ
              </p>
            ) : (
              <ul className="space-y-2">
                {cartLines.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-gray-100 p-2 dark:bg-gray-700"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-600">
                      {COLOR_CATEGORIES.has(item.category) ? (
                        <div
                          aria-hidden
                          className="size-7 rounded-full border-2 border-gray-100 dark:border-gray-500"
                          style={{ backgroundColor: `#${item.value}` }}
                        />
                      ) : (
                        <DiceBearAvatar
                          config={previewConfigWith(item.category, item.value)}
                        />
                      )}
                    </div>
                    <span className="flex-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      🪙 {item.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCart(item)}
                      className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200"
                    >
                      はずす
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p
              data-testid="cart-total"
              className="text-center font-bold text-gray-900 dark:text-gray-100"
            >
              ぜんぶで 🪙{total}
            </p>
            {shortfall > 0 ? (
              <p className="text-center text-sm font-bold text-red-600 dark:text-red-300">
                あと 🪙{shortfall} で ぜんぶ かえるよ
              </p>
            ) : null}
            <button
              type="button"
              data-testid="cart-checkout"
              disabled={cartLines.length === 0 || coins < total || checkingOut}
              onClick={checkoutCart}
              className="w-full rounded-xl bg-teal-500 py-2.5 font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ぜんぶかう
            </button>
          </section>
        ) : null}

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
                const inCart = cart.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center ${
                      isOwned
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : inCart
                          ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
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
                        onClick={() => toggleCart(item)}
                        className={`mt-1 flex w-full items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-white ${
                          inCart
                            ? 'bg-teal-500 hover:bg-teal-600'
                            : 'bg-yellow-500 hover:bg-yellow-600'
                        }`}
                        data-testid={`buy-${item.id}`}
                      >
                        {inCart ? '🛒 カゴにあるよ' : `🛒 かごにいれる 🪙${item.price}`}
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
