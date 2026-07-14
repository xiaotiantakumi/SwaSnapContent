'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_SONG_ID, getSongById, type RhythmSong } from '../lib/rhythmdon-songs';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import {
  createRhythmGS,
  stepRhythm,
  tapRhythm,
  DEFAULT_RHYTHM_CONFIG,
  TICK_MS,
  type BeatmapNote,
  type RhythmConfig,
  type RhythmGS,
} from './logic/rhythmdon-logic';

// リズムでドン（簡易リズムゲーム）
// 4レーンにノーツが降ってくるので、判定ラインに重なったタイミングでタップ/キー入力する。
// タイミングが合えば正解、判定ラインを過ぎると1回ミス（ライフ-1）。
// 制限時間経過 or ライフ0で終了。正解数がスコア。

const BGM_VOLUME = 0.35;

type BeatmapJson = {
  notes: BeatmapNote[];
  durationMs?: number;
};

function resolveGameDurationMs(audio: HTMLAudioElement, fallbackMs: number): number {
  const durationMs = Math.round(audio.duration * 1000);
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return fallbackMs;
  }
  return durationMs;
}

export default function RhythmDonGame({
  song = getSongById(DEFAULT_SONG_ID),
  onGameOver,
}: {
  song?: RhythmSong;
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const cfgRef = useRef<RhythmConfig>(DEFAULT_RHYTHM_CONFIG);
  const [notes, setNotes] = useState<RhythmGS['notes']>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(DEFAULT_RHYTHM_CONFIG.lives);
  const [timeLeft, setTimeLeft] = useState(
    Math.ceil(song.durationMs / 1000)
  );
  const [flash, setFlash] = useState<number | null>(null);

  const gsRef = useRef<RhythmGS>(createRhythmGS());
  const finishedRef = useRef(false);
  const soundRef = useRef(true);
  const startRef = useRef(0);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmSyncedRef = useRef(false);

  const getElapsedMs = useCallback((): number => {
    const bgm = bgmRef.current;
    if (
      bgmSyncedRef.current &&
      bgm &&
      !bgm.paused &&
      Number.isFinite(bgm.currentTime)
    ) {
      return bgm.currentTime * 1000;
    }
    return Date.now() - startRef.current;
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    bgmRef.current?.pause();
    onGameOver(gsRef.current.score);
  }, [onGameOver]);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    finishedRef.current = false;
    bgmSyncedRef.current = false;

    const bgm = new Audio(song.audioSrc);
    bgm.loop = false;
    bgm.volume = BGM_VOLUME;
    bgmRef.current = bgm;

    const markBgmSynced = (): void => {
      bgmSyncedRef.current = true;
    };
    bgm.addEventListener('playing', markBgmSynced);
    bgm.addEventListener('timeupdate', markBgmSynced);

    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const startGame = (gameCfg: RhythmConfig): void => {
      if (cancelled) return;
      cfgRef.current = gameCfg;
      gsRef.current = createRhythmGS(gameCfg);
      startRef.current = Date.now();
      setLives(gameCfg.lives);
      setTimeLeft(Math.ceil(gameCfg.gameDurationMs / 1000));

      if (soundRef.current) {
        bgm.play().then(markBgmSynced).catch(() => {
          // 自動再生ブロック等は無視
        });
      }

      interval = setInterval(() => {
        if (gsRef.current.over || finishedRef.current) return;
        const elapsed = getElapsedMs();
        const cfg = cfgRef.current;

        let missedThisTick = false;
        stepRhythm(gsRef.current, elapsed, cfg, (ev) => {
          if (ev === 'miss') missedThisTick = true;
          if (ev === 'miss' && soundRef.current) sound.crash();
          if (ev === 'over') finish();
        });

        if (missedThisTick) {
          setLives(Math.max(0, gsRef.current.lives));
        }
        if (gsRef.current.over || finishedRef.current) return;

        setTimeLeft(Math.max(0, Math.ceil((cfg.gameDurationMs - elapsed) / 1000)));
        setNotes([...gsRef.current.notes]);
      }, TICK_MS);
    };

    const setupWithDuration = (beatmap: BeatmapNote[] | undefined, durationMs: number): void => {
      const gameCfg: RhythmConfig = {
        ...DEFAULT_RHYTHM_CONFIG,
        gameDurationMs: durationMs,
        ...(beatmap ? { beatmap } : {}),
      };
      startGame(gameCfg);
    };

    const loadBeatmapAndStart = async (): Promise<void> => {
      try {
        const res = await fetch(song.beatmapSrc);
        if (!res.ok) throw new Error(`beatmap fetch failed: ${res.status}`);
        const json = (await res.json()) as BeatmapJson;
        const beatmapDuration = json.durationMs ?? 0;
        const audioDuration = resolveGameDurationMs(bgm, song.durationMs);
        const durationMs =
          beatmapDuration > 0 ? beatmapDuration : audioDuration > 0 ? audioDuration : song.durationMs;
        setupWithDuration(json.notes, durationMs);
      } catch {
        // beatmap 取得失敗時は従来の mechanical 生成にフォールバック
        const durationMs = resolveGameDurationMs(bgm, song.durationMs);
        setupWithDuration(undefined, durationMs);
      }
    };

    const onMetadata = (): void => {
      void loadBeatmapAndStart();
    };

    if (Number.isFinite(bgm.duration) && bgm.duration > 0) {
      onMetadata();
    } else {
      bgm.addEventListener('loadedmetadata', onMetadata, { once: true });
      bgm.load();
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      bgm.removeEventListener('playing', markBgmSynced);
      bgm.removeEventListener('timeupdate', markBgmSynced);
      bgm.pause();
      bgmRef.current = null;
    };
  }, [finish, getElapsedMs, song.id, song.audioSrc, song.beatmapSrc, song.durationMs]);

  const tapLane = useCallback(
    (lane: number) => {
      if (gsRef.current.over || finishedRef.current) return;
      const elapsed = getElapsedMs();
      const cfg = cfgRef.current;
      const hit = tapRhythm(gsRef.current, lane, elapsed, cfg, () => {});
      if (!hit) return;

      setNotes([...gsRef.current.notes]);
      setScore(gsRef.current.score);
      if (soundRef.current) sound.correct();
      setFlash(lane);
      setTimeout(() => setFlash(null), 150);
    },
    [getElapsedMs]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const lane = Number(e.key) - 1;
      if (lane >= 0 && lane < cfgRef.current.lanes) tapLane(lane);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tapLane]);

  const cfg = cfgRef.current;
  const now = getElapsedMs();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums">{score}</span></span>
        <span>{'❤️'.repeat(lives)}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>

      <div className="relative h-72 w-full max-w-xs overflow-hidden rounded-2xl bg-gray-900">
        {Array.from({ length: cfg.lanes }, (_, lane) => (
          <div
            key={lane}
            className="absolute inset-y-0 border-r border-gray-700 last:border-r-0"
            style={{ left: `${(lane / cfg.lanes) * 100}%`, width: `${100 / cfg.lanes}%` }}
          >
            <div
              className={`absolute inset-x-0 bottom-10 h-1 ${
                flash === lane ? 'bg-yellow-300' : 'bg-gray-500'
              }`}
            />
          </div>
        ))}
        {notes.map((n) => {
          const progress = Math.min(1.15, (now - n.spawnedAt) / cfg.noteTravelMs);
          const topPct = progress * 78;
          return (
            <div
              key={n.id}
              data-testid={`rhythmdon-note-${n.id}`}
              data-lane={n.lane}
              className="absolute size-8 -translate-x-1/2 rounded-full bg-pink-400 shadow"
              style={{
                left: `${(n.lane + 0.5) * (100 / cfg.lanes)}%`,
                top: `${topPct}%`,
              }}
            />
          );
        })}
      </div>

      <div className="grid w-full max-w-xs grid-cols-4 gap-2">
        {Array.from({ length: cfg.lanes }, (_, lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => tapLane(lane)}
            data-testid={`rhythmdon-lane-${lane}`}
            className={`rounded-xl px-1 py-4 text-base font-bold text-white shadow transition-colors active:scale-95 ${
              flash === lane ? 'bg-yellow-400' : 'bg-pink-500 hover:bg-pink-600'
            }`}
            aria-label={`レーン${lane + 1}`}
          >
            ドン！
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ノーツが せんに きたら ドン！しよう
      </p>
    </div>
  );
}
