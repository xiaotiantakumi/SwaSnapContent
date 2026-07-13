'use client';
// だるまさんがころんだ – press-your-luck（純ロジックは daruma-logic.ts）

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import {
  createDarumaGS,
  playerPos,
  stepDaruma,
  TICK_MS,
  type DarumaGS,
  type DarumaPhase,
} from './logic/daruma-logic';

const CW = 320;
const CH = 200;

function chantDisplayText(gs: DarumaGS): string {
  if (gs.phase !== 'chant') return gs.chant.join('');
  const displayed = gs.chant.slice(0, gs.chantIdx);
  const current = gs.chant[gs.chantIdx] ?? '';
  return displayed.join('') + current;
}

function isFreezePhase(phase: DarumaPhase): boolean {
  return phase === 'tell' || phase === 'turn';
}

function drawGame(ctx: CanvasRenderingContext2D, gs: DarumaGS): void {
  ctx.fillStyle = '#e8f4e8';
  ctx.fillRect(0, 0, CW, CH);

  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(0, CH - 30, CW, 30);

  const oniX = CW - 40;
  const oniY = CH - 65;
  const isFacing = gs.phase === 'tell' || gs.phase === 'turn';
  ctx.font = '36px "Apple Color Emoji","Segoe UI Emoji",serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(isFacing ? '🔴' : '🪆', oniX, oniY);

  const pos = playerPos(gs);
  const px = Math.round(30 + pos * (oniX - 60));
  const py = CH - 65;
  ctx.fillText('🏃', px, py);

  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(oniX - 10, CH - 80);
  ctx.lineTo(oniX - 10, CH - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (gs.phase === 'chant') {
    const displayed = gs.chant.slice(0, gs.chantIdx);
    const current = gs.chant[gs.chantIdx] ?? '';
    const full = displayed.join('') + current;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(full, CW / 2, 40);
    if (current) {
      const prevW = ctx.measureText(displayed.join('')).width;
      const curW = ctx.measureText(current).width;
      const startX = CW / 2 - ctx.measureText(full).width / 2 + prevW;
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(current, startX + curW / 2, 40);
    }
  }

  if (gs.phase === 'tell') {
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('⚠ ふりむくよ…', CW / 2, 36);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('（まだ うごいてOK）', CW / 2, 62);
  }

  if (gs.phase === 'turn') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ふりむいた！ とまれ！', CW / 2, 40);
  }

  if (gs.phase === 'resolve' && gs.resolveKind === 'safe') {
    const danger = gs.lastDangerMult.toFixed(1);
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`セーフ！ +${gs.lastGain}`, CW / 2, 36);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(`×${danger}倍`, CW / 2, 62);
  }

  if (gs.phase === 'resolve' && gs.resolveKind === 'caught') {
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('つかまった！', CW / 2, 40);
  }

  if (gs.phase === 'clear') {
    ctx.fillStyle = '#2980b9';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ラウンドクリア！', CW / 2, 40);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(`R${gs.round}`, CW / 2, 66);
  }

  ctx.fillStyle = '#555';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Rnd ${gs.round}`, 8, 14);
  ctx.fillText(`❤️×${gs.lives}`, 8, 28);
  ctx.textAlign = 'right';
  ctx.fillText(`コンボ ${gs.combo}`, CW - 8, 14);
  ctx.fillText(`みかくてい ${Math.round(gs.pending * 1000)}`, CW - 8, 28);
}

export default function DarumaGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<DarumaGS | null>(null);
  const overRef = useRef(false);
  const tapsThisTickRef = useRef(0);
  const soundOnRef = useRef(storage.getSettings().soundOn);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<DarumaPhase>('chant');
  const [chantDisplay, setChantDisplay] = useState('だるまさんがころんだ');
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [pendingPts, setPendingPts] = useState(0);

  const tap = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.over) return;
    if (gs.phase === 'chant' || gs.phase === 'tell' || gs.phase === 'turn') {
      tapsThisTickRef.current++;
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

    soundOnRef.current = storage.getSettings().soundOn;
    const rng = Math.random.bind(Math);
    const gs = createDarumaGS(rng);
    gsRef.current = gs;
    overRef.current = false;
    tapsThisTickRef.current = 0;

    let prevScore = 0;
    let prevPhase: DarumaPhase = 'chant';
    let prevLives = gs.lives;
    let prevCombo = 0;
    let prevPending = 0;

    const handle = startGameLoop({
      stepMs: () => TICK_MS,
      onTick: () => {
        if (overRef.current) return;

        const taps = tapsThisTickRef.current;
        tapsThisTickRef.current = 0;

        stepDaruma(gs, taps, rng, (ev) => {
          if (!soundOnRef.current) return;
          switch (ev) {
            case 'turn':
            case 'doubletake':
              sound.crash();
              break;
            case 'bank':
              sound.eat();
              break;
            case 'caught':
              sound.wrong();
              break;
            case 'clear':
              sound.fanfare();
              break;
            default:
              break;
          }
        });

        if (gs.score !== prevScore) {
          prevScore = gs.score;
          setScore(gs.score);
        }
        if (gs.lives !== prevLives) {
          prevLives = gs.lives;
          setLives(gs.lives);
        }
        if (gs.combo !== prevCombo) {
          prevCombo = gs.combo;
          setCombo(gs.combo);
        }
        if (gs.pending !== prevPending) {
          prevPending = gs.pending;
          setPendingPts(Math.round(gs.pending * 1000));
        }
        if (gs.phase !== prevPhase) {
          prevPhase = gs.phase;
          setPhase(gs.phase);
          setChantDisplay(chantDisplayText(gs));
        } else if (gs.phase === 'chant') {
          const next = chantDisplayText(gs);
          setChantDisplay((prev) => (prev === next ? prev : next));
        }

        if (gs.over && !overRef.current) {
          overRef.current = true;
          handle.stop();
          onGameOverRef.current(gs.score);
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

  const isFreezing = isFreezePhase(phase);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>
          スコア: <span className="tabular-nums">{score}</span>
        </span>
        <span className={isFreezing ? 'animate-pulse text-red-500' : 'text-gray-400'}>
          {isFreezing ? '⚠ うごくな！' : chantDisplay}
        </span>
      </div>

      <div className="flex w-full justify-between px-1 text-xs text-gray-600 dark:text-gray-400">
        <span>❤️×{lives}</span>
        <span>コンボ {combo}</span>
        <span>みかくてい {pendingPts}</span>
      </div>

      <canvas
        ref={canvasRef}
        className="cursor-pointer rounded-xl shadow-lg"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          tap();
        }}
      />

      <button
        type="button"
        className="w-full max-w-xs rounded-2xl bg-green-500 py-5 text-xl font-bold text-white active:bg-green-700"
        onPointerDown={(e) => {
          e.preventDefault();
          tap();
        }}
        aria-label="だるまたたき"
      >
        {isFreezing ? '🛑 とまれ！' : '👆 タップ！タップ！タップ！'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        鬼が ふりむく前に どこまで ちかづける？ ふりむいたら とまれ！
      </p>
    </div>
  );
}
