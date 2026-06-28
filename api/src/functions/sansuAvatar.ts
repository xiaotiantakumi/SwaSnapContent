import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { sanitizeAvatarConfig } from '../shared/avatarOptions';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type AvatarBody = {
  userId: string;
  config: unknown;
};

// パーツ組み立て式アバターの構成を保存する。値はサーバーで許可リストに丸める。
app.http('sansuAvatarPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/avatar',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as AvatarBody;
      if (!body.userId) {
        return { status: 400, jsonBody: { error: 'missing userId' } };
      }
      const config = sanitizeAvatarConfig(body.config);

      const uTable = await usersTable();
      try {
        await uTable.getEntity<SansuUserEntity>(USERS_PARTITION, body.userId);
      } catch {
        return { status: 404, jsonBody: { error: 'user not found' } };
      }

      await uTable.updateEntity(
        {
          partitionKey: USERS_PARTITION,
          rowKey: body.userId,
          avatarConfigJson: JSON.stringify(config),
        },
        'Merge'
      );
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return { status: 200, jsonBody: { ok: true, user: toPublic(refreshed) } };
    } catch (e) {
      context.error('sansuAvatarPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
