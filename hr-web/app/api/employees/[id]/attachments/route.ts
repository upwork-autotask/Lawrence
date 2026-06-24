import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { attachments, auditLog } from '@/lib/db/schema';
import { resolveActor } from '@/lib/auth/session';
import { Permissions } from '@/lib/auth/permissions';
import { saveUpload } from '@/lib/storage';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const err = (status: number, code: string, message: string) =>
  NextResponse.json({ error: { code, message } }, { status });

/** List an employee's attachments. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return err(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!actor.permissions.has(Permissions.EmployeeRead)) return err(403, 'FORBIDDEN', 'No permission');
  const { id } = await params;
  const db = await getDb();
  const rows = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.entityType, 'employee'), eq(attachments.entityId, id), isNull(attachments.deletedAt)))
    .orderBy(desc(attachments.createdAt));
  return NextResponse.json({ value: { items: rows, total: rows.length } });
}

/** Upload a document for an employee (multipart/form-data: file, category). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return err(401, 'UNAUTHENTICATED', 'Authentication required');
  if (!actor.permissions.has(Permissions.EmployeeWrite)) return err(403, 'FORBIDDEN', 'No permission');
  const { id } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err(400, 'BAD_REQUEST', 'Expected multipart/form-data');
  }
  const file = form.get('file');
  const category = (form.get('category') as string) || null;
  if (!(file instanceof File) || file.size === 0) return err(422, 'VALIDATION', 'A file is required');
  if (file.size > MAX_BYTES) return err(413, 'TOO_LARGE', 'File exceeds the 15 MB limit');

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = crypto.randomUUID(); // on-disk name — never the client filename
  await saveUpload(key, bytes);

  const db = await getDb();
  const [row] = await db
    .insert(attachments)
    .values({
      entityType: 'employee',
      entityId: id,
      category,
      storageKey: key,
      filename: file.name,
      mime: file.type || 'application/octet-stream',
      size: bytes.length,
      uploadedBy: actor.id,
      createdBy: actor.id,
      updatedBy: actor.id,
    })
    .returning();

  await db.insert(auditLog).values({
    actorId: actor.id, action: 'create', entityType: 'attachment', entityId: row.id, after: row,
  });

  return NextResponse.json({ value: row }, { status: 201 });
}
