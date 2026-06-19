import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/constants';

/**
 * UX-only guard: bounce unauthenticated browser navigation to /login.
 * Real authorization happens server-side in the API handler wrapper — this is
 * purely to avoid flashing an empty app shell.
 */
export function middleware(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === '/login';

  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL('/employees', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on app pages only — never on /api (the wrapper guards those) or assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
