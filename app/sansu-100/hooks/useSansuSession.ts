'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { dailyLevel, dailySeed } from '../lib/daily';
import {
  generateSet,
  generateSetSeeded,
  mulberry32,
} from '../lib/problem-generator';
import type {
  AnsweredProblem,
  LevelId,
  Operation,
  Problem,
} from '../lib/types';

export type UseSansuSessionOptions = {
  level: LevelId;
  operation: Operation;
  isDaily: boolean;
  totalProblems?: number;
};

export type SansuSessionState = {
  problems: Problem[];
  currentIndex: number;
  answered: AnsweredProblem[];
  startedAt: number;
  completedAt: number | null;
  isComplete: boolean;
  currentProblem: Problem | null;
};

export function useSansuSession(opts: UseSansuSessionOptions) {
  const total = opts.totalProblems ?? 100;
  const problems = useMemo<Problem[]>(() => {
    if (opts.isDaily) {
      const seed = dailySeed();
      const lvl = (opts.level === 'mix' ? dailyLevel() : opts.level) as LevelId;
      return generateSetSeeded(lvl, total, seed);
    }
    const seed = Math.floor(Math.random() * 0x7fffffff);
    return generateSet(opts.level, total, mulberry32(seed));
  }, [opts.isDaily, opts.level, total]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState<AnsweredProblem[]>([]);
  const startedAtRef = useRef<number>(Date.now());
  const lastAdvanceRef = useRef<number>(startedAtRef.current);
  const [completedAt, setCompletedAt] = useState<number | null>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
    lastAdvanceRef.current = startedAtRef.current;
    setCurrentIndex(0);
    setAnswered([]);
    setCompletedAt(null);
  }, [problems]);

  const currentProblem = currentIndex < problems.length
    ? problems[currentIndex]
    : null;

  const submitAnswer = useCallback(
    (userAnswer: number) => {
      if (!currentProblem) return;
      const now = Date.now();
      const timeMs = now - lastAdvanceRef.current;
      lastAdvanceRef.current = now;

      const ans: AnsweredProblem = {
        ...currentProblem,
        userAnswer,
        isCorrect: userAnswer === currentProblem.answer,
        timeMs,
      };
      setAnswered((prev) => {
        const next = [...prev, ans];
        if (next.length >= problems.length) {
          setCompletedAt(now);
        }
        return next;
      });
      setCurrentIndex((i) => i + 1);
      return ans;
    },
    [currentProblem, problems.length]
  );

  /**
   * DEBUG ONLY: fill all remaining problems with correct answers (or a chosen
   * accuracy) and immediately mark the session complete.
   */
  const debugFinish = useCallback(
    (opts2: { accuracy?: number; durationMs?: number } = {}) => {
      const accuracy = opts2.accuracy ?? 1;
      const startedAt = startedAtRef.current;
      const targetDuration = opts2.durationMs ?? Math.max(60_000, Date.now() - startedAt);
      const now = Date.now();
      // Backdate startedAt so resulting durationMs is realistic
      startedAtRef.current = now - targetDuration;
      const filled: AnsweredProblem[] = problems.map((p, idx) => {
        const wantCorrect = idx / problems.length < accuracy;
        return {
          ...p,
          userAnswer: wantCorrect ? p.answer : p.answer + 1,
          isCorrect: wantCorrect,
          timeMs: Math.floor(targetDuration / problems.length),
        };
      });
      setAnswered(filled);
      setCurrentIndex(problems.length);
      setCompletedAt(now);
    },
    [problems]
  );

  return {
    problems,
    currentIndex,
    answered,
    startedAt: startedAtRef.current,
    completedAt,
    isComplete: completedAt !== null,
    currentProblem,
    submitAnswer,
    debugFinish,
  };
}
