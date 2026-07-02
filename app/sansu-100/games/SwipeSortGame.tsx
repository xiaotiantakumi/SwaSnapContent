'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// スワイプわけっこ（左右フリック仕分けゲーム）
// 数字カードが表示されるので、偶数なら右へ・奇数なら左へスワイプ（または矢印キー）で仕分ける。
// 制限時間内の正解数がスコア。3回まちがえると終了。

const TIME_LIMIT = 20; // 秒
const LIVES = 3;
const SWIPE_THRESHOLD = 40; // px

function randomNumber(): number {
  return 1 + Math.floor(Math.random() * 99);
}

type Feedback = 'correct' | 'wrong' | null;

export default function SwipeSortGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [current, setCurrent] = useState(randomNumber);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [flyDir, setFlyDir] = useState<'left' | 'right' | null>(null);

  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const timeLeftRef = useRef(TIME_LIMIT);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const busyRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (overRef.current) return;
      const t = timeLeftRef.current - 1;
      timeLeftRef.current = t;
      setTimeLeft(Math.max(0, t));
      if (t <= 0) {
        clearInterval(id);
        if (!overRef.current) {
          overRef.current = true;
          if (soundRef.current) sound.crash();
          onGameOver(scoreRef.current);
        }
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  const judge = useCallback(
    (dir: 'left' | 'right') => {
      if (overRef.current || busyRef.current) return;
      busyRef.current = true;
      const isEven = current % 2 === 0;
      const correct = (dir === 'right' && isEven) || (dir === 'left' && !isEven);
      setFlyDir(dir);
      setFeedback(correct ? 'correct' : 'wrong');

      if (correct) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        if (soundRef.current) sound.correct();
      } else {
        livesRef.current -= 1;
        setLives(Math.max(0, livesRef.current));
        if (soundRef.current) sound.crash();
      }

      setTimeout(() => {
        if (livesRef.current <= 0) {
          overRef.current = true;
          onGameOver(scoreRef.current);
          return;
        }
        setCurrent(randomNumber());
        setFeedback(null);
        setFlyDir(null);
        busyRef.current = false;
      }, 280);
    },
    [current, onGameOver]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') judge('left');
      else if (e.key === 'ArrowRight') judge('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [judge]);

  const isEvenNow = current % 2 === 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums">{score}</span></span>
        <span>{'❤️'.repeat(lives)}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>

      <div
        className="flex h-40 w-full max-w-xs select-none items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg"
        style={{ touchAction: 'none' }}
        data-testid="swipesort-card"
        data-value={current}
        data-parity={isEvenNow ? 'even' : 'odd'}
        onPointerDown={(e) => {
          touchStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s0 = touchStart.current;
          touchStart.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x;
          if (Math.abs(dx) < SWIPE_THRESHOLD) return;
          judge(dx > 0 ? 'right' : 'left');
        }}
      >
        <span
          className={`text-6xl font-extrabold text-white transition-transform ${
            flyDir === 'left' ? '-translate-x-16 opacity-0' : flyDir === 'right' ? 'translate-x-16 opacity-0' : ''
          }`}
        >
          {current}
        </span>
      </div>

      {feedback ? (
        <p
          className={`text-lg font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}
          data-testid="swipesort-feedback"
        >
          {feedback === 'correct' ? '◯ せいかい！' : '× ざんねん'}
        </p>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ぐうすう(2,4,6…) は みぎへ、きすう(1,3,5…) は ひだりへ！
        </p>
      )}

      <div className="flex w-full max-w-xs justify-between gap-4">
        <button
          type="button"
          onClick={() => judge('left')}
          data-testid="swipesort-left"
          aria-label="ひだり（きすう）"
          className="flex-1 rounded-xl bg-red-100 py-4 text-2xl font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
        >
          ◀ きすう
        </button>
        <button
          type="button"
          onClick={() => judge('right')}
          data-testid="swipesort-right"
          aria-label="みぎ（ぐうすう）"
          className="flex-1 rounded-xl bg-blue-100 py-4 text-2xl font-bold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
        >
          ぐうすう ▶
        </button>
      </div>
    </div>
  );
}
