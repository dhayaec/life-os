'use client';

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import { DOMAINS, type Domain, type OutboxEntry } from './types';

export type Row = Record<string, unknown>;

interface LifeOSDB extends DBSchema {
  tasks: { key: string; value: Row };
  notes: { key: string; value: Row };
  folders: { key: string; value: Row };
  calendarEvents: { key: string; value: Row };
  habits: { key: string; value: Row };
  habitEntries: { key: string; value: Row };
  journalEntries: { key: string; value: Row };
  transactions: { key: string; value: Row };
  budgets: { key: string; value: Row };
  shoppingItems: { key: string; value: Row };
  bookmarks: { key: string; value: Row };
  collections: { key: string; value: Row };
  documents: { key: string; value: Row };
  notifications: { key: string; value: Row };
  settings: { key: string; value: Row };
  outbox: { key: string; value: OutboxEntry; indexes: { byDomain: string } };
  meta: { key: string; value: { key: string; value: unknown } };
}

const DB_NAME = 'lifeos-sync';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LifeOSDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<LifeOSDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const domain of DOMAINS) {
          if (!db.objectStoreNames.contains(domain))
            db.createObjectStore(domain, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const outbox = db.createObjectStore('outbox', { keyPath: 'opId' });
          outbox.createIndex('byDomain', 'domain');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// --- reactive version counter ---

const listeners = new Set<() => void>();
let version = 0;

export function subscribeStore(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getStoreVersion(): number {
  return version;
}

function notify() {
  version += 1;
  for (const fn of listeners) fn();
}

// --- typed read/write API ---

export const store = {
  async getAll<T = Row>(domain: Domain): Promise<T[]> {
    const db = await getDB();
    return (await db.getAll(domain)) as T[];
  },

  async get<T = Row>(domain: Domain, id: string): Promise<T | undefined> {
    const db = await getDB();
    return (await db.get(domain, id)) as T | undefined;
  },

  async put(domain: Domain, row: Row): Promise<void> {
    const db = await getDB();
    await db.put(domain, row);
    notify();
  },

  async delete(domain: Domain, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(domain, id);
    notify();
  },

  async clear(domain: Domain): Promise<void> {
    const db = await getDB();
    await db.clear(domain);
    notify();
  },

  async outboxAdd(entry: OutboxEntry): Promise<void> {
    const db = await getDB();
    await db.put('outbox', entry);
    notify();
  },

  async outboxPut(entry: OutboxEntry): Promise<void> {
    const db = await getDB();
    await db.put('outbox', entry);
    notify();
  },

  async outboxGetAll(): Promise<OutboxEntry[]> {
    const db = await getDB();
    return db.getAll('outbox');
  },

  async outboxGetByDomain(domain: Domain): Promise<OutboxEntry[]> {
    const db = await getDB();
    return db.getAllFromIndex('outbox', 'byDomain', domain);
  },

  async outboxDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDB();
    const tx = db.transaction('outbox', 'readwrite');
    await Promise.all(ids.map((id) => tx.store.delete(id)));
    await tx.done;
    notify();
  },

  async outboxCount(): Promise<number> {
    const db = await getDB();
    return db.count('outbox');
  },

  async metaGet<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    const entry = await db.get('meta', key);
    return entry?.value as T | undefined;
  },

  async metaSet(key: string, value: unknown): Promise<void> {
    const db = await getDB();
    await db.put('meta', { key, value });
    notify();
  },
};
