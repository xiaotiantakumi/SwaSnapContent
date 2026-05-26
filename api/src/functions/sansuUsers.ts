import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';

import {
  type SansuUserEntity,
  toPublic,
} from '../shared/sansuTypes';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

app.http('sansuUsersGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sansu/users',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const name = req.query.get('name');
    const userId = req.query.get('userId');
    try {
      const table = await usersTable();
      if (userId) {
        try {
          const entity = await table.getEntity<SansuUserEntity>(
            USERS_PARTITION,
            userId
          );
          return { status: 200, jsonBody: toPublic(entity) };
        } catch (e) {
          if ((e as { statusCode?: number }).statusCode === 404) {
            return { status: 404, jsonBody: { error: 'not found' } };
          }
          throw e;
        }
      }
      if (name) {
        const iter = table.listEntities<SansuUserEntity>({
          queryOptions: {
            filter: `PartitionKey eq '${USERS_PARTITION}' and name eq '${name.replace(/'/g, "''")}'`,
          },
        });
        for await (const entity of iter) {
          return { status: 200, jsonBody: toPublic(entity) };
        }
        return { status: 404, jsonBody: { error: 'not found' } };
      }
      return { status: 400, jsonBody: { error: 'name or userId required' } };
    } catch (e) {
      context.error('sansuUsersGet error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

app.http('sansuUsersCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/users',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as {
        name?: string;
        avatar?: string;
        themeColor?: string;
        pinHash?: string;
        pinSalt?: string;
      };
      if (
        !body.name ||
        !body.avatar ||
        !body.themeColor ||
        !body.pinHash ||
        !body.pinSalt
      ) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }

      const table = await usersTable();
      const id = body.pinSalt; // client passes a UUID as salt to use as user ID
      const now = Date.now();
      const entity: SansuUserEntity = {
        partitionKey: USERS_PARTITION,
        rowKey: id,
        name: body.name.slice(0, 24),
        avatar: body.avatar,
        themeColor: body.themeColor,
        createdAt: now,
        totalPoints: 0,
        earnedBadgesJson: '[]',
        bestTimesJson: '{}',
        currentStreakDays: 0,
        lastPlayedDate: '',
        lastPlayedAt: 0,
        totalSessions: 0,
        pinHash: body.pinHash,
        pinSalt: body.pinSalt,
      };
      try {
        await table.createEntity(entity);
      } catch (e) {
        if ((e as { statusCode?: number }).statusCode === 409) {
          return { status: 409, jsonBody: { error: 'user already exists' } };
        }
        throw e;
      }
      return { status: 201, jsonBody: toPublic(entity) };
    } catch (e) {
      context.error('sansuUsersCreate error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

app.http('sansuUsersVerify', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sansu/users/verify',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json()) as { userId?: string; pinHash?: string };
      if (!body.userId || !body.pinHash) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const table = await usersTable();
      try {
        const entity = await table.getEntity<SansuUserEntity>(
          USERS_PARTITION,
          body.userId
        );
        if (entity.pinHash !== body.pinHash) {
          return { status: 200, jsonBody: { ok: false } };
        }
        return { status: 200, jsonBody: { ok: true, user: toPublic(entity) } };
      } catch (e) {
        if ((e as { statusCode?: number }).statusCode === 404) {
          return { status: 404, jsonBody: { ok: false, error: 'not found' } };
        }
        throw e;
      }
    } catch (e) {
      context.error('sansuUsersVerify error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});

// Helper export (not a function) for re-use
export const _uuid = uuidv4;
