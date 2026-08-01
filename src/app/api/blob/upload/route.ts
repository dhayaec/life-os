import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

import { getSession } from '@/server/session';
import { rateLimit } from '@/server/rate-limit';
import { createDocument } from '@/features/documents/services/documents-service';

const UPLOAD_TOKEN_LIMIT = 30;
const UPLOAD_TOKEN_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  if (!rateLimit(`blob-upload:${userId}`, UPLOAD_TOKEN_LIMIT, UPLOAD_TOKEN_WINDOW_MS)) {
    return new Response('Too many requests', { status: 429 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith(`${userId}/`)) {
          throw new Error('Invalid upload pathname');
        }
        return {
          maximumSizeInBytes: 50 * 1024 * 1024,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let name = blob.pathname.split('/').pop() ?? 'Untitled';
        let size = 0;
        if (tokenPayload) {
          try {
            const parsed = JSON.parse(tokenPayload) as { name?: string; size?: number };
            if (parsed.name) name = parsed.name;
            if (typeof parsed.size === 'number') size = parsed.size;
          } catch {
            // fall back to pathname-derived defaults
          }
        }
        await createDocument(userId, {
          name,
          type: blob.contentType,
          size,
          url: blob.url,
          pathname: blob.pathname,
        });
      },
    });
    return Response.json(response);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Upload failed', {
      status: 400,
    });
  }
}
