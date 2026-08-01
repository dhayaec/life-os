import { afterEach, describe, expect, it } from 'vitest';

import { AINotConfiguredError } from '@/server/ai/ai-service';
import { DEFAULT_AI_MODEL, getAIConfig } from '@/server/ai/config';
import {
  dailyBriefing,
  naturalLanguageSearch,
  suggestTasksFromNote,
  summarizeNote,
} from '@/server/ai/operations';

const originalKey = process.env.AI_GATEWAY_API_KEY;
const originalModel = process.env.AI_MODEL;

afterEach(() => {
  if (originalKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.AI_MODEL;
  else process.env.AI_MODEL = originalModel;
});

describe('getAIConfig', () => {
  it('reports not configured without an API key', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    expect(getAIConfig().configured).toBe(false);
  });

  it('defaults to the current model when AI_MODEL is unset', () => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.AI_MODEL;
    expect(getAIConfig().model).toBe(DEFAULT_AI_MODEL);
  });

  it('reports configured and honors AI_MODEL when a key is present', () => {
    process.env.AI_GATEWAY_API_KEY = 'test-key';
    process.env.AI_MODEL = 'anthropic/claude-haiku-4.5';
    const config = getAIConfig();
    expect(config.configured).toBe(true);
    expect(config.model).toBe('anthropic/claude-haiku-4.5');
  });
});

describe('AI operations without a key', () => {
  it('throw AINotConfiguredError instead of making network calls', async () => {
    delete process.env.AI_GATEWAY_API_KEY;
    await expect(summarizeNote('hello')).rejects.toBeInstanceOf(AINotConfiguredError);
    await expect(suggestTasksFromNote('hello')).rejects.toBeInstanceOf(AINotConfiguredError);
    await expect(
      dailyBriefing({ agenda: [], tasksDue: [], habits: [], recentNotes: [] })
    ).rejects.toBeInstanceOf(AINotConfiguredError);
    await expect(naturalLanguageSearch('x', [])).rejects.toBeInstanceOf(AINotConfiguredError);
  });
});
