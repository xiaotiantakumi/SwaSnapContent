'use client';

import React, { useMemo } from 'react';

import { buildAvatarSvg } from '../lib/avatar-svg';
import type { AvatarConfig } from '../lib/types';

// パーツ組み立て式アバターを SVG で描画する。親要素いっぱいに広がる。
export default function DiceBearAvatar({
  config,
  className = '',
  title,
}: {
  config: AvatarConfig;
  className?: string;
  title?: string;
}): React.JSX.Element {
  const svg = useMemo(() => buildAvatarSvg(config), [config]);
  return (
    <div
      className={`size-full [&>svg]:size-full ${className}`}
      role="img"
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
