import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

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
      if (coins < cost) {
        return {
          status: 409,
          jsonBody: { error: 'insufficient', coins, cost },
        };
      }

      const updated = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        coins: coins - cost,
      };
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
