import { NextRequest } from 'next/server';
import { resolveActor } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/respond';
import { Errors } from '@/lib/api/errors';
import type { MeResponse } from '@/lib/api/contracts/auth';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveActor(req);
    if (!actor) throw Errors.unauthorized();
    const me: MeResponse = {
      id: actor.id,
      username: actor.username,
      fullName: actor.fullName,
      roleName: actor.roleName,
      employeeId: actor.employeeId,
      permissions: [...actor.permissions],
    };
    return ok(me);
  } catch (e) {
    return fail(e);
  }
}
