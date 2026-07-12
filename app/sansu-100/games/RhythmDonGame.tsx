'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// リズムでドン（簡易リズムゲーム）
// 2レーンにノーツが降ってくるので、判定ラインに重なったタイミングでタップ/キー入力する。
// タイミングが合えば正解、判定ラインを過ぎると1回ミス（ライフ-1）。
// 制限時間経過 or ライフ0で終了。正解数がスコア。

const LANES = 2;
const NOTE_TRAVEL_MS = 1600; // 出現→判定ラインまでの時間
const SPAWN_INTERVAL_MS = 800;
const GAME_DURATION_MS = 25000;
const HIT_WINDOW_MS = 260; // 判定ラインからこの範囲内ならヒット扱い
const MISS_AT_MS = NOTE_TRAVEL_MS + HIT_WINDOW_MS + 150; // これを過ぎたらノーツ消滅＝ミス
const TICK_MS = 50;
const LIVES = 3;

type Note = { id: number; lane: number; spawnedAt: number; resolved: boolean };

export default function RhythmDonGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(GAME_DURATION_MS / 1000));
  const [flash, setFlash] = useState<number | null>(null); // ヒットしたレーンを一瞬光らせる

  const notesRef = useRef<Note[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const startRef = useRef(0);
  const nextSpawnIdxRef = useRef(0);
  const nextNoteIdRef = useRef(0);
  const nextSpawnAtRef = useRef(0);

  const finish = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    startRef.current = Date.now();
    nextSpawnAtRef.current = 0;

    const interval = setInterval(() => {
      if (overRef.current) return;
      const elapsed = Date.now() - startRef.current;

      if (elapsed >= GAME_DURATION_MS) {
        finish();
        return;
      }
      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000)));

      // 新しいノーツを出す（レーンは交互＝決定的）
      if (elapsed >= nextSpawnAtRef.current) {
        const lane = nextSpawnIdxRef.current % LANES;
        nextSpawnIdxRef.current += 1;
        nextSpawnAtRef.current += SPAWN_INTERVAL_MS;
        const note: Note = {
          id: nextNoteIdRef.current++,
          lane,
          spawnedAt: elapsed,
          resolved: false,
        };
        notesRef.current = [...notesRef.current, note];
      }

      // 判定ラインを過ぎて未判定のノーツはミス扱いで消す
      let missed = false;
      notesRef.current = notesRef.current.filter((n) => {
        if (n.resolved) return false;
        const age = elapsed - n.spawnedAt;
        if (age > MISS_AT_MS) {
          missed = true;
          return false;
        }
        return true;
      });
      if (missed && !overRef.current) {
        livesRef.current -= 1;
        setLives(Math.max(0, livesRef.current));
        if (soundRef.current) sound.crash();
        if (livesRef.current <= 0) {
          finish();
          return;
        }
      }

      setNotes([...notesRef.current]);
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  const tapLane = useCallback(
    (lane: number) => {
      if (overRef.current) return;
      const elapsed = Date.now() - startRef.current;
      // 判定ライン付近（NOTE_TRAVEL_MS ± HIT_WINDOW_MS）にいる、そのレーンの未判定ノーツを探す
      let best: Note | null = null;
      let bestDist = Infinity;
      for (const n of notesRef.current) {
        if (n.lane !== lane || n.resolved) continue;
        const age = elapsed - n.spawnedAt;
        const dist = Math.abs(age - NOTE_TRAVEL_MS);
        if (dist <= HIT_WINDOW_MS && dist < bestDist) {
          best = n;
          bestDist = dist;
        }
      }
      if (!best) return; // 空振りはノーペナルティ
      const hitId = best.id;

      best.resolved = true;
      notesRef.current = notesRef.current.filter((n) => n.id !== hitId);
      setNotes([...notesRef.current]);
      scoreRef.current += 1;
      setScore(scoreRef.current);
      if (soundRef.current) sound.correct();
      setFlash(lane);
      setTimeout(() => setFlash(null), 150);
    },
    []
  );

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
        {Array.from({ length: LANES }, (_, lane) => (
          <div
            key={lane}
            className="absolute inset-y-0 border-r border-gray-700 last:border-r-0"
            style={{ left: `${(lane / LANES) * 100}%`, width: `${100 / LANES}%` }}
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
          const progress = Math.min(1.15, (now - n.spawnedAt) / NOTE_TRAVEL_MS);
          const topPct = progress * 78; // 判定ライン(bottom-10相当)付近まで
          return (
            <div
              key={n.id}
              data-testid={`rhythmdon-note-${n.id}`}
              data-lane={n.lane}
              className="absolute size-10 -translate-x-1/2 rounded-full bg-pink-400 shadow"
              style={{
                left: `${(n.lane + 0.5) * (100 / LANES)}%`,
                top: `${topPct}%`,
              }}
            />
          );
        })}
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        {Array.from({ length: LANES }, (_, lane) => (
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
