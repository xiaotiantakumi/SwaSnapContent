'use client';

import React, { useState } from 'react';

import type { SansuSession } from '../lib/types';

interface Props {
  session: SansuSession;
  durationText: string;
}

function buildShareText(session: SansuSession, durationText: string): string {
  const isPerfect = session.correctCount === session.totalProblems;
  const accuracy = Math.round((session.correctCount / session.totalProblems) * 100);
  const opLabel: Record<string, string> = {
    add: 'たし算',
    sub: 'ひき算',
    mul: 'かけ算',
    div: 'わり算',
    mixed: 'まぜまぜ',
  };
  const op = session.level === 'mix' ? 'まぜまぜ' : (opLabel[session.operation] ?? session.operation);
  const lines = [
    `100マス計算 ${session.level !== 'mix' ? `Lv.${session.level} ` : ''}${op}`,
    `⏱ タイム: ${durationText}`,
    `✅ せいかい: ${session.correctCount}/${session.totalProblems}（${accuracy}%）`,
  ];
  if (isPerfect) lines.push('🎉 パーフェクト！');
  lines.push('#100マス計算 #算数');
  return lines.join('\n');
}

export default function ShareButton({ session, durationText }: Props): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = buildShareText(session, durationText);
    const url = 'https://snap-content.takumi-oda.com/sansu-100';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '100マス計算の結果', text, url });
        return;
      } catch {
        // キャンセル or 非対応→クリップボードへ
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 不可
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 active:bg-emerald-700"
      data-testid="share-btn"
    >
      {copied ? (
        <>✅ コピーしたよ！</>
      ) : (
        <>📤 けっかをシェア</>
      )}
    </button>
  );
}
