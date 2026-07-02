import type { MinigameId } from './minigame-rewards';

export type MinigameMeta = {
  id: MinigameId;
  name: string;
  emoji: string;
  desc: string;
  howTo: readonly string[]; // あそびかた（操作と目的）。各ゲームの intro で表示する
  available: boolean; // 実装済みで遊べるか（ゲームを作るたびに true にする）
};

// ミニゲーム一覧。新ゲームを作ったら available を true にし、ルート minigame/<id> を用意する。
export const MINIGAMES: readonly MinigameMeta[] = [
  {
    id: 'snake',
    name: 'スネーク',
    emoji: '🐍',
    desc: 'りんごを たべて のびよう',
    howTo: [
      'やじるしキー か スワイプ（下のボタン）で ヘビを うごかす',
      'りんご🍎を たべると ながく なって スコアアップ',
      'かべと じぶんの からだに あたると おわり',
    ],
    available: true,
  },
  {
    id: 'runner',
    name: 'よけよけランナー',
    emoji: '🏃',
    desc: 'ジャンプで よけよう',
    howTo: [
      'がめんを タップ（か スペースキー）で ジャンプ',
      'まえから くる じゃまものを ジャンプで よけよう',
      'よけるほど スコアが ふえるよ',
    ],
    available: true,
  },
  {
    id: 'whack',
    name: 'もぐらたたき',
    emoji: '🔨',
    desc: '🐹を タップ！💣は だめ',
    howTo: [
      'でてきた もぐら🐹を タップ！',
      'ばくだん💣を タップすると おわり',
      'じかんない に たくさん たたこう',
    ],
    available: true,
  },
  {
    id: 'breakout',
    name: 'ブロックくずし',
    emoji: '🧱',
    desc: 'パドルで ボールを はねかえそう',
    howTo: [
      'がめんを さわって（か やじるし）で パドルを よこに うごかす',
      'ボールを はねかえして ブロックを ぜんぶ けそう',
      'ぜんぶ けすと つぎの レベルへ。ボールを おとすと おわり',
    ],
    available: true,
  },
  {
    id: 'falling',
    name: 'おちものよけ',
    emoji: '👻',
    desc: '👻を よけよう',
    howTo: [
      '◀▶ボタン（か スワイプ・やじるし）で ひだり・みぎに うごく',
      'うえから おちてくる 👻に あたらないように よけよう',
      'ながく よけるほど スコアアップ',
    ],
    available: true,
  },
  {
    id: 'memory',
    name: 'しんけいすいじゃく',
    emoji: '🧠',
    desc: 'おなじ えを さがそう',
    howTo: [
      'カードを 2まい タップして めくる',
      'おなじ えが でたら そろう！ちがったら また うらむき',
      'ぜんぶ そろえると カードが ふえて つぎの レベルへ',
    ],
    available: true,
  },
  {
    id: 'maze',
    name: 'めいろ',
    emoji: '🗺️',
    desc: '🏁を めざそう',
    howTo: [
      'やじるし か スワイプ（下のボタン）で すすむ',
      'ゴール🏁を めざそう',
      'クリアするほど めいろが おおきく なるよ',
    ],
    available: true,
  },
  {
    id: 'flappy',
    name: 'ぱたぱた',
    emoji: '🐤',
    desc: 'タップで すき間を くぐろう',
    howTo: [
      'がめんを タップ（か スペースキー）で はばたく',
      'つちかんの すき間を くぐろう',
      'つちかんや 地めんに ぶつかると おわり',
    ],
    available: true,
  },
  {
    id: 'pakupaku',
    name: 'パクパクおじさん',
    emoji: '👴',
    desc: 'ドットを たべまくれ！おばけに きをつけて',
    howTo: [
      'やじるし か スワイプで うごく',
      'ドット●を たべて スコアアップ。ぜんぶ たべると まわり！',
      'パワー餌◎を たべると てきが よわるよ。うしろから のみこもう！',
    ],
    available: true,
  },
  {
    id: 'oboete',
    name: 'おぼえてタッチ',
    emoji: '🧠',
    desc: 'ひかった じゅんばんを おぼえて タッチ！',
    howTo: [
      '4つの ボタンが じゅんばんに ひかるよ',
      'ひかった とおりの じゅんばんで ボタンを タッチしよう',
      'せいかいすると 1つずつ ながく なるよ。まちがえたら おわり',
    ],
    available: true,
  },
  {
    id: 'swipesort',
    name: 'スワイプわけっこ',
    emoji: '🔀',
    desc: 'ぐうすう・きすうを すばやく わけよう！',
    howTo: [
      'すうじの カードが でてくるよ',
      'ぐうすう（2,4,6…）なら みぎへ、きすう（1,3,5…）なら ひだりへ スワイプ！',
      'せいげん時間の 中で なんかい せいかいできるかな。3かい まちがえると おわり',
    ],
    available: true,
  },
  {
    id: 'rhythmdon',
    name: 'リズムでドン',
    emoji: '🥁',
    desc: 'ノーツが せんに きたら タイミングよく ドン！',
    howTo: [
      '2つの レーンに うえから ノーツが おちてくるよ',
      'ノーツが したの せんに きたタイミングで そのレーンの「ドン！」を タップ',
      'せいげん時間の あいだ つづくよ。せんを とおりすぎると 1かい ミス。3かい ミスすると おわり',
    ],
    available: true,
  },
  {
    id: 'starshooter',
    name: 'ピューピュー星空',
    emoji: '🚀',
    desc: 'いんせきを うちおとせ！',
    howTo: [
      'ゆびで うごかす か ◀▶ボタンで じきを うごかす',
      'たまは じどうで でるよ。あたると いんせきが こわれてスコアアップ',
      'いんせきが したの せんまで とどくと 1かい ミス。3かい ミスすると おわり',
    ],
    available: true,
  },
  {
    id: 'ponpon',
    name: 'ぽんぽんジャンプ',
    emoji: '🐰',
    desc: 'あしばを つたって うえを めざそう！',
    howTo: [
      'キャラクターは じどうで はねつづけるよ',
      'ゆびで うごかす か ◀▶ボタンで あしばを つたって うえへ すすもう',
      'あしばを ふみはずして したに おちると おわり。とどいた たかさが スコア',
    ],
    available: true,
  },
  {
    id: 'airhockey',
    name: 'はじいてホッケー',
    emoji: '🏒',
    desc: 'マレットで パックを うちかえせ！',
    howTo: [
      'ゆびで うごかす か ◀▶ボタンで じぶんの マレットを うごかす',
      'パックを うちかえして あいての ゴールに いれよう',
      'せいげん時間の あいだ つづくよ。あいてに 5てん さきに ひきはなされると おわり',
    ],
    available: true,
  },
  {
    id: 'kururin',
    name: 'くるりんボール',
    emoji: '🌀',
    desc: 'かたむけて ゴールを めざそう！',
    howTo: [
      'ゆびで かたむける ほうこうへ ドラッグ か ◀▲▼▶ボタンで ボールを ころがす',
      'かべに ぶつかると とまるよ。🏁ゴールに つくと つぎの めいろへ',
      'せいげん時間の 中で なんかい クリアできるかな。時間切れで おわり',
    ],
    available: true,
  },
];

const BY_ID: Record<string, MinigameMeta> = Object.fromEntries(
  MINIGAMES.map((m) => [m.id, m])
);

export function getMinigame(id: MinigameId): MinigameMeta | undefined {
  return BY_ID[id];
}

/** あそびかたの手順（未定義なら空配列）。 */
export function minigameHowTo(id: MinigameId): readonly string[] {
  return BY_ID[id]?.howTo ?? [];
}
