import { z } from 'zod';

import { AINotConfiguredError } from '@/server/ai/ai-service';
import {
  dailyBriefing,
  naturalLanguageSearch,
  summarizeNote,
  suggestTasksFromNote,
} from '@/server/ai/operations';
import { getSession } from '@/server/session';
import { rateLimit } from '@/server/rate-limit';
import { createTask } from '@/features/tasks/services/task-service';
import { createNotification } from '@/features/notifications/services/notifications-service';

const AI_RATE_LIMIT = 10;
const AI_RATE_WINDOW_MS = 60 * 1000;
// Keep payloads bounded: each call bills the shared gateway key, so a single
// request must not be able to ship megabytes of text to the model.
const CONTENT_MAX = 50_000;

const summarizeSchema = z.object({ content: z.string().min(1).max(CONTENT_MAX) });
const tasksFromNoteSchema = z.object({ content: z.string().min(1).max(CONTENT_MAX) });
const briefingSchema = z.object({
  agenda: z
    .array(z.object({ title: z.string().max(500), startAt: z.string().max(64) }))
    .max(50)
    .default([]),
  tasksDue: z
    .array(z.object({ title: z.string().max(500), dueAt: z.string().max(64).nullable() }))
    .max(50)
    .default([]),
  habits: z
    .array(z.object({ name: z.string().max(200), streak: z.number() }))
    .max(50)
    .default([]),
  recentNotes: z
    .array(z.object({ title: z.string().max(500), updatedAt: z.string().max(64) }))
    .max(50)
    .default([]),
  finance: z.object({ balance: z.number(), expense: z.number() }).nullable().optional(),
});
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  items: z.array(z.object({ id: z.string(), type: z.string(), title: z.string() })).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ operation: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!rateLimit(`ai:${session.user.id}`, AI_RATE_LIMIT, AI_RATE_WINDOW_MS)) {
    return Response.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const { operation } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    switch (operation) {
      case 'summarize': {
        const { content } = summarizeSchema.parse(body);
        const summary = await summarizeNote(content);
        return Response.json({ ok: true, data: { summary } });
      }
      case 'tasks-from-note': {
        const { content } = tasksFromNoteSchema.parse(body);
        const suggestions = await suggestTasksFromNote(content);
        const tasks = (
          await Promise.all(
            suggestions.map((s) =>
              createTask(session.user.id, { title: s.title, description: s.description ?? null })
            )
          )
        ).filter((task): task is NonNullable<typeof task> => task !== null);
        if (tasks.length > 0) {
          await createNotification(session.user.id, {
            title: `AI created ${tasks.length} task${tasks.length === 1 ? '' : 's'} from your note`,
            body: tasks
              .slice(0, 5)
              .map((t) => t.title)
              .join('\n'),
            type: 'task',
          });
        }
        return Response.json({ ok: true, data: { count: tasks.length, tasks } });
      }
      case 'briefing': {
        const input = briefingSchema.parse(body);
        const briefing = await dailyBriefing({
          agenda: input.agenda,
          tasksDue: input.tasksDue,
          habits: input.habits,
          recentNotes: input.recentNotes,
          finance: input.finance ?? null,
        });
        return Response.json({ ok: true, data: { briefing } });
      }
      case 'search': {
        const { query, items } = searchSchema.parse(body);
        const matches = await naturalLanguageSearch(query, items);
        return Response.json({ ok: true, data: { matches } });
      }
      default:
        return Response.json({ ok: false, error: 'Unknown operation' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      return Response.json(
        { ok: false, error: error.message, code: 'AI_NOT_CONFIGURED' },
        { status: 503 }
      );
    }
    if (error instanceof z.ZodError) {
      return Response.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }
    console.error('AI route error:', error);
    return Response.json({ ok: false, error: 'Something went wrong' }, { status: 500 });
  }
}
