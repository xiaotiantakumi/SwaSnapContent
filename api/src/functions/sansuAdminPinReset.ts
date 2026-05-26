import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

import { requireAuthenticated } from '../shared/swaAuth';
import { USERS_PARTITION, usersTable } from '../shared/tableClient';

app.http('sansuAdminPinReset', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'sansu/admin/users/{userId}/pin',
  handler: async (
    req: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> => {
    const principal = requireAuthenticated(req);
    if (!principal) {
      return { status: 401, jsonBody: { error: 'unauthorized' } };
    }
    const userId = req.params.userId;
    if (!userId) {
      return { status: 400, jsonBody: { error: 'userId required' } };
    }
    try {
      const body = (await req.json()) as {
        pinHash?: string;
        pinSalt?: string;
      };
      if (!body.pinHash || !body.pinSalt) {
        return { status: 400, jsonBody: { error: 'missing fields' } };
      }
      const table = await usersTable();
      await table.updateEntity(
        {
          partitionKey: USERS_PARTITION,
          rowKey: userId,
          pinHash: body.pinHash,
          pinSalt: body.pinSalt,
          pinResetAt: Date.now(),
          pinResetBy: principal.userDetails ?? principal.userId,
        },
        'Merge'
      );
      return { status: 200, jsonBody: { ok: true } };
    } catch (e) {
      context.error('sansuAdminPinReset error', e);
      return { status: 500, jsonBody: { error: 'internal' } };
    }
  },
});
