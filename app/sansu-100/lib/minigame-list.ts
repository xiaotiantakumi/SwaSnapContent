import type { MinigameId } from './minigame-rewards';

export type MinigameMeta = {
  id: MinigameId;
  name: string;
  emoji: string;
  desc: string;
  available: boolean; // 実装済みで遊べるか（ゲームを作るたびに true にする）
};

// ミニゲーム一覧。新ゲームを作ったら available を true にし、ルート minigame/<id> を用意する。
export const MINIGAMES: readonly MinigameMeta[] = [
  {
    id: 'snake',
    name: 'スネーク',
    emoji: '🐍',
    desc: 'りんごを たべて のびよう',
    available: true,
  },
  {
    id: 'runner',
    name: 'よけよけランナー',
    emoji: '🏃',
    desc: 'ジャンプで よけよう',
    available: true,
  },
  {
    id: 'whack',
    name: 'もぐらたたき',
    emoji: '🔨',
    desc: '🐹を タップ！💣は だめ',
    available: true,
  },
  {
    id: 'breakout',
    name: 'ブロックくずし',
    emoji: '🧱',
    desc: 'パドルで ボールを はねかえそう',
    available: true,
  },
  {
    id: 'falling',
    name: 'おちものよけ',
    emoji: '🪨',
    desc: '🪨を よけよう',
    available: true,
  },
];
