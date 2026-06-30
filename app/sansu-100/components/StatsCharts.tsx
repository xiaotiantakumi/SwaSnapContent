'use client';

import React from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { SansuSession } from '../lib/types';

interface StatsChartsProps {
  sessions: SansuSession[];
}

const OP_LABELS: Record<string, string> = {
  add: 'たし算',
  sub: 'ひき算',
  mul: 'かけ算',
  div: 'わり算',
  mixed: 'ミックス',
};

export default function StatsCharts({
  sessions,
}: StatsChartsProps): React.JSX.Element {
  if (sessions.length === 0) {
    return (
      <p className="text-center text-gray-600 dark:text-gray-400">
        まだ きろくが ないよ。れんしゅうしてみよう！
      </p>
    );
  }

  // タイム推移（最新50件）
  const recent = sessions.slice(-50);
  const timeData = recent.map((s, i) => ({
    n: i + 1,
    seconds: Math.round(s.durationMs / 100) / 10,
    accuracy: Math.round((s.correctCount / s.totalProblems) * 100),
  }));

  // 演算別集計（回数 + 正答率）
  type OpStat = { correct: number; total: number; count: number };
  const opStats = new Map<string, OpStat>();
  for (const s of sessions) {
    const cur = opStats.get(s.operation) ?? { correct: 0, total: 0, count: 0 };
    cur.correct += s.correctCount;
    cur.total += s.totalProblems;
    cur.count += 1;
    opStats.set(s.operation, cur);
  }
  const opData = Array.from(opStats.entries()).map(([op, stat]) => ({
    name: OP_LABELS[op] ?? op,
    count: stat.count,
    accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    hasEnoughData: stat.total >= 10,
  }));

  // 正答率グラフ用（十分なデータのある演算のみ）
  const accuracyData = opData.filter((d) => d.hasEnoughData);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
          ⏱️ タイム & 正かい率の すいい
        </h3>
        <div className="h-64 rounded-xl bg-white p-2 dark:bg-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="n" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="seconds"
                name="秒"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy"
                name="正解率(%)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
          🎯 れんしゅう回数 by 演算
        </h3>
        <div className="h-64 rounded-xl bg-white p-2 dark:bg-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={opData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section data-testid="accuracy-by-op">
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
          ✅ 演算別 正かい率
        </h3>
        {accuracyData.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            もう少し れんしゅうすると グラフが でるよ！
          </p>
        ) : (
          <div className="h-48 rounded-xl bg-white p-2 dark:bg-gray-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${String(v)}%`, '正かい率']} />
                <Bar dataKey="accuracy" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* 演算別サマリーを数値でも表示 */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {opData.map((d) => (
            <div
              key={d.name}
              className={`rounded-xl p-3 text-center ${d.hasEnoughData ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-gray-700/40'}`}
            >
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{d.name}</p>
              <p className={`text-xl font-bold ${d.accuracy >= 90 ? 'text-green-600 dark:text-green-400' : d.accuracy >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}>
                {d.hasEnoughData ? `${d.accuracy}%` : '-'}
              </p>
              <p className="text-xs text-gray-400">{d.count}かい</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
