'use client';

import React, { useEffect, useState } from 'react';

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';

import { BADGES_BY_ID, TIER_COLORS, type BadgeDef } from '../lib/badge-catalog';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

interface BadgeUnlockOverlayProps {
  badgeIds: string[];
  onDone: () => void;
}

function fireConfetti(tier: BadgeDef['tier']) {
  const colors =
    tier === 'rainbow'
      ? ['#ff5e7e', '#ffd966', '#7ee59a', '#7ec9ff', '#c084fc']
      : tier === 'gold'
        ? ['#ffd966', '#ffbb33']
        : tier === 'silver'
          ? ['#d6d6d6', '#a3a3a3']
          : ['#cd7f32', '#a0522d'];
  confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 }, colors });
  confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors });
  confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors });
}

export default function BadgeUnlockOverlay({
  badgeIds,
  onDone,
}: BadgeUnlockOverlayProps): React.JSX.Element | null {
  const [idx, setIdx] = useState(0);
  const settings =
    typeof window !== 'undefined' ? storage.getSettings() : { soundOn: true };

  const badge: BadgeDef | undefined = BADGES_BY_ID[badgeIds[idx]];

  useEffect(() => {
    if (!badge) return;
    fireConfetti(badge.tier);
    if (settings.soundOn) sound.fanfare();
    const timer = setTimeout(() => {
      if (idx + 1 < badgeIds.length) setIdx(idx + 1);
      else onDone();
    }, 3500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (badgeIds.length === 0) return null;
  if (!badge) return null;

  const handleNext = () => {
    if (idx + 1 < badgeIds.length) setIdx(idx + 1);
    else onDone();
  };

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex w-full flex-col items-center justify-center bg-black/70 p-4 text-left"
      onClick={handleNext}
      aria-label="新しいバッジ獲得 つぎへ"
      data-testid="badge-unlock-overlay"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={badge.id}
          initial={{ scale: 0, rotateY: 180, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">
            ✨ NEW BADGE！ ✨
          </p>
          <div
            className={`flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br ${TIER_COLORS[badge.tier]} p-6 shadow-2xl`}
          >
            <div className="text-8xl drop-shadow-lg">{badge.icon}</div>
            <div className="rounded-xl bg-white/90 px-6 py-2 dark:bg-black/40">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {badge.name}
              </p>
            </div>
            <p className="max-w-xs text-center text-sm font-semibold text-white drop-shadow">
              {badge.description}
            </p>
          </div>
          <p className="mt-2 text-sm text-white/80">
            タップで {idx + 1 < badgeIds.length ? 'つぎへ →' : 'とじる'}（
            {idx + 1}/{badgeIds.length}）
          </p>
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
