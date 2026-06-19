import { NextRequest } from 'next/server';
import { bootstrap } from '@/lib/auth/service';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/auth/session';
import { BootstrapInput } from '@/lib/api/contracts/auth';
import { ok, fail, zodFields } from '@/lib/api/respond';
import { Errors } from '@/lib/api/errors';

export async function POST(req: NextRequest) {
  try {
    const parsed = BootstrapInput.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) throw Errors.validation(zodFields(parsed.error));
    const meta = {
      ip: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    };
    const result = await bootstrap(parsed.data, meta);
    const res = ok({ user: result.user, token: result.token });
    res.cookies.set(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (e) {
    return fail(e);
  }
}
