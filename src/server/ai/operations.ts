import 'server-only';

import { z } from 'zod';

import { complete } from '@/server/ai/ai-service';

const ASSISTANT = 'You are LifeOS, a personal productivity assistant.';

const taskSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type TaskSuggestion = z.infer<typeof taskSuggestionSchema>;

const searchItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
});

export type SearchableItem = z.infer<typeof searchItemSchema>;

export type BriefingInput = {
  agenda: { title: string; startAt: string }[];
  tasksDue: { title: string; dueAt: string | null }[];
  habits: { name: string; streak: number }[];
  recentNotes: { title: string; updatedAt: string }[];
  finance?: { balance: number; expense: number } | null;
};

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? (fenced[1] as string) : trimmed);
}

export async function summarizeNote(content: string): Promise<string> {
  return complete(
    `Summarize this note concisely in 3-5 sentences. Plain text, no markdown headings, no bullet lists.\n\nNote:\n${content}`,
    ASSISTANT
  );
}

export async function suggestTasksFromNote(content: string): Promise<TaskSuggestion[]> {
  const raw = await complete(
    `Extract actionable tasks from this note. Return ONLY a JSON array of objects with a "title" and an optional "description". No markdown, no code fences.\n\nNote:\n${content}`,
    ASSISTANT
  );
  const tasks = z.array(taskSuggestionSchema).parse(extractJson(raw));
  return tasks.slice(0, 20);
}

export async function dailyBriefing(input: BriefingInput): Promise<string> {
  const snapshot = JSON.stringify(input, null, 2);
  return complete(
    `Here is a snapshot of the user's day. Write a concise daily briefing in plain text (about 5-8 lines, no markdown headings): lead with the most important items, then upcoming events, tasks due, habits on track, and a one-line finance note.\n\n${snapshot}`,
    ASSISTANT
  );
}

export async function naturalLanguageSearch(
  query: string,
  items: SearchableItem[]
): Promise<SearchableItem[]> {
  const raw = await complete(
    `The user typed: "${query}". Rank the following items by relevance to that intent and return ONLY a JSON array of the top matches (at most 8), each as {"id","type","title"}. No markdown, no code fences.\n\nItems:\n${JSON.stringify(items)}`,
    ASSISTANT
  );
  return z.array(searchItemSchema).parse(extractJson(raw));
}
