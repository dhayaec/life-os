import 'server-only';

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const PRISMA_CODE_MESSAGES: Record<string, string> = {
  P2002: 'This value already exists.',
  P2003: 'A related record does not exist.',
  P2025: 'The record was not found or has already changed.',
};

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function getPrismaErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && /^P\d{4}$/.test(code)) return code;
  }
  return undefined;
}

export function toErrorMessage(error: unknown): string {
  const code = getPrismaErrorCode(error);
  if (code) return PRISMA_CODE_MESSAGES[code] ?? GENERIC_ERROR;
  return error instanceof Error && error.message ? error.message : GENERIC_ERROR;
}

export async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    console.error(error);
    return { ok: false, error: toErrorMessage(error) };
  }
}
