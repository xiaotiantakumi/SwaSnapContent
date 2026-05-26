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

  // 演算別集計
  const opCounts: Record<string, number> = {};
  for (const s of sessions) {
    opCounts[s.operation] = (opCounts[s.operation] ?? 0) + 1;
  }
  const opData = Object.entries(opCounts).map(([op, count]) => ({
    name: OP_LABELS[op] ?? op,
    count,
  }));

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
    </div>
  );
}
