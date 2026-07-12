'use client';

import React, { useState } from 'react';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';

type Section = {
  emoji: string;
  title: string;
  id: string;
  items: { icon: string; text: string }[];
};

const SECTIONS: Section[] = [
  {
    emoji: '🪙',
    title: 'コインの もらいかた',
    id: 'coins',
    items: [
      { icon: '➕', text: 'たし算をクリアすると 10コイン' },
      { icon: '➖', text: 'ひき算をクリアすると 35コイン' },
      { icon: '✖️', text: 'かけ算をクリアすると 60コイン' },
      { icon: '➗', text: 'わり算をクリアすると 90コイン' },
      { icon: '🎲', text: 'ミックスをクリアすると 50コイン' },
      { icon: '⚡', text: '自己ベスト更新で +20コイン ボーナス！' },
      { icon: '🔥', text: '3日連続で +10コイン、7日連続で +30コイン' },
      { icon: '📅', text: 'デイリーチャレンジをクリアで +50pt ボーナス！' },
      { icon: '🎰', text: 'クリア後のルーレットで コインが最大 5倍に！' },
    ],
  },
  {
    emoji: '🛍️',
    title: 'コインの つかいかた',
    id: 'spend',
    items: [
      { icon: '🎮', text: 'ミニゲーム1回 = 10コイン（さんすうを1回解くと5回分もらえる）' },
      { icon: '▶️', text: 'ゲームオーバーのコンティニュー = 15コイン' },
      { icon: '🎨', text: '着せ替え画面 = 3分ごと10コイン（おとくに使おう！）' },
      { icon: '🛍️', text: 'おみせでアバターアイテムと交換できるよ' },
    ],
  },
  {
    emoji: '🏅',
    title: 'バッジの もらいかた',
    id: 'badges',
    items: [
      { icon: '👣', text: 'はじめて100マスをクリアするともらえる（はじめの一歩）' },
      { icon: '💎', text: '全問正解（パーフェクト）でもらえるバッジがあるよ' },
      { icon: '⚡', text: '速くクリアすると スピード系バッジが手に入る（5分切り〜30秒切り）' },
      { icon: '🔥', text: '毎日練習すると 連続日数バッジがもらえる（3・7・14・30・100日）' },
      { icon: '🎓', text: '全レベルクリアで 演算マスターバッジ（たし算・ひき算・かけ算・わり算）' },
      { icon: '🌅', text: '朝6〜9時に練習すると「はやおき！」バッジ' },
      { icon: '🎮', text: 'ミニゲームのスコアが上がると 限定バッジがもらえるよ！' },
    ],
  },
  {
    emoji: '🎮',
    title: 'ミニゲームの あそびかた',
    id: 'minigame',
    items: [
      { icon: '📐', text: 'まず さんすうを1回クリアすると 「あそべる回数」が5回もらえる' },
      { icon: '🎯', text: 'あそべる回数を使ってミニゲームで遊べるよ（1回=10コイン）' },
      { icon: '🏆', text: 'ミニゲームで高スコアを出すと 限定バッジをもらえる' },
      { icon: '💡', text: 'コイン節約ポイント: ゲームオーバーより次回新規プレイの方が安い場合も！' },
    ],
  },
  {
    emoji: '📅',
    title: 'デイリーチャレンジ',
    id: 'daily',
    items: [
      { icon: '🌟', text: '毎日かわるチャレンジレベルが あるよ（ホーム画面から確認）' },
      { icon: '🎁', text: 'クリアすると +50pt の特別ボーナス！' },
      { icon: '📆', text: '毎日1回だけ挑戦できる。明日また新しいチャレンジが来るよ' },
    ],
  },
  {
    emoji: '💡',
    title: 'タイムを あげるコツ',
    id: 'tips',
    items: [
      { icon: '🔢', text: 'まず ひくい レベルでパーフェクトをめざそう' },
      { icon: '📝', text: '九九（かけ算）は 全部おぼえると スピードアップ！' },
      { icon: '🎯', text: 'まちがいより スピード重視の練習と、全問正解重視の練習を 分けてやってみよう' },
      { icon: '📈', text: 'きろくページで タイムのグラフを見ながら じぶんの 成長を確認しよう' },
    ],
  },
];

function AccordionSection({ section }: { section: Section }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-5 text-left font-bold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700/50"
        aria-expanded={open}
        data-testid={`help-section-${section.id}`}
      >
        <span className="text-lg">
          {section.emoji} {section.title}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open ? (
        <ul className="divide-y divide-gray-100 px-5 pb-4 dark:divide-gray-700">
          {section.items.map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-3 py-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="mt-0.5 text-base">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function HelpPage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-4 px-4 py-8">
        <Header
          title="あそびかた"
          description="コインやバッジのひみつを しろう！"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          💡 タップして くわしく みてみよう！
        </p>

        <div className="space-y-3" data-testid="help-sections">
          {SECTIONS.map((s) => (
            <AccordionSection key={s.id} section={s} />
          ))}
        </div>
      </div>
    </main>
  );
}
