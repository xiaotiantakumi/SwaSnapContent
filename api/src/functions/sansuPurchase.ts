import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { getShopPrice } from '../shared/shopCatalog';
import {
  type EquippedItems,
  type SansuUserEntity,
  toPublic,
} from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

type PurchaseBody = {
  userId: string;
  action: 'buy' | 'equip' | 'unequip';
  itemId: string;
};

// アバターアイテムの購入・装備・装備解除。残高/所持はサーバーを権威とする。
// 価格はサーバーの SHOP_PRICES を正とし、クライアントは itemId だけ送る（指名買い）。
app.http('sansuPurchasePost', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/purchase',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as PurchaseBody;
      if (!body.userId || !body.action || !body.itemId) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const price = getShopPrice(body.itemId);
      if (!price) {
        return { status: 400, jsonBody: { error: 'unknown item' } };
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
      const equipped = safeObj(user.equippedItemsJson);
      let coins = user.coins ?? 0;

      if (body.action === 'buy') {
        if (!owned.has(body.itemId)) {
          // 残高検証（サーバーが正）。足りなければ 409。
          if (coins < price.price) {
            return {
              status: 409,
              jsonBody: { error: 'insufficient', coins, price: price.price },
            };
          }
          coins -= price.price;
          owned.add(body.itemId);
        }
        // 既所持なら二重課金せず、そのまま ok（子ども向けに親切）。
      } else if (body.action === 'equip') {
        // 所持していないアイテムは装備できない。
        if (!owned.has(body.itemId)) {
          return { status: 409, jsonBody: { error: 'not owned' } };
        }
        equipped[price.slot] = body.itemId;
      } else if (body.action === 'unequip') {
        delete equipped[price.slot];
      } else {
        return { status: 400, jsonBody: { error: 'bad action' } };
      }

      const updated: Partial<SansuUserEntity> & {
        partitionKey: string;
        rowKey: string;
      } = {
        partitionKey: USERS_PARTITION,
        rowKey: body.userId,
        coins,
        ownedItemsJson: JSON.stringify(Array.from(owned)),
        equippedItemsJson: JSON.stringify(equipped),
      };
      await uTable.updateEntity(updated, 'Merge');
      const refreshed = await uTable.getEntity<SansuUserEntity>(
        USERS_PARTITION,
        body.userId
      );
      return { status: 200, jsonBody: { ok: true, user: toPublic(refreshed) } };
    } catch (e) {
      context.error('sansuPurchasePost error', e);
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

function safeObj(s: string | undefined): EquippedItems {
  try {
    const v = JSON.parse(s ?? '{}');
    return typeof v === 'object' && v !== null ? (v as EquippedItems) : {};
  } catch {
    return {};
  }
}
