import React from 'react';

import { getThemeClasses } from '../lib/avatar';
import { getItemDef } from '../lib/shop-catalog';
import type { SansuUserPublic } from '../lib/types';

import DiceBearAvatar from './DiceBearAvatar';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { box: string; emoji: string }> = {
  sm: { box: 'h-14 w-14', emoji: 'text-3xl' },
  md: { box: 'h-20 w-20', emoji: 'text-5xl' },
  lg: { box: 'h-28 w-28', emoji: 'text-7xl' },
  xl: { box: 'h-44 w-44', emoji: 'text-8xl' },
};

// アバターを装備アイテムごと重ねて描画する。
// 下から: 背景 → フレーム(リング) → キャラ本体（ぼうし/メガネ等は本体に含まれる）。
// ぼうし・メガネ・ふく・ひげ は avatarConfig（DiceBear）の一部なので合成が自然。
// 背景/フレーム/エフェクトはショップの装備（equippedItems）。未装備はテーマ色。
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
  // エフェクトはアバター全体にかける。くるくるは速すぎると目が回るのでゆっくり回す。
  const effectFinal =
    effectClass === 'animate-spin'
      ? 'animate-[spin_2.4s_linear_infinite]'
      : effectClass;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${s.box} ${bgClass} ${frameClass} ${effectFinal} ${className}`}
      aria-label={`${user.name}のアバター`}
    >
      {user.avatarConfig ? (
        <DiceBearAvatar
          config={user.avatarConfig}
          title={`${user.name}のアバター`}
        />
      ) : (
        <span className={`${s.emoji} leading-none`} aria-hidden>
          {user.avatar}
        </span>
      )}
    </div>
  );
}
