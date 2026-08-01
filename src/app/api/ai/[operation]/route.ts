import { z } from 'zod';

import { AINotConfiguredError } from '@/server/ai/ai-service';
import {
  dailyBriefing,
  naturalLanguageSearch,
  summarizeNote,
  suggestTasksFromNote,
} from '@/server/ai/operations';
import { getSession } from '@/server/session';
import { createTask } from '@/features/tasks/services/task-service';

const summarizeSchema = z.object({ content: z.string() });
const tasksFromNoteSchema = z.object({ content: z.string() });
const briefingSchema = z.object({
  agenda: z.array(z.object({ title: z.string(), startAt: z.string() })).default([]),
  tasksDue: z.array(z.object({ title: z.string(), dueAt: z.string().nullable() })).default([]),
  habits: z.array(z.object({ name: z.string(), streak: z.number() })).default([]),
  recentNotes: z.array(z.object({ title: z.string(), updatedAt: z.string() })).default([]),
  finance: z.object({ balance: z.number(), expense: z.number() }).nullable().optional(),
});
const searchSchema = z.object({
  query: z.string().min(1),
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
        const tasks = await Promise.all(
          suggestions.map((s) =>
            createTask(session.user.id, { title: s.title, description: s.description ?? null })
          )
        );
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
