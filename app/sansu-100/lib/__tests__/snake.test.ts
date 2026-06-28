import { describe, it, expect } from 'vitest';
import { createSnake, stepSnake, placeFood } from '../games/snake';

const rand0 = () => 0; // 決定的: 常に先頭の空きマス

describe('snake', () => {
  it('初期状態は長さ3・右向き・スコア0・food はヘビ上にない', () => {
    const s = createSnake(11, rand0);
    expect(s.snake).toHaveLength(3);
    expect(s.dir).toBe('right');
    expect(s.score).toBe(0);
    expect(s.over).toBe(false);
    expect(s.snake.some((c) => c.x === s.food.x && c.y === s.food.y)).toBe(
      false
    );
  });

  it('右に進むと頭が動き尻尾が縮む（長さ維持）', () => {
    const s = createSnake(11, rand0);
    const head0 = s.snake[0];
    const n = stepSnake(s, 'right', rand0);
    expect(n.snake[0]).toEqual({ x: head0.x + 1, y: head0.y });
    expect(n.snake).toHaveLength(3);
  });

  it('food を食べると伸びてスコア+1・新しい food が置かれる', () => {
    let s = createSnake(11, rand0);
    // food を頭の右隣に固定
    s = { ...s, food: { x: s.snake[0].x + 1, y: s.snake[0].y } };
    const n = stepSnake(s, 'right', rand0);
    expect(n.score).toBe(1);
    expect(n.snake).toHaveLength(4);
    expect(n.snake.some((c) => c.x === n.food.x && c.y === n.food.y)).toBe(
      false
    );
  });

  it('壁に当たると over', () => {
    let s = createSnake(5, rand0);
    // 右端へ寄せる
    s = {
      ...s,
      snake: [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 },
      ],
      dir: 'right',
    };
    const n = stepSnake(s, 'right', rand0);
    expect(n.over).toBe(true);
  });

  it('180度反転は無視され即死しない', () => {
    const s = createSnake(11, rand0);
    const n = stepSnake(s, 'left', rand0); // 右進行中に左入力
    expect(n.over).toBe(false);
    expect(n.dir).toBe('right'); // 反転が無視され右のまま
  });

  it('自分の体に当たると over', () => {
    // U字に曲げて頭が体にぶつかる状況を作る
    let s = createSnake(11, rand0);
    s = {
      ...s,
      snake: [
        { x: 5, y: 5 }, // head
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
        { x: 4, y: 4 },
      ],
      dir: 'up',
      food: { x: 0, y: 0 },
    };
    // 左に曲がると (4,5) = 体に衝突
    const n = stepSnake(s, 'left', rand0);
    expect(n.over).toBe(true);
  });

  it('placeFood は空きマスを返す', () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    const f = placeFood(snake, 4, rand0);
    expect(snake.some((c) => c.x === f.x && c.y === f.y)).toBe(false);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x).toBeLessThan(4);
  });
});
