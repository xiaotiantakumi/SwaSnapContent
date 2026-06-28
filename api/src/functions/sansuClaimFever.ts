import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';

import { FEVER_MULTIPLIERS } from '../shared/fever';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

// フィーバー達成後のルーレット倍率を適用する。倍率はクライアントが止めた値だが、
// サーバーは {2,3} とフィーバー枠の保留(pending)有無だけ検証する（コインは飾り用途）。
type ClaimBody = { userId?: string; multiplier?: number };

app.http('sansuClaimFever', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/fever/claim',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as ClaimBody;
      if (!body.userId) {
        return { status: 400, jsonBody: { error: 'missing userId' } };
      }
      const mult = Number(body.multiplier);
      if (!FEVER_MULTIPLIERS.includes(mult)) {
        return { status: 400, jsonBody: { error: 'bad multiplier' } };
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

      const pendingInterval = user.pendingFeverInterval ?? -1;
      const pendingBase = user.pendingFeverBase ?? 0;
      // 未claimのフィーバー枠が無い / すでにその枠でclaim済み → 何もしない（冪等）
      if (
        pendingInterval < 0 ||
        (user.lastFeverInterval ?? -2) === pendingInterval
      ) {
        return {
          status: 409,
          jsonBody: { error: 'no pending fever', user: toPublic(user) },
        };
      }

      const bonus = pendingBase * (mult - 1);
      await uTable.updateEntity(
        {
          partitionKey: USERS_PARTITION,
          rowKey: body.userId,
          coins: (user.coins ?? 0) + bonus,
          lastFeverInterval: pendingInterval,
          pendingFeverInterval: -1,
          pendingFeverBase: 0,
        },
        'Merge'
      );
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return {
        status: 200,
        jsonBody: {
          ok: true,
          user: toPublic(refreshed),
          multiplier: mult,
          bonus,
        },
      };
    } catch (e) {
      context.error('sansuClaimFever error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
