export const DEFAULT_AI_MODEL = 'anthropic/claude-sonnet-4.6';

export type AIConfig = {
  configured: boolean;
  model: string;
};

export function getAIConfig(env: Record<string, string | undefined> = process.env): AIConfig {
  return {
    configured: Boolean(env['AI_GATEWAY_API_KEY']),
    model: env['AI_MODEL'] ?? DEFAULT_AI_MODEL,
  };
}
