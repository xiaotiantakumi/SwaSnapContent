import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { isDebugHost } from '../shared/debugEnv';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type DebugGrantBody = { userId: string; amount?: number };

// デバッグ用: コインを付与する。本番ドメインからのリクエストは 403。
// テスト用途（一気にコインを得て着せ替え/ミニゲームを試す）専用。
app.http('sansuDebugGrantPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/debug-grant',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const host =
        req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      if (!isDebugHost(host)) {
        return { status: 403, jsonBody: { error: 'debug disabled' } };
      }
      const body = (await req.json()) as DebugGrantBody;
      if (!body.userId) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const amount = Math.max(
        0,
        Math.min(100000, Math.floor(body.amount ?? 1000))
      );

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

      const updated = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        coins: (user.coins ?? 0) + amount,
      };
      await uTable.updateEntity(updated, 'Merge');
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return {
        status: 200,
        jsonBody: { ok: true, granted: amount, user: toPublic(refreshed) },
      };
    } catch (e) {
      context.error('sansuDebugGrantPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
