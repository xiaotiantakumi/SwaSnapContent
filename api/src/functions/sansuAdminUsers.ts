import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import {
  type SansuUserEntity,
  toPublic,
} from '../shared/sansuTypes';
import { requireAuthenticated } from '../shared/swaAuth';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

app.http('sansuAdminUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sansu/admin/users',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    if (!requireAuthenticated(req)) {
      return { status: 401, jsonBody: { error: 'unauthorized' } };
    }
    try {
      const table = await usersTable();
      const iter = table.listEntities<SansuUserEntity>({
        queryOptions: { filter: `PartitionKey eq '${USERS_PARTITION}'` },
      });
      const users = [];
      for await (const e of iter) {
        users.push(toPublic(e));
      }
      users.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
      return { status: 200, jsonBody: users };
    } catch (e) {
      context.error('sansuAdminUsers error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
