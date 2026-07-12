'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// おぼえてタッチ（サイモンセイズ風の記憶ゲーム）
// 4色ボタンが順番に光るので、同じ順でタップする。正解するたびに1つ増えてレベルアップ。
// 間違えたら終了、そこまでクリアしたレベル数（=シーケンス長-1）がスコア。

const PADS = [
  { id: 0, color: '#ef4444' },
  { id: 1, color: '#3b82f6' },
  { id: 2, color: '#eab308' },
  { id: 3, color: '#22c55e' },
] as const;

type Phase = 'showing' | 'input' | 'gap' | 'wrong';

export default function OboeteTouchGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIdx, setInputIdx] = useState(0);
  const [litPad, setLitPad] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('showing');
  const soundRef = useRef(true);
  const overRef = useRef(false);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    setSequence([Math.floor(Math.random() * PADS.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  // シーケンスが変わるたびに、最初から順番に光らせて見せる
  useEffect(() => {
    if (sequence.length === 0 || overRef.current) return;
    setPhase('showing');
    setInputIdx(0);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    sequence.forEach((padId, i) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setLitPad(padId);
          if (soundRef.current) sound.correct();
        }, i * 650)
      );
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setLitPad(null);
        }, i * 650 + 400)
      );
    });
    timers.push(
      setTimeout(
        () => {
          if (cancelled) return;
          setPhase('input');
        },
        sequence.length * 650
      )
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [sequence]);

  const handlePadTap = useCallback(
    (padId: number) => {
      if (phase !== 'input' || overRef.current) return;
      setLitPad(padId);
      setTimeout(() => setLitPad(null), 200);

      if (padId !== sequence[inputIdx]) {
        overRef.current = true;
        setPhase('wrong');
        if (soundRef.current) sound.crash();
        onGameOver(sequence.length - 1);
        return;
      }

      if (soundRef.current) sound.correct();
      const nextIdx = inputIdx + 1;
      if (nextIdx === sequence.length) {
        // 1ラウンドクリア → 次のシーケンスが始まるまでは入力を受け付けない
        // （'gap' 中にパッドをタップできてしまうと、直前の正解パッドへの二重判定や
        // 誤った即ゲームオーバーが起きるため）
        setPhase('gap');
        if (soundRef.current) sound.fanfare();
        setTimeout(() => {
          if (overRef.current) return;
          setSequence((s) => [...s, Math.floor(Math.random() * PADS.length)]);
        }, 700);
      } else {
        setInputIdx(nextIdx);
      }
    },
    [phase, sequence, inputIdx, onGameOver]
  );

  const level = Math.max(0, sequence.length - 1);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        レベル {level}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="oboete-status">
        {phase === 'input'
          ? 'じゅんばん どおりに タッチ！'
          : phase === 'wrong'
            ? 'ざんねん！'
            : phase === 'gap'
              ? 'せいかい！ つぎへ…'
              : 'よく みてね…'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PADS.map((p) => {
          const isLit = litPad === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={phase !== 'input'}
              onClick={() => handlePadTap(p.id)}
              data-testid={`oboete-pad-${p.id}`}
              className="size-24 rounded-2xl transition-all duration-100 ease-out active:scale-90 disabled:active:scale-100"
              style={{
                backgroundColor: p.color,
                filter: isLit ? 'brightness(1.6) saturate(1.3)' : 'brightness(0.55)',
                boxShadow: isLit
                  ? `0 0 0 4px white, 0 0 30px 10px ${p.color}`
                  : '0 2px 4px rgba(0,0,0,0.2)',
                transform: isLit ? 'scale(1.08)' : 'scale(1)',
              }}
              aria-label={`パッド${p.id + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
