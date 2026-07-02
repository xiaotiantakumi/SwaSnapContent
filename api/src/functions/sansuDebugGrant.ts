import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { isAdminAccount, isDebugHost } from '../shared/debugEnv';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type DebugGrantBody = { userId: string; amount?: number };

// デバッグ用: コインを付与する。本番ドメインからのリクエストは、対象ユーザーが
// 管理者アカウント（isAdminAccount: 固定userIdとの一致）でない限り 403。
// テスト用途（一気にコインを得て着せ替え/ミニゲームを試す）＋管理者の自由な付与に使う。
app.http('sansuDebugGrantPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/debug-grant',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
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

      // SWA 実環境では x-forwarded-host 単独だと内部ホストが入ることがあるため、
      // 複数のホスト系ヘッダのいずれかが「正規ドメイン以外」なら許可する（本番ドメインは全て不一致→403）。
      // 管理者ユーザー自身への付与は、本番ドメインでも許可する。
      const debugHost = [
        req.headers.get('x-forwarded-host'),
        req.headers.get('host'),
        req.headers.get('x-original-host'),
        req.headers.get('referer'),
      ].some((c) => isDebugHost(c));
      if (!debugHost && !isAdminAccount(user)) {
        return { status: 403, jsonBody: { error: 'debug disabled' } };
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
