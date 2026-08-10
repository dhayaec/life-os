import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

// One fresh nonce per request. Next.js reads it from the Content-Security-Policy
// header (forwarded on the request) during SSR and attaches it to its own inline
// scripts, which lets script-src drop 'unsafe-inline'. style-src keeps
// 'unsafe-inline' as a fallback because Next.js and Tailwind inject <style>
// tags without the request nonce; CSS injection can't execute code, so this
// doesn't meaningfully weaken security.
function buildCsp(nonce: string, isProd: boolean) {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // React dev mode relies on eval for Fast Refresh; strict-dynamic still holds.
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ].join(' ');
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    // img-src/connect-src: allow Vercel Blob (Documents) + OAuth provider avatars.
    "img-src 'self' data: blob: https://*.vercel-storage.com https://*.vercel-blob.com https://*.googleusercontent.com https://avatars.githubusercontent.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' https://*.vercel-storage.com https://*.vercel-blob.com",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // The root landing page was removed — `/` now routes to the dashboard when
  // signed in and the login page otherwise.
  if (pathname === '/') {
    return NextResponse.redirect(new URL(sessionCookie ? '/dashboard' : '/login', request.url));
  }

  const isPublic = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!sessionCookie && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackURL', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const csp = buildCsp(nonce, process.env.NODE_ENV === 'production');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Forward the CSP so the renderer can read the nonce and tag its inline
  // scripts with it (official nonce-CSP guide wires it this way).
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|app-icon.svg|sw.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
