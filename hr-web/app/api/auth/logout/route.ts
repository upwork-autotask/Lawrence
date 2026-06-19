import { NextRequest } from 'next/server';
import { logout } from '@/lib/auth/service';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { verifyToken } from '@/lib/auth/jwt';
import { ok, fail } from '@/lib/api/respond';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      const claims = await verifyToken(token);
      if (claims) await logout(claims.sid);
    }
    const res = ok({ done: true });
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  } catch (e) {
    return fail(e);
  }
}
