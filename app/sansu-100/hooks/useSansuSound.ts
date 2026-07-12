'use client';

import { useCallback } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

type SoundType = 'correct' | 'wrong' | 'complete';

// 既存の共通効果音モジュール(lib/sound-presets.ts)に委譲する薄いラッパー。
// 全ミニゲーム(AirHockeyGame等)と同じ単一AudioContext・iOSフォールバックを共有し、
// 二重AudioContext生成やクリーンアップ漏れを避ける。
export function useSansuSound() {
  const play = useCallback((type: SoundType) => {
    if (!storage.getSettings().soundOn) return;

    switch (type) {
      case 'correct':
        sound.correct();
        break;
      case 'wrong':
        sound.wrong();
        break;
      case 'complete':
        sound.fanfare();
        break;
    }
  }, []);

  return { play };
}
