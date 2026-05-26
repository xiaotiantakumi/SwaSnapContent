import { TableClient, TableServiceClient } from '@azure/data-tables';

const CONNECTION =
  process.env.SANSU_STORAGE_CONNECTION ??
  process.env.AzureWebJobsStorage ??
  'UseDevelopmentStorage=true';

const TABLE_USERS = 'SansuUsers';
const TABLE_SESSIONS = 'SansuSessions';

let ensured = false;

async function ensureTables(): Promise<void> {
  if (ensured) return;
  const svc = TableServiceClient.fromConnectionString(CONNECTION, {
    allowInsecureConnection: CONNECTION.includes('UseDevelopmentStorage'),
  });
  for (const table of [TABLE_USERS, TABLE_SESSIONS]) {
    try {
      await svc.createTable(table);
    } catch (e) {
      // ignore if already exists
      const status = (e as { statusCode?: number }).statusCode;
      if (status && status !== 409) {
        throw e;
      }
    }
  }
  ensured = true;
}

export async function usersTable(): Promise<TableClient> {
  await ensureTables();
  return TableClient.fromConnectionString(CONNECTION, TABLE_USERS, {
    allowInsecureConnection: CONNECTION.includes('UseDevelopmentStorage'),
  });
}

export async function sessionsTable(): Promise<TableClient> {
  await ensureTables();
  return TableClient.fromConnectionString(CONNECTION, TABLE_SESSIONS, {
    allowInsecureConnection: CONNECTION.includes('UseDevelopmentStorage'),
  });
}

export const USERS_PARTITION = 'v1';

export function reverseTimestamp(ts: number): string {
  const max = 99999999999999;
  return String(max - ts).padStart(14, '0');
}
