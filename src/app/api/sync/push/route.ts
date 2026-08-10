import { NextResponse } from 'next/server';
import { requireUser } from '@/server/session';
import { db } from '@/server/db';
import { applyOp } from '@/server/sync/apply';
import type { PushRequest, PushResponse, SyncOpEnvelope, SyncOpResult } from '@/lib/sync/types';

export const maxDuration = 60;

const MAX_OPS_PER_REQUEST = 200;

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PushRequest;
  try {
    body = (await request.json()) as PushRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const ops = Array.isArray(body?.ops) ? body.ops.slice(0, MAX_OPS_PER_REQUEST) : [];

  const results: SyncOpResult[] = [];
  for (const op of ops) {
    if (!op || typeof op.opId !== 'string' || !op.domain || !op.opType) {
      results.push({ status: 'error', error: 'Invalid op' });
      continue;
    }
    results.push(await processOp(user.id, op));
  }

  const response: PushResponse = { after: new Date().toISOString(), results };
  return NextResponse.json(response);
}

async function processOp(userId: string, op: SyncOpEnvelope): Promise<SyncOpResult> {
  const existing = await db.syncOp.findUnique({
    where: { userId_opId: { userId, opId: op.opId } },
  });
  if (existing) {
    const stored = existing.result as SyncOpResult | null;
    return stored ? { ...stored, status: 'duplicate' } : { status: 'duplicate' };
  }

  return db.$transaction(async (tx) => {
    const result = await applyOp(tx, userId, op);
    await tx.syncOp.create({
      data: {
        userId,
        opId: op.opId,
        domain: op.domain,
        opType: op.opType,
        result: result as unknown as object,
      },
    });
    return result;
  });
}
