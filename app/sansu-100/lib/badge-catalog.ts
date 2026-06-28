export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'rainbow';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory =
  | 'sessions'
  | 'perfect'
  | 'speed'
  | 'streak'
  | 'master'
  | 'timing'
  | 'special'
  | 'minigame'
  | 'meta';

export type BadgeDef = {
  id: string;
  category: BadgeCategory;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  rarity: BadgeRarity;
  hint?: string;
};

export const BADGE_CATALOG: readonly BadgeDef[] = [
  // 練習回数系
  { id: 'sessions_1', category: 'sessions', name: 'はじめの一歩', description: 'はじめての100マスをクリア！', icon: '👣', tier: 'bronze', rarity: 'common' },
  { id: 'sessions_5', category: 'sessions', name: '5回チャレンジャー', description: '5回練習したよ', icon: '🌱', tier: 'bronze', rarity: 'common' },
  { id: 'sessions_10', category: 'sessions', name: 'トレーニー', description: '10回練習したよ', icon: '🌿', tier: 'bronze', rarity: 'common' },
  { id: 'sessions_30', category: 'sessions', name: 'ひと月マスター', description: '30回練習したよ', icon: '🌳', tier: 'silver', rarity: 'common' },
  { id: 'sessions_50', category: 'sessions', name: 'ハーフセンチュリー', description: '50回練習したよ', icon: '🏃', tier: 'silver', rarity: 'rare' },
  { id: 'sessions_100', category: 'sessions', name: 'センチュリー', description: '100回練習したよ', icon: '💯', tier: 'gold', rarity: 'rare' },
  { id: 'sessions_200', category: 'sessions', name: 'ダブルセンチュリー', description: '200回練習したよ', icon: '🏆', tier: 'gold', rarity: 'epic' },
  { id: 'sessions_500', category: 'sessions', name: '五百本ノック', description: '500回練習したよ', icon: '⚔️', tier: 'gold', rarity: 'epic' },
  { id: 'sessions_1000', category: 'sessions', name: '千本桜', description: '1000回練習したよ！', icon: '🌸', tier: 'rainbow', rarity: 'legendary' },

  // パーフェクト系
  { id: 'perfect_first', category: 'perfect', name: '初パーフェクト', description: '全問正解だ！', icon: '💎', tier: 'silver', rarity: 'rare' },
  { id: 'perfect_5', category: 'perfect', name: 'パーフェクト5', description: 'パーフェクト5回', icon: '✨', tier: 'silver', rarity: 'rare' },
  { id: 'perfect_10', category: 'perfect', name: 'パーフェクト10', description: 'パーフェクト10回', icon: '🌟', tier: 'gold', rarity: 'epic' },
  { id: 'perfect_50', category: 'perfect', name: 'パーフェクト職人', description: 'パーフェクト50回', icon: '👑', tier: 'rainbow', rarity: 'legendary' },
  { id: 'perfect_streak_3', category: 'perfect', name: '3連パーフェクト', description: '3回連続パーフェクト', icon: '🎯', tier: 'gold', rarity: 'epic' },

  // スピード系
  { id: 'speed_5min', category: 'speed', name: '5分切り', description: '5分以内でクリア', icon: '⏱️', tier: 'bronze', rarity: 'common' },
  { id: 'speed_3min', category: 'speed', name: '3分切り', description: '3分以内でクリア', icon: '⚡', tier: 'silver', rarity: 'rare' },
  { id: 'speed_2min', category: 'speed', name: '2分切り', description: '2分以内でクリア', icon: '🚀', tier: 'gold', rarity: 'epic' },
  { id: 'speed_90sec', category: 'speed', name: '90秒切り', description: '90秒以内でクリア', icon: '💨', tier: 'gold', rarity: 'epic' },
  { id: 'speed_60sec', category: 'speed', name: '1分切り', description: '60秒以内でクリア', icon: '🔥', tier: 'rainbow', rarity: 'legendary' },
  { id: 'speed_30sec', category: 'speed', name: '究極の30秒', description: '30秒以内でクリア', icon: '⚡', tier: 'rainbow', rarity: 'legendary' },

  // 連続日数系
  { id: 'streak_3', category: 'streak', name: '三日坊主そつぎょう', description: '3日連続練習', icon: '🔥', tier: 'bronze', rarity: 'common' },
  { id: 'streak_7', category: 'streak', name: '一週間つづいた', description: '7日連続練習', icon: '🔥', tier: 'silver', rarity: 'rare' },
  { id: 'streak_14', category: 'streak', name: '二週間つづいた', description: '14日連続練習', icon: '🔥', tier: 'silver', rarity: 'rare' },
  { id: 'streak_30', category: 'streak', name: 'ひと月つづいた', description: '30日連続練習', icon: '🔥', tier: 'gold', rarity: 'epic' },
  { id: 'streak_60', category: 'streak', name: '二ヶ月つづいた', description: '60日連続練習', icon: '🔥', tier: 'gold', rarity: 'epic' },
  { id: 'streak_100', category: 'streak', name: '100日継続', description: '100日連続練習！', icon: '🔥', tier: 'rainbow', rarity: 'legendary' },

  // 演算マスター系
  { id: 'master_add_basic', category: 'master', name: 'たし算マスター（初級）', description: 'たし算Lv1-4を全てクリア', icon: '➕', tier: 'silver', rarity: 'rare' },
  { id: 'master_add_full', category: 'master', name: 'たし算マスター', description: 'たし算の全レベルを制覇', icon: '🟢', tier: 'gold', rarity: 'epic' },
  { id: 'master_sub_basic', category: 'master', name: 'ひき算マスター（初級）', description: 'ひき算Lv1-2をクリア', icon: '➖', tier: 'silver', rarity: 'rare' },
  { id: 'master_sub_full', category: 'master', name: 'ひき算マスター', description: 'ひき算の全レベルを制覇', icon: '🟡', tier: 'gold', rarity: 'epic' },
  { id: 'master_mul_basic', category: 'master', name: '九九マスター', description: '九九（Lv5）をクリア', icon: '✖️', tier: 'silver', rarity: 'rare' },
  { id: 'master_mul_full', category: 'master', name: 'かけ算マスター', description: 'かけ算の全レベルを制覇', icon: '🔴', tier: 'gold', rarity: 'epic' },
  { id: 'master_div_basic', category: 'master', name: 'わり算マスター（初級）', description: 'わり算Lv1をクリア', icon: '➗', tier: 'silver', rarity: 'rare' },
  { id: 'master_div_full', category: 'master', name: 'わり算マスター', description: 'わり算の全レベルを制覇', icon: '🟣', tier: 'gold', rarity: 'epic' },

  // 時間帯系
  { id: 'early_bird', category: 'timing', name: 'はやおき！', description: '朝6-9時に練習', icon: '🌅', tier: 'bronze', rarity: 'common' },
  { id: 'night_owl', category: 'timing', name: 'よふかし', description: '夜20-22時に練習', icon: '🌙', tier: 'bronze', rarity: 'common' },
  { id: 'weekend_warrior', category: 'timing', name: '週末王者', description: '土日両方練習', icon: '🎽', tier: 'silver', rarity: 'rare' },

  // 特殊・面白系
  { id: 'comeback', category: 'special', name: 'おかえり！', description: '7日空けて復帰', icon: '🌈', tier: 'silver', rarity: 'rare' },
  { id: 'mix_master', category: 'special', name: 'ミックスマスター', description: '混合モードをクリア', icon: '🎲', tier: 'silver', rarity: 'rare' },
  { id: 'birthday_play', category: 'special', name: 'たんじょうび練習', description: '誕生日に練習', icon: '🎂', tier: 'gold', rarity: 'epic' },
  { id: 'new_year_play', category: 'special', name: '元日チャレンジ', description: '元日に練習', icon: '🎍', tier: 'gold', rarity: 'epic' },
  { id: 'late_night', category: 'special', name: 'ナイトオウル', description: '深夜0-3時に練習', icon: '🦉', tier: 'silver', rarity: 'rare' },

  // ミニゲーム称号（コイン経済に影響しない名誉バッジ）
  { id: 'snake_charmer', category: 'minigame', name: 'ヘビつかい', description: 'スネークで10てん', icon: '🐍', tier: 'bronze', rarity: 'common' },
  { id: 'snake_king', category: 'minigame', name: 'ヘビの王さま', description: 'スネークで30てん', icon: '👑', tier: 'gold', rarity: 'epic' },
  { id: 'runner_ace', category: 'minigame', name: 'かけっこ名人', description: 'ランナーで500すすんだ', icon: '🏃', tier: 'silver', rarity: 'rare' },
  { id: 'runner_wind', category: 'minigame', name: '風のランナー', description: 'ランナーで1500すすんだ', icon: '🌪️', tier: 'gold', rarity: 'epic' },
  { id: 'whack_master', category: 'minigame', name: 'もぐらマスター', description: 'もぐらたたきで15てん', icon: '🔨', tier: 'silver', rarity: 'rare' },
  { id: 'whack_legend', category: 'minigame', name: 'もぐら名人', description: 'もぐらたたきで30てん', icon: '🏆', tier: 'gold', rarity: 'epic' },
  { id: 'breakout_pro', category: 'minigame', name: 'ブロックくずし職人', description: 'ブロックを15こ こわした', icon: '🧱', tier: 'silver', rarity: 'rare' },
  { id: 'breakout_master', category: 'minigame', name: 'ブロックマスター', description: 'ブロックを ぜんぶ こわした', icon: '🏅', tier: 'gold', rarity: 'epic' },
  { id: 'falling_pro', category: 'minigame', name: 'よけ名人', description: 'おちものよけで500てん', icon: '💨', tier: 'silver', rarity: 'rare' },
  { id: 'falling_master', category: 'minigame', name: 'よけの達人', description: 'おちものよけで1200てん', icon: '🌀', tier: 'gold', rarity: 'epic' },
  { id: 'memory_clear', category: 'minigame', name: 'きおくの達人', description: '神経衰弱をクリア', icon: '🧠', tier: 'silver', rarity: 'rare' },
  { id: 'memory_ace', category: 'minigame', name: 'きおくの天才', description: '少ないめくりでクリア', icon: '✨', tier: 'gold', rarity: 'epic' },

  // メタバッジ
  { id: 'badge_collector_25', category: 'meta', name: 'バッジハンター', description: 'バッジを25個集めた', icon: '🎖️', tier: 'gold', rarity: 'epic' },
  { id: 'badge_collector_all', category: 'meta', name: 'コンプリート！', description: '全バッジを集めた', icon: '🏆', tier: 'rainbow', rarity: 'legendary' },
] as const;

export const BADGES_BY_ID: Record<string, BadgeDef> = Object.fromEntries(
  BADGE_CATALOG.map((b) => [b.id, b])
);

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGES_BY_ID[id];
}

export const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-slate-400 to-slate-200',
  gold: 'from-yellow-500 to-yellow-300',
  rainbow:
    'from-pink-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500',
};
