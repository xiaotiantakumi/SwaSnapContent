'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_COUNT = 4; // 1ラウンド目のバブル数
const MAX_COUNT = 9;
const LIVES_MAX = 3;
const BASE_TIME_SEC = 8; // ラウンド1の制限時間

type Bubble = {
  id: number;
  num: number;
  x: number; // % of container width
  y: number; // % of container height
  tapped: boolean;
  wrong: boolean;
};

function makeBubbles(count: number, round: number): Bubble[] {
  const nums = Array.from({ length: count }, (_, i) => i + 1);
  // Simple shuffle
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  // count個をなるべく正方形に近い行×列のグリッドへ均等配置する。
  // 列数に対して行数が足りない最終行は中央寄せにして、左詰めで浮いて見えるのを防ぐ。
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const jitter = Math.min(cellW, cellH) * 0.12; // セル内に収まる程度の揺らぎのみ
  return nums.map((num, idx) => {
    const row = Math.floor(idx / cols);
    const itemsInRow = row === rows - 1 ? count - row * cols : cols;
    const col = idx % cols;
    const rowOffset = (cols - itemsInRow) / 2; // 最終行を中央寄せ
    const x = (col + rowOffset + 0.5) * cellW + (Math.random() * 2 - 1) * jitter;
    const y = (row + 0.5) * cellH + (Math.random() * 2 - 1) * jitter;
    return {
      id: idx,
      num,
      x: Math.min(95, Math.max(5, x)),
      y: Math.min(90, Math.max(10, y)),
      tapped: false,
      wrong: false,
    };
  });
}

export default function NumberPopGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [round, setRound] = useState(1);
  // ライフを失ってラウンド内で再挑戦する(クリア/ゲームオーバーに至らない)たびにインクリメント。
  // round自体は変わらないので、タイマーeffectを再起動させるために使う。
  const [retryTick, setRetryTick] = useState(0);
  const [lives, setLives] = useState(LIVES_MAX);
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => makeBubbles(INITIAL_COUNT, 1));
  const [nextExpected, setNextExpected] = useState(1);
  const [timeLeft, setTimeLeft] = useState(BASE_TIME_SEC);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const overRef = useRef(false);
  const livesRef = useRef(LIVES_MAX);
  const roundRef = useRef(1);
  const countRef = useRef(INITIAL_COUNT);
  const scoreRef = useRef(0);

  const timeSec = Math.max(3, BASE_TIME_SEC - Math.floor(round / 2));

  const endGame = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  // Timer countdown
  useEffect(() => {
    setTimeLeft(timeSec);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          // time up — lose a life
          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          setLives(newLives);
          setFeedback('wrong');
          setTimeout(() => {
            setFeedback(null);
            if (newLives <= 0) {
              endGame();
            } else {
              // regenerate round
              const count = countRef.current;
              setBubbles(makeBubbles(count, roundRef.current));
              setNextExpected(1);
              setRetryTick((v) => v + 1);
            }
          }, 600);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, retryTick]);

  const handleTap = useCallback(
    (bubble: Bubble) => {
      if (bubble.tapped || feedback || overRef.current) return;

      if (bubble.num === nextExpected) {
        // correct
        setBubbles((prev) =>
          prev.map((b) => (b.id === bubble.id ? { ...b, tapped: true } : b))
        );
        const newExpected = nextExpected + 1;
        const count = countRef.current;

        if (newExpected > count) {
          // round cleared!
          const roundScore = roundRef.current * 10;
          scoreRef.current += roundScore;
          setScore(scoreRef.current);
          setFeedback('correct');
          setTimeout(() => {
            setFeedback(null);
            const nextRound = roundRef.current + 1;
            const nextCount = Math.min(MAX_COUNT, count + 1);
            roundRef.current = nextRound;
            countRef.current = nextCount;
            setRound(nextRound);
            setBubbles(makeBubbles(nextCount, nextRound));
            setNextExpected(1);
          }, 700);
        } else {
          setNextExpected(newExpected);
        }
      } else {
        // wrong tap
        setBubbles((prev) =>
          prev.map((b) => (b.id === bubble.id ? { ...b, wrong: true } : b))
        );
        const newLives = livesRef.current - 1;
        livesRef.current = newLives;
        setLives(newLives);
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          if (newLives <= 0) {
            endGame();
          } else {
            // reset round
            const count = countRef.current;
            setBubbles(makeBubbles(count, roundRef.current));
            setNextExpected(1);
            setRetryTick((v) => v + 1);
          }
        }, 600);
      }
    },
    [nextExpected, feedback, endGame]
  );

  const livesDisplay = Array.from({ length: LIVES_MAX }, (_, i) =>
    i < lives ? '❤️' : '🖤'
  );

  return (
    <div className="relative flex h-full select-none flex-col">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {livesDisplay.join(' ')}
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">スコア</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-300">{score}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ラウンド {round} | のこり
          </p>
          <p
            className={`text-xl font-bold ${timeLeft <= 3 ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}
          >
            {timeLeft}秒
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600 dark:text-gray-300">
        つぎは{' '}
        <span className="inline-block rounded-full bg-blue-500 px-2 py-0.5 text-sm font-bold text-white">
          {nextExpected}
        </span>{' '}
        をタップ！
      </p>

      {/* Feedback overlay */}
      {feedback ? (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl text-5xl font-bold ${
            feedback === 'correct'
              ? 'bg-green-500/20 text-green-600'
              : 'bg-red-500/20 text-red-500'
          }`}
        >
          {feedback === 'correct' ? '⭕ クリア！' : '✖ ミス！'}
        </div>
      ) : null}

      {/* Bubble field */}
      {/* 親側(page.tsx)がこのゲームの高さを固定していないため、h-full/flex-1だけでは
          このdivの高さが0pxに潰れ、top:%指定のバブルが全て同じ行に重なって見える
          （left:%は幅があるため効くが、topだけ効かず「並んでいない」ように見える）。
          min-heightで確実に高さを確保する。 */}
      <div className="relative mt-2 min-h-[280px] flex-1 rounded-2xl bg-sky-50 dark:bg-sky-900/20">
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleTap(b)}
            disabled={b.tapped}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            className={`absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl font-bold shadow-lg transition-all active:scale-95 ${
              b.tapped
                ? 'scale-110 bg-green-400 text-white opacity-40'
                : b.wrong
                  ? 'animate-bounce bg-red-400 text-white'
                  : 'bg-white text-gray-800 hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-100'
            }`}
            data-testid={`bubble-${b.num}`}
          >
            {b.num}
          </button>
        ))}
      </div>
    </div>
  );
}
