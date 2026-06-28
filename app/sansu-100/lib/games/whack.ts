// もぐらたたきの純粋ロジック（React非依存・テスト対象）。
// 穴からモグラが出ている間にタップで得点。たまに「ばつ」が出て、叩くと減点（コインは減らさない）。
// tick ベース（実時間ではない）。描画側が一定間隔で stepWhack を呼ぶ。

export const WHACK = {
  holes: 9, // 3x3
  totalTicks: 200, // 制限時間（tick）。描画側 stepMs と掛けて実時間になる
  ttlMin: 6,
  ttlMax: 12, // モグラが出ている時間(tick)
  spawnChance: 0.22, // 1tick で空き穴にモグラが出る確率
  badChance: 0.18, // 出たモグラが「ばつ」である確率
} as const;

export type Mole = { active: boolean; isBad: boolean; ttl: number };

export type WhackState = {
  holes: Mole[];
  score: number;
  ticksLeft: number;
  over: boolean;
};

export function createWhack(): WhackState {
  return {
    holes: Array.from({ length: WHACK.holes }, () => ({
      active: false,
      isBad: false,
      ttl: 0,
    })),
    score: 0,
    ticksLeft: WHACK.totalTicks,
    over: false,
  };
}

/** 1tick 進める: モグラの寿命減少・消滅、空き穴への出現、制限時間カウントダウン。 */
export function stepWhack(s: WhackState, rand: () => number): WhackState {
  if (s.over) return s;
  const ticksLeft = s.ticksLeft - 1;

  const holes = s.holes.map((m) => {
    if (!m.active) return m;
    const ttl = m.ttl - 1;
    return ttl <= 0 ? { active: false, isBad: false, ttl: 0 } : { ...m, ttl };
  });

  // 出現（空き穴のうち1つに確率で）
  const emptyIdx = holes
    .map((m, i) => (m.active ? -1 : i))
    .filter((i) => i >= 0);
  if (emptyIdx.length > 0 && rand() < WHACK.spawnChance) {
    const idx = emptyIdx[Math.floor(rand() * emptyIdx.length)];
    holes[idx] = {
      active: true,
      isBad: rand() < WHACK.badChance,
      ttl:
        WHACK.ttlMin + Math.floor(rand() * (WHACK.ttlMax - WHACK.ttlMin + 1)),
    };
  }

  return {
    holes,
    score: s.score,
    ticksLeft,
    over: ticksLeft <= 0,
  };
}

/** 穴をタップ。モグラ=+1、ばつ=-1（0未満にはしない）、空振り=変化なし。叩いた穴は引っ込む。 */
export function hitHole(s: WhackState, index: number): WhackState {
  if (s.over) return s;
  const m = s.holes[index];
  if (!m || !m.active) return s;
  const holes = s.holes.slice();
  holes[index] = { active: false, isBad: false, ttl: 0 };
  const score = m.isBad ? Math.max(0, s.score - 1) : s.score + 1;
  return { ...s, holes, score };
}
