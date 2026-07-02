import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { isAdminAccount, isDebugHost } from '../shared/debugEnv';
import { getSpendCost } from '../shared/minigame';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type SpendBody = { userId: string; reason: string };

// ミニゲームの参加費／コンティニューでコインを消費する。金額はサーバーの SPEND_COSTS が正。
// 残高不足は 409。報酬でコインは増やさない（経済崩壊防止）ので、消費専用。
app.http('sansuSpendPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/spend',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as SpendBody;
      if (!body.userId || !body.reason) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const cost = getSpendCost(body.reason);
      if (cost === undefined) {
        return { status: 400, jsonBody: { error: 'unknown reason' } };
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

      const coins = user.coins ?? 0;
      const credits = user.minigameCredits ?? 0;
      // 算数ゲート: 新規プレイは「あそべる回数」が必要。0なら算数を解くまで遊べない。
      // デバッグ環境（localhost / SWA PR プレビュー）ではこのゲートをスキップする。
      const debugHost = [
        req.headers.get('x-forwarded-host'),
        req.headers.get('host'),
        req.headers.get('x-original-host'),
        req.headers.get('referer'),
      ].some((c) => isDebugHost(c));
      if (
        body.reason === 'play' &&
        credits <= 0 &&
        !debugHost &&
        !(await isAdminAccount(user))
      ) {
        return {
          status: 409,
          jsonBody: { error: 'no_plays', minigameCredits: 0 },
        };
      }
      if (coins < cost) {
        return {
          status: 409,
          jsonBody: { error: 'insufficient', coins, cost },
        };
      }

      const updated: {
        partitionKey: string;
        rowKey: string;
        coins: number;
        minigameCredits?: number;
      } = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        coins: coins - cost,
      };
      // プレイ参加でクレジットを1消費（コンティニューは消費しない）。
      if (body.reason === 'play') {
        updated.minigameCredits = Math.max(0, credits - 1);
      }
      await uTable.updateEntity(updated, 'Merge');
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return {
        status: 200,
        jsonBody: { ok: true, cost, user: toPublic(refreshed) },
      };
    } catch (e) {
      context.error('sansuSpendPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
