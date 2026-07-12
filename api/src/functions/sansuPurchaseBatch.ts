import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { AVATAR_ITEM_PRICES } from '../shared/avatarShop';
import { getShopPrice } from '../shared/shopCatalog';
import { type SansuUserEntity, toPublic } from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type BatchPurchaseBody = {
  userId: string;
  itemIds: string[];
};

// カート一括購入（all-or-nothing）。残高不足・不明アイテム時は1件も購入しない。
app.http('sansuPurchaseBatchPost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/purchase/batch',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as BatchPurchaseBody;
      if (
        !body.userId ||
        !Array.isArray(body.itemIds) ||
        body.itemIds.length === 0
      ) {
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

      const owned = new Set<string>(safeArr(user.ownedItemsJson));
      let coins = user.coins ?? 0;

      const toBuy = [
        ...new Set(body.itemIds.filter((id) => !owned.has(id))),
      ];

      for (const id of toBuy) {
        const slotPrice = getShopPrice(id);
        const price = slotPrice?.price ?? AVATAR_ITEM_PRICES[id];
        if (price === undefined) {
          return { status: 400, jsonBody: { error: 'unknown_item' } };
        }
      }

      const total = toBuy.reduce((sum, id) => {
        const slotPrice = getShopPrice(id);
        const price = slotPrice?.price ?? AVATAR_ITEM_PRICES[id];
        return sum + (price ?? 0);
      }, 0);

      if (coins < total) {
        return {
          status: 409,
          jsonBody: { error: 'insufficient', shortfall: total - coins, total },
        };
      }

      coins -= total;
      for (const id of toBuy) {
        owned.add(id);
      }

      const updated: Partial<SansuUserEntity> & {
        partitionKey: string;
        rowKey: string;
      } = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        coins,
        ownedItemsJson: JSON.stringify(Array.from(owned)),
      };
      await uTable.updateEntity(updated, 'Merge');
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return {
        status: 200,
        jsonBody: { ok: true, user: toPublic(refreshed), total },
      };
    } catch (e) {
      context.error('sansuPurchaseBatchPost error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

function safeArr(s: string | undefined): string[] {
  try {
    const v = JSON.parse(s ?? '[]');
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
