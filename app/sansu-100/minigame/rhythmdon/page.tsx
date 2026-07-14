'use client';

import React, { useCallback, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../../components/header';
import ThemeToggle from '../../../components/theme-toggle';
import BadgeUnlockOverlay from '../../components/BadgeUnlockOverlay';
import CoinBalance from '../../components/CoinBalance';
import HowToPlay from '../../components/HowToPlay';
import NewRecordBanner from '../../components/NewRecordBanner';
import RhythmDonGame from '../../games/RhythmDonGame';
import { useSansuUser } from '../../hooks/useSansuUser';
import { sansuApi } from '../../lib/api-client';
import { SPEND_COSTS } from '../../lib/minigame-economy';
import { minigameHowTo } from '../../lib/minigame-list';
import { evaluateMinigameBadges } from '../../lib/minigame-rewards';
import {
  DEFAULT_SONG_ID,
  getSongById,
  RHYTHM_SONGS,
  type RhythmSong,
} from '../../lib/rhythmdon-songs';

type Phase = 'intro' | 'playing' | 'over';

export default function RhythmDonPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [phase, setPhase] = useState<Phase>('intro');
  const [lastScore, setLastScore] = useState(0);
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [overlayBadges, setOverlayBadges] = useState<string[]>([]);
  const [newRecord, setNewRecord] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(DEFAULT_SONG_ID);

  const selectedSong: RhythmSong = getSongById(selectedSongId);

  const coins = currentUser?.coins ?? 0;

  const start = useCallback(async () => {
    if (!currentUser) return;
    setBusy(true);
    setMessage(null);
    setNewRecord(false);
    try {
      const res = await sansuApi.spend(currentUser.id, 'play');
      if (res.ok && res.user) {
        saveUser(res.user);
        setRound((r) => r + 1);
        setPhase('playing');
      } else {
        setMessage(
          res.error === 'no_plays'
            ? '🧮 さんすうを 1かい といてから あそぼう！'
            : 'コインが たりないよ'
        );
      }
    } catch {
      setMessage('いまは つうしんできないよ（あとでね）');
    } finally {
      setBusy(false);
    }
  }, [currentUser, saveUser]);

  const handleGameOver = useCallback(
    async (score: number) => {
      setLastScore(score);
      setPhase('over');
      if (!currentUser) return;
      const newBadges = evaluateMinigameBadges(
        'rhythmdon',
        score,
        currentUser.earnedBadges
      );
      try {
        const res = await sansuApi.awardBadge(currentUser.id, newBadges, score, 'rhythmdon');
        if (res.user) saveUser(res.user);
        if (res.newRecord) setNewRecord(true);
        if (newBadges.length > 0) setOverlayBadges(newBadges);
      } catch {
        // 報酬付与失敗は致命的でない
      }
    },
    [currentUser, saveUser]
  );

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser) return <main className="p-8" />;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-4 p-4">
        {phase === 'playing' ? (
          <Link
            href="/sansu-100/minigame"
            className="inline-block text-sm font-semibold text-blue-600 dark:text-blue-300"
          >
            ← やめる
          </Link>
        ) : (
          <Header
            title="🥁 リズムでドン"
            description="ノーツが せんに きたら タイミングよく ドン！"
            showBackButton
            backHref="/sansu-100/minigame"
            backLabel="ゲームせんたくにもどる"
          />
        )}

        {message ? (
          <div className="rounded-xl bg-yellow-100 px-4 py-3 text-center font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            {message}
          </div>
        ) : null}

        {phase === 'intro' ? (
          <section className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <p className="text-6xl">🥁</p>
            <HowToPlay steps={minigameHowTo('rhythmdon')} />
            <p className="text-gray-700 dark:text-gray-200">
              コインを {SPEND_COSTS.play}まい つかって あそぶよ
            </p>
            <div className="flex justify-center">
              <CoinBalance coins={coins} />
            </div>
            <div className="space-y-2 text-left">
              <p className="text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                きょくを えらぶ
              </p>
              <div className="grid gap-2">
                {RHYTHM_SONGS.map((song) => {
                  const selected = song.id === selectedSongId;
                  return (
                    <label
                      key={song.id}
                      data-testid={`rhythmdon-song-${song.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                        selected
                          ? 'border-pink-500 bg-pink-50 dark:border-pink-400 dark:bg-pink-900/20'
                          : 'border-gray-200 bg-gray-50 hover:border-pink-300 dark:border-gray-600 dark:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rhythmdon-song"
                        value={song.id}
                        checked={selected}
                        onChange={() => setSelectedSongId(song.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl" aria-hidden>
                        {song.emoji}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {song.title}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="w-full rounded-xl bg-pink-600 py-4 text-lg font-bold text-white hover:bg-pink-700 disabled:opacity-60"
              data-testid="rhythmdon-start"
            >
              🪙 {SPEND_COSTS.play} であそぶ
            </button>
          </section>
        ) : null}

        {phase === 'playing' ? (
          <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
            <RhythmDonGame key={round} song={selectedSong} onGameOver={handleGameOver} />
          </section>
        ) : null}

        {phase === 'over' ? (
          <section className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              おわり！
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              スコア: <b data-testid="rhythmdon-final-score">{lastScore}</b>
            </p>
            {newRecord ? <NewRecordBanner score={lastScore} /> : null}
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="w-full rounded-xl bg-pink-600 py-4 text-lg font-bold text-white hover:bg-pink-700 disabled:opacity-60"
              data-testid="rhythmdon-again"
            >
              🪙 {SPEND_COSTS.play} で もういちど
            </button>
            <Link
              href="/sansu-100/minigame"
              className="block rounded-xl bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              ほかの ゲームへ
            </Link>
          </section>
        ) : null}
      </div>

      {overlayBadges.length > 0 ? (
        <BadgeUnlockOverlay
          badgeIds={overlayBadges}
          onDone={() => setOverlayBadges([])}
        />
      ) : null}
    </main>
  );
}
