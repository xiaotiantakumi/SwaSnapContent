'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import LevelPicker from '../components/LevelPicker';
import NumberKeypad from '../components/NumberKeypad';
import ProblemDisplay from '../components/ProblemDisplay';
import ProgressBar from '../components/ProgressBar';
import SessionTimer from '../components/SessionTimer';
import { useSansuSession } from '../hooks/useSansuSession';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import { dailyLevel } from '../lib/daily';
import { isDebugEnv } from '../lib/debug-env';
import { finishSession } from '../lib/session-result';
import { storage } from '../lib/storage';
import type { LevelId, Operation } from '../lib/types';

function PlayInner(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const isDaily = params.get('daily') === '1';
  // 正規ドメイン以外（localhost / SWAプレビュー / ?debug=1）でデバッグ機能を有効化
  const debugMode = isDebugEnv();
  const { currentUser, updateUser, saveUser, loaded } = useSansuUser();
  const [pick, setPick] = useState<{
    level: LevelId;
    operation: Operation;
  } | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) router.replace('/sansu-100');
  }, [loaded, currentUser, router]);

  useEffect(() => {
    if (isDaily && !pick) {
      const lv = dailyLevel() as Exclude<LevelId, 'mix'>;
      setPick({ level: lv, operation: opOf(lv) });
    }
  }, [isDaily, pick]);

  if (!loaded || !currentUser) return <main className="p-8" />;

  if (!pick) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
          <Header
            title="どの れんしゅう？"
            description="レベルを えらんでね"
            showBackButton
            backHref="/sansu-100"
            backLabel="ホームにもどる"
          />
          <LevelPicker
            onPick={(level, operation) => setPick({ level, operation })}
            feverWindowInterval={currentUser.feverWindowInterval}
            feverWindowUses={currentUser.feverWindowUses}
          />
        </div>
      </main>
    );
  }

  return (
    <PlaySession
      user={currentUser}
      pick={pick}
      isDaily={isDaily}
      onFinishUpdate={updateUser}
      onServerSync={saveUser}
      debugMode={debugMode}
    />
  );
}

function opOf(lv: Exclude<LevelId, 'mix'>): Operation {
  if ([1, 2, 7, 8].includes(lv)) return 'add';
  if ([3, 4, 9].includes(lv)) return 'sub';
  if ([5, 10].includes(lv)) return 'mul';
  return 'div';
}

interface PlaySessionProps {
  user: ReturnType<typeof useSansuUser>['currentUser'];
  pick: { level: LevelId; operation: Operation };
  isDaily: boolean;
  onFinishUpdate: (
    updater: (u: NonNullable<ReturnType<typeof useSansuUser>['currentUser']>) => NonNullable<ReturnType<typeof useSansuUser>['currentUser']>
  ) => void;
  // サーバー応答の権威ユーザー（コイン残高確定値）でローカルを上書き同期する
  onServerSync: (user: NonNullable<ReturnType<typeof useSansuUser>['currentUser']>) => void;
  debugMode?: boolean;
}

function PlaySession({
  user,
  pick,
  isDaily,
  onFinishUpdate,
  onServerSync,
  debugMode,
}: PlaySessionProps): React.JSX.Element {
  const router = useRouter();
  const session = useSansuSession({
    level: pick.level,
    operation: pick.operation,
    isDaily,
  });
  const [input, setInput] = useState('');
  // あまりあり割り算用: あまりの入力と、入力中のマス
  const [remInput, setRemInput] = useState('');
  const [activeField, setActiveField] = useState<'quotient' | 'remainder'>(
    'quotient'
  );
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showRetire, setShowRetire] = useState(false);
  const [retiring, setRetiring] = useState(false);
  // 同期ガード: 完走/リタイヤの finishSession が二重起動（連打や再レンダ）しないよう、
  // state より先に効く ref で1回だけ確定させる。
  const finalizingRef = useRef(false);

  const isRemainderMode = session.currentProblem?.remainder !== undefined;

  const judge = useCallback(
    (q: string, rem: string, isSkip = false) => {
      const p = session.currentProblem;
      if (!p) return;
      const remMode = p.remainder !== undefined;
      const n = Number.parseInt(q, 10);
      const r = Number.parseInt(rem, 10);
      if (!isSkip) {
        if (Number.isNaN(n)) return;
        if (remMode && Number.isNaN(r)) return;
      }
      const isCorrect =
        !isSkip && n === p.answer && (!remMode || r === p.remainder);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setTimeout(
        () => {
          session.submitAnswer(
            isSkip ? -1 : n,
            !isSkip && remMode ? r : undefined
          );
          setInput('');
          setRemInput('');
          setActiveField('quotient');
          setFeedback(null);
        },
        isCorrect ? 200 : 500
      );
    },
    [session]
  );

  // キーパッド入力: いま入力中のマスに反映し、答えがそろったら自動で正解判定する。
  const handleInputChange = useCallback(
    (v: string) => {
      const p = session.currentProblem;
      if (!p || feedback) return;
      const remMode = p.remainder !== undefined;
      if (remMode && activeField === 'remainder') {
        setRemInput(v);
        const r = Number.parseInt(v, 10);
        if (r === p.remainder && Number.parseInt(input, 10) === p.answer) {
          judge(input, v, false);
        }
        return;
      }
      // 商（または通常の答え）のマス
      setInput(v);
      const n = Number.parseInt(v, 10);
      if (remMode) {
        // 商が合ったら自動であまりのマスへ進む
        if (n === p.answer) setActiveField('remainder');
      } else if (n === p.answer) {
        judge(v, '', false);
      }
    },
    [session.currentProblem, feedback, activeField, input, judge]
  );

  const handleSkip = useCallback(() => {
    if (feedback) return;
    judge(input, remInput, true);
  }, [feedback, input, remInput, judge]);

  useEffect(() => {
    if (!session.isComplete || finalizingRef.current || !user) return;
    finalizingRef.current = true;
    const result = finishSession({
      user,
      level: pick.level,
      operation: pick.operation,
      isDaily,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? Date.now(),
      problems: session.answered,
      pastSessions: storage.getSessions(user.id),
    });

    storage.appendSession(result.session);
    storage.pushPending(result.session);
    onFinishUpdate(() => result.updatedUser);

    const goToResult = (feverEligible: boolean, coinsAfter: number) => {
      sessionStorage.setItem(
        'sansu-100:last-result',
        JSON.stringify({
          userId: user.id,
          session: result.session,
          newBadges: result.newBadges,
          pointsEarned: result.pointsEarned,
          coinsEarned: result.coinsEarned,
          coinBreakdown: result.coinBreakdown,
          coinsAfter,
          bestKey: `lv${pick.level}:${pick.operation}`,
          previousBest:
            user.bestTimesByLevel[`lv${pick.level}:${pick.operation}`] ?? null,
          feverEligible,
          problems: session.answered,
        })
      );
      router.replace('/sansu-100/result');
    };

    // 完了→結果。フィーバー達成(feverEligible)はサーバー応答で確定するので待ってから遷移。
    sansuApi
      .submitSession(result.session, {
        streakDays: result.updatedUser.currentStreakDays,
        prevStreakDays: user.currentStreakDays,
      })
      .then((res) => {
        storage.clearPending([result.session.id]);
        if (res.user) onServerSync(res.user);
        goToResult(
          !!res.feverEligible,
          res.user?.coins ?? result.updatedUser.coins ?? 0
        );
      })
      .catch(() => {
        // オフライン等はフィーバー無しで結果へ（あとで同期）
        goToResult(false, result.updatedUser.coins ?? 0);
      });
  }, [
    session.isComplete,
    user,
    pick.level,
    pick.operation,
    isDaily,
    session.startedAt,
    session.completedAt,
    session.answered,
    onFinishUpdate,
    onServerSync,
    router,
  ]);

  if (!user) return <main className="p-8" />;

  const correctCount = session.answered.filter((a) => a.isCorrect).length;

  return (
    <main className="flex min-h-svh flex-col bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRetire(true)}
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-red-100 hover:text-red-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900/40 dark:hover:text-red-400"
              aria-label="リタイヤ"
            >
              ✕ やめる
            </button>
          </div>
          <SessionTimer
            startedAt={session.startedAt}
            stopped={session.isComplete}
          />
          <ThemeToggle />
        </header>

        {showRetire ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRetire(false)}
          >
            <div
              className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-lg font-bold text-gray-900 dark:text-gray-100">
                れんしゅうを やめる？
              </p>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                ここまでの {session.currentIndex}問は きろくに のこるよ
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={retiring}
                  onClick={() => {
                    if (finalizingRef.current) return;
                    if (session.answered.length > 0 && user) {
                      finalizingRef.current = true;
                      setRetiring(true);
                      const now = Date.now();
                      const result = finishSession({
                        user,
                        level: pick.level,
                        operation: pick.operation,
                        isDaily: false,
                        isRetired: true,
                        startedAt: session.startedAt,
                        completedAt: now,
                        problems: session.answered,
                        pastSessions: storage.getSessions(user.id),
                      });
                      storage.appendSession(result.session);
                      storage.pushPending(result.session);
                      onFinishUpdate(() => result.updatedUser);
                      sansuApi
                        .submitSession(result.session, {
                          streakDays: result.updatedUser.currentStreakDays,
                          prevStreakDays: user.currentStreakDays,
                        })
                        .then((res) => {
                          storage.clearPending([result.session.id]);
                          if (res.user) onServerSync(res.user);
                        })
                        .catch(() => {});
                    }
                    router.replace('/sansu-100');
                  }}
                  className="rounded-xl bg-red-500 py-3 font-bold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {retiring ? 'きろく中...' : 'やめる'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRetire(false)}
                  className="rounded-xl bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
                >
                  つづける
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <ProgressBar
          current={session.currentIndex}
          total={session.problems.length}
          correctCount={correctCount}
        />

        <div className="flex flex-1 items-center justify-center">
          {session.currentProblem ? <ProblemDisplay
              problem={session.currentProblem}
              userInput={input}
              remainderInput={remInput}
              activeField={activeField}
              onFocusField={isRemainderMode ? setActiveField : undefined}
              feedback={feedback}
            /> : null}
        </div>

        {isRemainderMode ? (
          <p className="text-center text-sm font-semibold text-blue-600 dark:text-blue-300">
            商（こたえ）と あまり の りょうほうを いれてね
          </p>
        ) : null}

        <NumberKeypad
          value={
            isRemainderMode && activeField === 'remainder' ? remInput : input
          }
          onChange={handleInputChange}
          onSkip={handleSkip}
          maxLen={isRemainderMode ? (activeField === 'remainder' ? 1 : 2) : 4}
          disabled={feedback !== null || session.isComplete}
        />

        {debugMode ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
            <span className="font-bold">🐛 DEBUG</span>
            <button
              type="button"
              onClick={() => session.debugFinish({ accuracy: 1, durationMs: 25_000 })}
              className="rounded bg-amber-600 px-2 py-1 font-semibold text-white hover:bg-amber-700"
              data-testid="debug-finish-perfect"
            >
              一気に30問パーフェクト（25秒）
            </button>
            <button
              type="button"
              onClick={() => session.debugFinish({ accuracy: 0.9, durationMs: 90_000 })}
              className="rounded bg-amber-500 px-2 py-1 font-semibold text-white hover:bg-amber-600"
              data-testid="debug-finish-90"
            >
              90%正解 (1分30秒)
            </button>
            <button
              type="button"
              onClick={() =>
                session.debugFinish({ accuracy: 1, durationMs: 25_000 + Math.random() * 60_000 })
              }
              className="rounded bg-amber-400 px-2 py-1 font-semibold text-amber-900 hover:bg-amber-500"
              data-testid="debug-finish-random"
            >
              完走（ランダムタイム）
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function PlayPage(): React.JSX.Element {
  return (
    <Suspense fallback={<main className="p-8" />}>
      <PlayInner />
    </Suspense>
  );
}
