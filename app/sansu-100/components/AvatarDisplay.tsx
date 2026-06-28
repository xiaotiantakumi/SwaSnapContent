import React from 'react';

import { getThemeClasses } from '../lib/avatar';
import { getItemDef } from '../lib/shop-catalog';
import type { SansuUserPublic } from '../lib/types';

import DiceBearAvatar from './DiceBearAvatar';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { box: string; emoji: string; overlay: string }> = {
  sm: { box: 'h-14 w-14', emoji: 'text-3xl', overlay: 'text-lg' },
  md: { box: 'h-20 w-20', emoji: 'text-5xl', overlay: 'text-2xl' },
  lg: { box: 'h-28 w-28', emoji: 'text-7xl', overlay: 'text-4xl' },
  xl: { box: 'h-44 w-44', emoji: 'text-8xl', overlay: 'text-6xl' },
};

// アバターを装備アイテムごと重ねて描画する。
// 下から: 背景 → フレーム(リング) → アバター絵文字(＋エフェクト) → 帽子オーバーレイ。
// 未装備のスロットはテーマ色にフォールバックし、従来の見た目を保つ（後方互換）。
export default function AvatarDisplay({
  user,
  size = 'md',
  className = '',
}: {
  user: SansuUserPublic;
  size?: Size;
  className?: string;
}): React.JSX.Element {
  const theme = getThemeClasses(user.themeColor);
  const s = SIZES[size];
  const equipped = user.equippedItems ?? {};

  const bgItem = equipped.background ? getItemDef(equipped.background) : undefined;
  const bgClass =
    bgItem?.render.kind === 'bgClass' ? bgItem.render.className : theme.bg;

  const frameItem = equipped.frame ? getItemDef(equipped.frame) : undefined;
  const frameClass =
    frameItem?.render.kind === 'frameClass'
      ? frameItem.render.className
      : `ring-4 ${theme.ring}`;

  const effectItem = equipped.effect ? getItemDef(equipped.effect) : undefined;
  const effectClass =
    effectItem?.render.kind === 'effectClass' ? effectItem.render.className : '';
  // エフェクトはアバター全体（顔＋帽子）にかけて一体で動かす。くるくるは速すぎると
  // 顔がぐるぐるして目が回るので、ゆっくり回す。
  const effectFinal =
    effectClass === 'animate-spin'
      ? 'animate-[spin_2.4s_linear_infinite]'
      : effectClass;

  const hatItem = equipped.hat ? getItemDef(equipped.hat) : undefined;
  const hat =
    hatItem?.render.kind === 'emojiOverlay' ? hatItem.render : undefined;

  // 帽子の位置は土台で変える。DiceBear キャラは顔が円の中央に収まるので、
  // 頭のてっぺん（円の上から少し内側）に乗せる。絵文字アバターは従来どおり。
  const isCharacter = !!user.avatarConfig;
  const hatPos = !hat
    ? ''
    : hat.position === 'topRight'
      ? isCharacter
        ? 'right-[20%] top-[8%] -rotate-12'
        : '-right-1 -top-1'
      : isCharacter
        ? 'left-1/2 top-[4%] -translate-x-1/2'
        : '-top-2 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full ${s.box} ${bgClass} ${frameClass} ${effectFinal} ${className}`}
      aria-label={`${user.name}のアバター`}
    >
      {user.avatarConfig ? (
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <DiceBearAvatar config={user.avatarConfig} title={`${user.name}のアバター`} />
        </div>
      ) : (
        <span className={`${s.emoji} leading-none`} aria-hidden>
          {user.avatar}
        </span>
      )}
      {hat ? (
        <span
          className={`pointer-events-none absolute ${s.overlay} ${hatPos}`}
          aria-hidden
        >
          {hat.emoji}
        </span>
      ) : null}
    </div>
  );
}
