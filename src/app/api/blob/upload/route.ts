import { del, head } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

import { getSession } from '@/server/session';
import { rateLimit } from '@/server/rate-limit';
import { toErrorMessage } from '@/server/action-result';
import { createDocument } from '@/features/documents/services/documents-service';

const UPLOAD_TOKEN_LIMIT = 30;
const UPLOAD_TOKEN_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  // The upload-completed callback is a signed server-to-server request from
  // Vercel Blob carrying no session cookie; only token generation needs auth.
  if (body.type !== 'blob.upload-completed') {
    const session = await getSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;
    if (!rateLimit(`blob-upload:${userId}`, UPLOAD_TOKEN_LIMIT, UPLOAD_TOKEN_WINDOW_MS)) {
      return new Response('Too many requests', { status: 429 });
    }
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession();
        if (!session) {
          throw new Error('Unauthorized');
        }
        const userId = session.user.id;

        if (!pathname.startsWith(`${userId}/`)) {
          throw new Error('Invalid upload pathname');
        }
        return {
          maximumSizeInBytes: 50 * 1024 * 1024,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Session is unavailable here (the callback is authenticated by the
        // x-vercel-signature); recover the owner from the user-scoped pathname
        // that onBeforeGenerateToken enforced during token generation.
        const userId = blob.pathname.split('/')[0];
        if (!userId) return;

        let name = blob.pathname.split('/').pop() ?? 'Untitled';
        if (tokenPayload) {
          try {
            const parsed = JSON.parse(tokenPayload) as { name?: string };
            if (parsed.name) name = parsed.name;
          } catch {
            // fall back to pathname-derived defaults
          }
        }
        try {
          const metadata = await head(blob.url).catch(() => null);
          await createDocument(userId, {
            name,
            type: blob.contentType,
            size: metadata?.size ?? 0,
            url: blob.url,
            pathname: blob.pathname,
          });
        } catch (error) {
          await del(blob.pathname).catch(() => {});
          throw error;
        }
      },
    });
    return Response.json(response);
  } catch (error) {
    return new Response(toErrorMessage(error), { status: 400 });
  }
}
