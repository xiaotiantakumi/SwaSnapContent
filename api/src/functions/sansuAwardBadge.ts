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

      // ゲームごとの最高スコア（更新したら newRecord=true）
      const scores =
        (JSON.parse(user.minigameScoresJson ?? '{}') as Record<
          string,
          number
        >) ?? {};
      let newRecord = false;
      if (body.gameId && typeof body.minigameScore === 'number') {
        const prev = scores[body.gameId] ?? 0;
        if (body.minigameScore > prev) {
          scores[body.gameId] = body.minigameScore;
          newRecord = true;
        }
      }

      // 遊んだゲームの種類数でメタバッジを付与（minigameScores のキー数）
      const distinctGames = Object.keys(scores).length;
      if (distinctGames >= 5) badges.add('games_explorer');
      if (distinctGames >= 8) badges.add('games_allstar');

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
      return {
        status: 200,
        jsonBody: { ok: true, user: toPublic(refreshed), newRecord },
      };
    } catch (e) {
      context.error('sansuAwardBadgePost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
