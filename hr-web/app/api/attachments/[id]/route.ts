import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { attachments, auditLog } from '@/lib/db/schema';
import { resolveActor } from '@/lib/auth/session';
import { Permissions } from '@/lib/auth/permissions';
import { deleteUpload } from '@/lib/storage';

const err = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message } }, { status });

/** Delete an attachment (row + file). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return err(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!actor.permissions.has(Permissions.EmployeeWrite)) return err(403, 'FORBIDDEN', 'No permission');
  const { id } = await params;

  const db = await getDb();
  const [row] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)))
    .limit(1);
  if (!row) return err(404, 'NOT_FOUND', 'Attachment not found');

  await db.update(attachments).set({ deletedAt: new Date(), updatedBy: actor.id }).where(eq(attachments.id, id));
  await deleteUpload(row.storageKey);
  await db.insert(auditLog).values({
    actorId: actor.id, action: 'delete', entityType: 'attachment', entityId: id, before: row,
  });

  return NextResponse.json({ value: { id } });
}
