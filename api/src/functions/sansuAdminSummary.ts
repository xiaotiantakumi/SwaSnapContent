import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { type SansuSessionEntity, type SansuUserEntity } from '../shared/sansuTypes';
import { requireAuthenticated } from '../shared/swaAuth';
import {
  sessionsTable,
  USERS_PARTITION,
  usersTable,
} from '../shared/tableClient';

app.http('sansuAdminSummary', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sansu/admin/summary',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    if (!requireAuthenticated(req)) {
      return { status: 401, jsonBody: { error: 'unauthorized' } };
    }
    try {
      const uTable = await usersTable();
      let totalUsers = 0;
      for await (const _u of uTable.listEntities<SansuUserEntity>({
        queryOptions: { filter: `PartitionKey eq '${USERS_PARTITION}'` },
      })) {
        void _u;
        totalUsers++;
      }
      const sTable = await sessionsTable();
      let totalSessions = 0;
      const sessionsByDate: Record<string, number> = {};
      for await (const s of sTable.listEntities<SansuSessionEntity>({})) {
        totalSessions++;
        const day = new Date(s.completedAt).toISOString().slice(0, 10);
        sessionsByDate[day] = (sessionsByDate[day] ?? 0) + 1;
      }
      return {
        status: 200,
        jsonBody: { totalUsers, totalSessions, sessionsByDate },
      };
    } catch (e) {
      context.error('sansuAdminSummary error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
