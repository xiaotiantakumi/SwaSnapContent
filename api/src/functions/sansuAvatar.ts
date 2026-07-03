import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import {
  DEFAULT_AVATAR_CONFIG,
  sanitizeAvatarConfig,
  type AvatarConfig,
} from '../shared/avatarOptions';
import { grantEquippedPaidValues } from '../shared/avatarShop';
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

      const uTable = await usersTable();
      let entity: SansuUserEntity;
      try {
        entity = await uTable.getEntity<SansuUserEntity>(
          USERS_PARTITION,
          body.userId
        );
      } catch {
        return { status: 404, jsonBody: { error: 'user not found' } };
      }

      // 所持している有料パーツだけ装備を許可（サーバーが正）。
      let owned: string[] = [];
      try {
        const v = JSON.parse(entity.ownedItemsJson ?? '[]');
        if (Array.isArray(v)) owned = v as string[];
      } catch {
        owned = [];
      }

      // 有料化タイミングで既存装備を保存時に剥がさないための無償付与（マイグレーション）。
      let currentConfig: AvatarConfig = DEFAULT_AVATAR_CONFIG;
      if (entity.avatarConfigJson) {
        try {
          currentConfig = JSON.parse(entity.avatarConfigJson) as AvatarConfig;
        } catch {
          /* 新規ユーザー等でパース不能ならデフォルトのまま */
        }
      }
      const toGrant = grantEquippedPaidValues(currentConfig, owned);
      if (toGrant.length > 0) {
        owned = [...owned, ...toGrant];
      }

      const config = sanitizeAvatarConfig(body.config, owned);

      await uTable.updateEntity(
        {
          partitionKey: USERS_PARTITION,
          rowKey: body.userId,
          avatarConfigJson: JSON.stringify(config),
          ...(toGrant.length > 0
            ? { ownedItemsJson: JSON.stringify(owned) }
            : {}),
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
