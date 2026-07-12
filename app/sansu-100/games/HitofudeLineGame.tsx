'use client';

import React, { useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ひとふでライン（一筆書きパズル）
// 中心のハブノードから三角形の「花びら」が複数のびる図形を、同じ線を二度通らずに
// なぞりきる。花びらはどれも3頂点サイクル（次数2）で、ハブは花びらの数×2の次数を
// 持つため全頂点が偶数次数＝どの頂点から始めても必ず一筆書きできる。
// 全部なぞれたら次のレベル（花びらが1つ増える）へ。制限時間切れで終了。

const VIEW = 300;
const CENTER = VIEW / 2;
const RADIUS = 105;
const NODE_R = 14;
const TIME_LIMIT_SEC = 45;

type Node = { id: number; x: number; y: number };
type Edge = { id: string; a: number; b: number; traced: boolean };

interface Puzzle {
  nodes: Node[];
  edges: Edge[];
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildPuzzle(petals: number): Puzzle {
  const nodes: Node[] = [{ id: 0, x: CENTER, y: CENTER }];
  const edges: Edge[] = [];
  const spread = (Math.PI / petals) * 0.38;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const aId = 1 + i * 2;
    const bId = 2 + i * 2;
    const ax = CENTER + Math.cos(angle - spread) * RADIUS;
    const ay = CENTER + Math.sin(angle - spread) * RADIUS;
    const bx = CENTER + Math.cos(angle + spread) * RADIUS;
    const by = CENTER + Math.sin(angle + spread) * RADIUS;
    nodes.push({ id: aId, x: ax, y: ay });
    nodes.push({ id: bId, x: bx, y: by });
    edges.push({ id: edgeKey(0, aId), a: 0, b: aId, traced: false });
    edges.push({ id: edgeKey(aId, bId), a: aId, b: bId, traced: false });
    edges.push({ id: edgeKey(bId, 0), a: bId, b: 0, traced: false });
  }
  return { nodes, edges };
}

function petalsForLevel(level: number): number {
  return Math.min(6, 1 + level);
}

export default function HitofudeLineGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => buildPuzzle(petalsForLevel(1)));
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);

  const overRef = useRef(false);
  const soundRef = useRef(true);
  const timeLeftRef = useRef(TIME_LIMIT_SEC);
  const clearedRef = useRef(0);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    clearedRef.current = 0;
    overRef.current = false;

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
          onGameOver(clearedRef.current);
        }
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  const tapNode = (nodeId: number) => {
    if (overRef.current) return;
    if (currentNode === null) {
      setCurrentNode(nodeId);
      return;
    }
    if (nodeId === currentNode) return;
    const key = edgeKey(currentNode, nodeId);
    const edge = puzzle.edges.find((e) => e.id === key);
    if (!edge || edge.traced) return; // 隣接していない or すでになぞった線

    const nextEdges = puzzle.edges.map((e) => (e.id === key ? { ...e, traced: true } : e));
    setPuzzle({ nodes: puzzle.nodes, edges: nextEdges });
    setCurrentNode(nodeId);
    if (soundRef.current) sound.correct();

    if (nextEdges.every((e) => e.traced)) {
      // クリア → 次のレベルへ
      clearedRef.current = level;
      if (soundRef.current) sound.fanfare();
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setPuzzle(buildPuzzle(petalsForLevel(nextLevel)));
      setCurrentNode(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xs items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>レベル {level}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full max-w-xs rounded-xl bg-white shadow-md dark:bg-gray-900"
        data-testid="hitofude-svg"
      >
        {puzzle.edges.map((e) => {
          const na = puzzle.nodes.find((n) => n.id === e.a);
          const nb = puzzle.nodes.find((n) => n.id === e.b);
          if (!na || !nb) return null;
          return (
            <line
              key={e.id}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke={e.traced ? '#22c55e' : '#cbd5e1'}
              strokeWidth={e.traced ? 6 : 4}
              strokeLinecap="round"
              data-testid={`hitofude-edge-${e.id}`}
              data-traced={e.traced ? 'true' : 'false'}
            />
          );
        })}
        {puzzle.nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={NODE_R}
            fill={currentNode === n.id ? '#f97316' : '#6366f1'}
            stroke="white"
            strokeWidth={2}
            data-testid={`hitofude-node-${n.id}`}
            onClick={() => tapNode(n.id)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        点を じゅんばんに タップして、ぜんぶの せんを 一ふでで なぞろう
      </p>
    </div>
  );
}
