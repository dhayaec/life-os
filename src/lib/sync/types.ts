/** Generic serialised row shape used by the local store and sync protocol. */
export type Row = Record<string, unknown>;

export const DOMAINS = [
  'tasks',
  'notes',
  'folders',
  'calendarEvents',
  'habits',
  'habitEntries',
  'journalEntries',
  'transactions',
  'budgets',
  'shoppingItems',
  'bookmarks',
  'collections',
  'documents',
  'notifications',
  'settings',
] as const;

export type Domain = (typeof DOMAINS)[number];

export const OP_TYPES = ['create', 'update', 'delete'] as const;
export type OpType = (typeof OP_TYPES)[number];

export interface SyncOpEnvelope {
  opId: string;
  clientId: string;
  domain: Domain;
  opType: OpType;
  /** The record to create/update, or { id } for delete */
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Outbox entry = envelope + local push bookkeeping */
export type OutboxEntry = SyncOpEnvelope & {
  failed?: boolean;
  attempts?: number;
};

export type SyncOpResultStatus = 'applied' | 'conflict' | 'duplicate' | 'error';

export interface SyncOpResult {
  status: SyncOpResultStatus;
  /** Canonical serialized record for applied/conflict */
  record?: Record<string, unknown>;
  /** Tombstone record for deletes */
  tombstone?: { domain: Domain; recordId: string; deletedAt: string };
  error?: string;
}

export interface PullResponse {
  after: string;
  domains: Partial<Record<Domain, { rows: Record<string, unknown>[]; deleted: string[] }>>;
}

export interface PushRequest {
  ops: SyncOpEnvelope[];
}

export interface PushResponse {
  after: string;
  results: SyncOpResult[];
}
