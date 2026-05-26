import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import {
  type SansuSession,
  type SansuSessionEntity,
  type SansuUserEntity,
  toPublic,
} from '../shared/sansuTypes';
import {
  reverseTimestamp,
  sessionsTable,
  USERS_PARTITION,
  usersTable,
} from '../shared/tableClient';

app.http('sansuSessionsPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/sessions',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as SansuSession;
      if (!body.id || !body.userId) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const sTable = await sessionsTable();
      const entity: SansuSessionEntity = {
        partitionKey: body.userId,
        rowKey: `${reverseTimestamp(body.completedAt)}_${body.id}`,
        id: body.id,
        userName: body.userName,
        levelStr: String(body.level),
        operation: body.operation,
        isDaily: body.isDaily,
        startedAt: body.startedAt,
        completedAt: body.completedAt,
        durationMs: body.durationMs,
        totalProblems: body.totalProblems,
        correctCount: body.correctCount,
        pointsEarned: body.pointsEarned,
        newBadgesJson: JSON.stringify(body.newBadges ?? []),
      };
      try {
        await sTable.createEntity(entity);
      } catch (e) {
        if ((e as { statusCode?: number }).statusCode !== 409) {
          throw e;
        }
      }

      // Update user aggregates
      const uTable = await usersTable();
      try {
        const user = await uTable.getEntity<SansuUserEntity>(
          USERS_PARTITION,
          body.userId
        );
        const badges = new Set<string>([
          ...JSON.parse(user.earnedBadgesJson) as string[],
          ...(body.newBadges ?? []),
        ]);
        const best = JSON.parse(user.bestTimesJson) as Record<string, number>;
        const key = `lv${body.level}:${body.operation}`;
        const isPerfect = body.correctCount === body.totalProblems;
        if (isPerfect && (!best[key] || body.durationMs < best[key])) {
          best[key] = body.durationMs;
        }
        const updated: Partial<SansuUserEntity> & {
          partitionKey: string;
          rowKey: string;
        } = {
          partitionKey: USERS_PARTITION,
          rowKey: body.userId,
          totalPoints: user.totalPoints + body.pointsEarned,
          totalSessions: user.totalSessions + 1,
          earnedBadgesJson: JSON.stringify(Array.from(badges)),
          bestTimesJson: JSON.stringify(best),
          lastPlayedAt: body.completedAt,
          lastPlayedDate: new Date(body.completedAt)
            .toISOString()
            .slice(0, 10),
        };
        await uTable.updateEntity(updated, 'Merge');
      } catch (e) {
        context.warn('User aggregate update failed', e);
      }

      return { status: 201, jsonBody: { ok: true } };
    } catch (e) {
      context.error('sansuSessionsPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

app.http('sansuSessionsGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sansu/sessions',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const userId = req.query.get('userId');
    if (!userId) return { status: 400, jsonBody: { error: 'userId required' } };
    try {
      const table = await sessionsTable();
      const iter = table.listEntities<SansuSessionEntity>({
        queryOptions: {
          filter: `PartitionKey eq '${userId.replace(/'/g, "''")}'`,
        },
      });
      const sessions: SansuSession[] = [];
      for await (const e of iter) {
        sessions.push({
          id: e.id,
          userId,
          userName: e.userName,
          level: /^\d+$/.test(e.levelStr) ? Number(e.levelStr) : 'mix',
          operation: e.operation as SansuSession['operation'],
          isDaily: e.isDaily,
          startedAt: e.startedAt,
          completedAt: e.completedAt,
          durationMs: e.durationMs,
          totalProblems: e.totalProblems,
          correctCount: e.correctCount,
          pointsEarned: e.pointsEarned,
          newBadges: JSON.parse(e.newBadgesJson),
        });
        if (sessions.length >= 200) break;
      }
      // already sorted descending due to reversed timestamp rowKey
      sessions.reverse(); // return ascending chronological for charts
      return { status: 200, jsonBody: sessions };
    } catch (e) {
      context.error('sansuSessionsGet error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

// Suppress unused export lint
void toPublic;
