import { sansuApi } from './api-client';
import { hashPin } from './pin-hash';
import { storage } from './storage';
import type { SansuUserPublic } from './types';

const SEED_KEY = 'sansu-100:dev-seeded';

const SEED_USERS = [
  { name: 'たろう', pin: '1111', avatar: '🐶', themeColor: 'blue' },
  { name: 'はなこ', pin: '2222', avatar: '🌸', themeColor: 'pink' },
  { name: 'けんた', pin: '3333', avatar: '🦊', themeColor: 'green' },
];

/** Returns true if users were newly seeded (localStorage was updated). */
export async function seedDevUsers(): Promise<boolean> {
  if (sessionStorage.getItem(SEED_KEY)) return false;

  const created: SansuUserPublic[] = [];
  for (const u of SEED_USERS) {
    // skip if already registered on server
    const existing = await sansuApi.findUser(u.name).catch(() => null);
    if (existing) {
      storage.upsertUser(existing);
      created.push(existing);
      continue;
    }
    // generate a fresh UUID as id/salt
    const id = crypto.randomUUID();
    const pinHash = await hashPin(u.pin, id);
    const user = await sansuApi
      .createUser({
        name: u.name,
        avatar: u.avatar,
        themeColor: u.themeColor,
        pinHash,
        pinSalt: id,
      })
      .catch((e) => {
        console.warn('[dev-seed] failed to create', u.name, e);
        return null;
      });
    if (user) {
      storage.upsertUser(user);
      created.push(user);
    }
  }

  if (created.length > 0) {
    // auto-select the first user so the home screen is immediately useful
    storage.setCurrentUserId(created[0].id);
    console.info(
      '[dev-seed] seeded users:',
      created.map((u) => `${u.avatar}${u.name}`).join(', '),
      '| PINs: 1111 / 2222 / 3333'
    );
  }

  sessionStorage.setItem(SEED_KEY, '1');
  return created.length > 0;
}
