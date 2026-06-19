import { usersExist } from '@/lib/auth/service';
import { ok, fail } from '@/lib/api/respond';

export async function GET() {
  try {
    return ok({ usersExist: await usersExist() });
  } catch (e) {
    return fail(e);
  }
}
