import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { attachments } from '@/lib/db/schema';
import { resolveActor } from '@/lib/auth/session';
import { Permissions } from '@/lib/auth/permissions';
import { readUpload } from '@/lib/storage';

const err = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message } }, { status });

/** Stream an attachment's bytes back to the browser. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return err(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!actor.permissions.has(Permissions.EmployeeRead)) return err(403, 'FORBIDDEN', 'No permission');
  const { id } = await params;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)))
    .limit(1);
  if (!row) return err(404, 'NOT_FOUND', 'Attachment not found');

  let data: Buffer;
  try {
    data = await readUpload(row.storageKey);
  } catch {
    return err(404, 'NOT_FOUND', 'File missing from storage');
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': row.mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${row.filename.replace(/"/g, '')}"`,
      'Content-Length': String(data.length),
    },
  });
}
