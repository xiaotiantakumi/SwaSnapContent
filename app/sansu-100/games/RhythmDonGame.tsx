'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import {
  createRhythmGS,
  stepRhythm,
  tapRhythm,
  DEFAULT_RHYTHM_CONFIG,
  TICK_MS,
  type RhythmGS,
} from './logic/rhythmdon-logic';

// リズムでドン（簡易リズムゲーム）
// 2レーンにノーツが降ってくるので、判定ラインに重なったタイミングでタップ/キー入力する。
// タイミングが合えば正解、判定ラインを過ぎると1回ミス（ライフ-1）。
// 制限時間経過 or ライフ0で終了。正解数がスコア。

const cfg = DEFAULT_RHYTHM_CONFIG;

export default function RhythmDonGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [notes, setNotes] = useState<RhythmGS['notes']>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(cfg.lives);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(cfg.gameDurationMs / 1000));
  const [flash, setFlash] = useState<number | null>(null); // ヒットしたレーンを一瞬光らせる

  const gsRef = useRef<RhythmGS>(createRhythmGS(cfg));
  const finishedRef = useRef(false);
  const soundRef = useRef(true);
  const startRef = useRef(0);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onGameOver(gsRef.current.score);
  }, [onGameOver]);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    startRef.current = Date.now();
    gsRef.current = createRhythmGS(cfg);
    finishedRef.current = false;

    const interval = setInterval(() => {
      if (gsRef.current.over || finishedRef.current) return;
      const elapsed = Date.now() - startRef.current;

      let missedThisTick = false;
      stepRhythm(gsRef.current, elapsed, cfg, (ev) => {
        if (ev === 'miss') missedThisTick = true;
        if (ev === 'miss' && soundRef.current) sound.crash();
        if (ev === 'over') finish();
      });

      if (missedThisTick) {
        setLives(Math.max(0, gsRef.current.lives));
      }
      if (gsRef.current.over || finishedRef.current) return;

      setTimeLeft(Math.max(0, Math.ceil((cfg.gameDurationMs - elapsed) / 1000)));
      setNotes([...gsRef.current.notes]);
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  const tapLane = useCallback((lane: number) => {
    if (gsRef.current.over || finishedRef.current) return;
    const elapsed = Date.now() - startRef.current;
    const hit = tapRhythm(gsRef.current, lane, elapsed, cfg, () => {});
    if (!hit) return;

    setNotes([...gsRef.current.notes]);
    setScore(gsRef.current.score);
    if (soundRef.current) sound.correct();
    setFlash(lane);
    setTimeout(() => setFlash(null), 150);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') tapLane(0);
      else if (e.key === 'ArrowRight') tapLane(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tapLane]);

  const now = Date.now() - startRef.current;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums">{score}</span></span>
        <span>{'❤️'.repeat(lives)}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>

      <div className="relative h-72 w-full max-w-xs overflow-hidden rounded-2xl bg-gray-900">
        {Array.from({ length: cfg.lanes }, (_, lane) => (
          <div
            key={lane}
            className="absolute inset-y-0 border-r border-gray-700 last:border-r-0"
            style={{ left: `${(lane / cfg.lanes) * 100}%`, width: `${100 / cfg.lanes}%` }}
          >
            {/* 判定ライン */}
            <div
              className={`absolute inset-x-0 bottom-10 h-1 ${
                flash === lane ? 'bg-yellow-300' : 'bg-gray-500'
              }`}
            />
          </div>
        ))}
        {notes.map((n) => {
          const progress = Math.min(1.15, (now - n.spawnedAt) / cfg.noteTravelMs);
          const topPct = progress * 78; // 判定ライン(bottom-10相当)付近まで
          return (
            <div
              key={n.id}
              data-testid={`rhythmdon-note-${n.id}`}
              data-lane={n.lane}
              className="absolute size-10 -translate-x-1/2 rounded-full bg-pink-400 shadow"
              style={{
                left: `${(n.lane + 0.5) * (100 / cfg.lanes)}%`,
                top: `${topPct}%`,
              }}
            />
          );
        })}
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        {Array.from({ length: cfg.lanes }, (_, lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => tapLane(lane)}
            data-testid={`rhythmdon-lane-${lane}`}
            className={`rounded-xl py-6 text-2xl font-bold text-white shadow transition-colors active:scale-95 ${
              flash === lane ? 'bg-yellow-400' : 'bg-pink-500 hover:bg-pink-600'
            }`}
            aria-label={`レーン${lane + 1}`}
          >
            ドン！
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ノーツが せんに きたら ドン！しよう
      </p>
    </div>
  );
}
