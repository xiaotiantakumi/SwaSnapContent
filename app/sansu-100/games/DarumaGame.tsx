'use client';
// だるまさんがころんだ
// コアループ:
//   1. チャントフェーズ - 「だ・る・ま・さ・ん・が・こ・ろ・ん・だ」を1文字ずつ表示。連打で前進。
//   2. 振り向きフェーズ - 最後の「だ」で鬼が振り向く。動いていたらアウト。
//   3. 鬼を通過したらクリア → 次ラウンド（難易度アップ）。

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ── Types ──────────────────────────────────────────────────────────────────
type Phase = 'chant' | 'judge' | 'safe' | 'clear';

interface GS {
  phase: Phase;
  chantChars: string[];
  chantIdx: number;
  chantTimer: number; // 残りtick（この文字を表示する時間）
  playerX: number;   // 0.0 = スタート, 1.0 = 鬼の位置
  tapsThisTick: number; // 判定フェーズ開始直前のtick内タップ数
  moving: boolean;   // 判定フェーズに入った時点で動いていたか
  judgeTimer: number; // 振り向き表示のtick
  safeTimer: number;  // セーフ表示のtick
  clearTimer: number; // クリア表示のtick
  round: number;
  score: number;
  over: boolean;
  soundOn: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────
const CHANT_BASE = ['だ', 'る', 'ま', 'さ', 'ん', 'が', 'こ', 'ろ', 'ん', 'だ'];
const JUDGE_TICKS = 30;   // 振り向き状態を維持するtick
const SAFE_TICKS  = 20;   // セーフ表示のtick
const CLEAR_TICKS = 30;   // クリア表示のtick
const TAP_ADVANCE = 0.012; // 1タップで進む距離
const CLEAR_X     = 1.05;  // この位置を超えたらクリア
const MIN_CHANT_TICKS = 6; // 最低表示時間（速くなる下限）

// チャント1文字あたりの表示tickを計算（ラウンドが上がるほど速くなる）
function chantTicks(round: number): number {
  return Math.max(MIN_CHANT_TICKS, 14 - round);
}

// たまにフェイント（短いチャントで振り向く）を挿入
function buildChant(round: number, rand: () => number): string[] {
  // ラウンド3以降でランダムにフェイント（「だるまさんがこっ…ろんだ！」）
  if (round >= 3 && rand() < 0.25) {
    const cut = 4 + Math.floor(rand() * 4); // 4〜7文字で止めて振り向く
    return CHANT_BASE.slice(0, cut).concat(['だ']); // 最後に「だ」で振り向き
  }
  return [...CHANT_BASE];
}

function createGS(rand: () => number): GS {
  return {
    phase: 'chant',
    chantChars: buildChant(1, rand),
    chantIdx: 0,
    chantTimer: chantTicks(1),
    playerX: 0,
    tapsThisTick: 0,
    moving: false,
    judgeTimer: 0,
    safeTimer: 0,
    clearTimer: 0,
    round: 1,
    score: 0,
    over: false,
    soundOn: storage.getSettings().soundOn,
  };
}

function tapScore(playerX: number): number {
  // 鬼に近いほど高得点（最大距離=0で5点、鬼直前=最大30点）
  return Math.max(1, Math.round(playerX * 30));
}

function tickGame(
  gs: GS,
  rand: () => number,
  onEvent: (ev: 'chant' | 'judge' | 'out' | 'safe' | 'clear') => void,
): void {
  if (gs.over) return;

  if (gs.phase === 'chant') {
    // 連打で前進
    if (gs.tapsThisTick > 0) {
      gs.playerX = Math.min(CLEAR_X - 0.001, gs.playerX + TAP_ADVANCE * gs.tapsThisTick);
      gs.score += tapScore(gs.playerX) * gs.tapsThisTick;
      gs.tapsThisTick = 0;
    }

    gs.chantTimer--;
    if (gs.chantTimer <= 0) {
      gs.chantIdx++;
      if (gs.chantIdx >= gs.chantChars.length) {
        // 最後の文字（「だ」）表示後 → 振り向きフェーズ
        gs.phase = 'judge';
        gs.moving = gs.tapsThisTick > 0; // 最後の文字表示中に連打していたか
        gs.tapsThisTick = 0;
        gs.judgeTimer = JUDGE_TICKS;
        onEvent('judge');
      } else {
        gs.chantTimer = chantTicks(gs.round);
        onEvent('chant');
      }
    }
  } else if (gs.phase === 'judge') {
    // 振り向き中に連打していたらアウト
    if (gs.tapsThisTick > 0) {
      gs.moving = true;
      gs.tapsThisTick = 0;
    }
    gs.judgeTimer--;
    if (gs.judgeTimer <= 0) {
      if (gs.moving) {
        // アウト
        gs.over = true;
        onEvent('out');
      } else {
        // セーフ
        gs.phase = 'safe';
        gs.safeTimer = SAFE_TICKS;
        onEvent('safe');
      }
    }
  } else if (gs.phase === 'safe') {
    gs.safeTimer--;
    if (gs.safeTimer <= 0) {
      // プレイヤーが鬼を通過していたらクリア
      if (gs.playerX >= CLEAR_X) {
        gs.phase = 'clear';
        gs.clearTimer = CLEAR_TICKS;
        gs.score += gs.round * 100; // ラウンドクリアボーナス
        onEvent('clear');
      } else {
        // 次のチャントフェーズへ
        gs.phase = 'chant';
        gs.chantChars = buildChant(gs.round, rand);
        gs.chantIdx = 0;
        gs.chantTimer = chantTicks(gs.round);
        gs.tapsThisTick = 0;
      }
    }
  } else if (gs.phase === 'clear') {
    gs.clearTimer--;
    if (gs.clearTimer <= 0) {
      // 次ラウンドへ
      gs.round++;
      gs.playerX = 0;
      gs.phase = 'chant';
      gs.chantChars = buildChant(gs.round, rand);
      gs.chantIdx = 0;
      gs.chantTimer = chantTicks(gs.round);
      gs.tapsThisTick = 0;
    }
  }
}

// ── Canvas drawing ─────────────────────────────────────────────────────────
const CW = 320;
const CH = 200;

function drawGame(ctx: CanvasRenderingContext2D, gs: GS): void {
  // 背景
  ctx.fillStyle = '#e8f4e8';
  ctx.fillRect(0, 0, CW, CH);

  // 地面
  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(0, CH - 30, CW, 30);

  // 鬼（右端）
  const oniX = CW - 40;
  const oniY = CH - 65;
  const isFacing = gs.phase === 'judge';
  ctx.font = '36px "Apple Color Emoji","Segoe UI Emoji",serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // 振り向き時は🔴、後ろ向き時は🪆
  ctx.fillText(isFacing ? '🔴' : '🪆', oniX, oniY);

  // プレイヤー（左から移動）
  const px = Math.round(30 + gs.playerX * (oniX - 60));
  const py = CH - 65;
  ctx.fillText('🏃', px, py);

  // ゴールライン
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(oniX - 10, CH - 80);
  ctx.lineTo(oniX - 10, CH - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // チャントテキスト
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (gs.phase === 'chant' || gs.phase === 'safe') {
    const displayed = gs.chantChars.slice(0, gs.chantIdx);
    const current = gs.chantChars[gs.chantIdx] ?? '';
    const full = displayed.join('') + current;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(full, CW / 2, 40);

    // 現在表示中の文字を強調
    if (current) {
      const prevW = ctx.measureText(displayed.join('')).width;
      const curW = ctx.measureText(current).width;
      const startX = CW / 2 - ctx.measureText(full).width / 2 + prevW;
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(current, startX + curW / 2, 40);
    }
  }

  if (gs.phase === 'judge') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('ふりむいた！', CW / 2, 40);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('うごいてたら アウト…', CW / 2, 72);
  }

  if (gs.phase === 'safe') {
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('セーフ！', CW / 2, 40);
  }

  if (gs.phase === 'clear') {
    ctx.fillStyle = '#2980b9';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`ラウンド${gs.round} クリア！`, CW / 2, 40);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(`+${gs.round * 100} ボーナス`, CW / 2, 72);
  }

  // スコア表示
  ctx.fillStyle = '#555';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Rnd ${gs.round}`, 10, 15);
}

// ── Component ─────────────────────────────────────────────────────────────
export default function DarumaGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS | null>(null);
  const overRef = useRef(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('chant');
  const [chantDisplay, setChantDisplay] = useState('だるまさんがころんだ');

  const tap = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.over) return;
    if (gs.phase === 'chant') {
      gs.tapsThisTick++;
    } else if (gs.phase === 'judge') {
      gs.moving = true;
      gs.tapsThisTick++;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    canvas.style.width = `${CW}px`;
    canvas.style.height = `${CH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rng = Math.random.bind(Math);
    const gs = createGS(rng);
    gsRef.current = gs;
    overRef.current = false;

    let prevScore = 0;
    let prevPhase: Phase = 'chant';

    const handle = startGameLoop({
      stepMs: () => 100,
      onTick: () => {
        if (overRef.current) return;
        tickGame(gs, rng, (ev) => {
          if (ev === 'judge' && gs.soundOn) sound.crash();
          if (ev === 'safe' && gs.soundOn) sound.eat();
          if (ev === 'clear' && gs.soundOn) sound.eat();
        });
        if (gs.score !== prevScore) {
          prevScore = gs.score;
          setScore(gs.score);
        }
        if (gs.phase !== prevPhase) {
          prevPhase = gs.phase;
          setPhase(gs.phase);
          // チャント表示更新
          const displayed = gs.chantChars.slice(0, gs.chantIdx + 1).join('');
          setChantDisplay(displayed || gs.chantChars.join(''));
        }
        if (gs.over && !overRef.current) {
          overRef.current = true;
          handle.stop();
          onGameOver(gs.score);
        }
      },
      onRender: () => drawGame(ctx, gs),
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        tap();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFreezing = phase === 'judge';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* HUD */}
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums">{score}</span></span>
        <span className={isFreezing ? 'animate-pulse text-red-500' : 'text-gray-400'}>
          {isFreezing ? '⚠ うごくな！' : chantDisplay}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-xl shadow-lg"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => { e.preventDefault(); tap(); }}
      />

      {/* タップ指示 */}
      <button
        type="button"
        className="w-full max-w-xs rounded-2xl bg-green-500 py-5 text-xl font-bold text-white active:bg-green-700"
        onPointerDown={(e) => { e.preventDefault(); tap(); }}
        aria-label="だるまたたき"
      >
        {isFreezing ? '🛑 とまれ！' : '👆 タップ！タップ！タップ！'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        「ころんだ」で ふりむく！ うごいてたら アウト
      </p>
    </div>
  );
}
