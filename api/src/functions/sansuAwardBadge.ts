import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type AwardBody = {
  userId: string;
  badgeIds?: string[];
  minigameScore?: number;
  gameId?: string;
};

// ミニゲーム報酬のバッジ付与と最高スコア更新。コイン経済には一切影響しない（称号のみ）。
// スコアはクライアント申告（経済影響ゼロなので許容）。
app.http('sansuAwardBadgePost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/award-badge',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as AwardBody;
      if (!body.userId) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }

      const uTable = await usersTable();
      let user: SansuUserEntity;
      try {
        user = await uTable.getEntity<SansuUserEntity>(
          USERS_PARTITION,
          body.userId
        );
      } catch {
        return { status: 404, jsonBody: { error: 'user not found' } };
      }

      const badges = new Set<string>([
        ...(JSON.parse(user.earnedBadgesJson) as string[]),
        ...(body.badgeIds ?? []),
      ]);
      const prevHigh = user.minigameHighScore ?? 0;
      const nextHigh =
        typeof body.minigameScore === 'number'
          ? Math.max(prevHigh, body.minigameScore)
          : prevHigh;

      // ゲームごとの最高スコア
      const scores =
        (JSON.parse(user.minigameScoresJson ?? '{}') as Record<
          string,
          number
        >) ?? {};
      if (body.gameId && typeof body.minigameScore === 'number') {
        scores[body.gameId] = Math.max(
          scores[body.gameId] ?? 0,
          body.minigameScore
        );
      }

      const updated = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        earnedBadgesJson: JSON.stringify(Array.from(badges)),
        minigameHighScore: nextHigh,
        minigameScoresJson: JSON.stringify(scores),
      };
      await uTable.updateEntity(updated, 'Merge');
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return { status: 200, jsonBody: { ok: true, user: toPublic(refreshed) } };
    } catch (e) {
      context.error('sansuAwardBadgePost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
