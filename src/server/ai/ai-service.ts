import 'server-only';

import { generateText } from 'ai';

import { getAIConfig } from '@/server/ai/config';

export class AINotConfiguredError extends Error {
  constructor() {
    super(
      'AI is not configured. Add AI_GATEWAY_API_KEY (and optionally AI_MODEL) to your environment to enable AI features.'
    );
    this.name = 'AINotConfiguredError';
  }
}

export async function complete(prompt: string, instructions: string): Promise<string> {
  const { configured, model } = getAIConfig();
  if (!configured) {
    throw new AINotConfiguredError();
  }
  const { text } = await generateText({ model, instructions, prompt });
  return text;
}
