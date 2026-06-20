import { eq } from 'drizzle-orm';
import type { Ctx } from '@/lib/api/handler';
import { orgSettings } from '@/lib/db/schema';
import type { SettingsResponse } from '@/lib/api/contracts/settings';

/** Read all settings (excluding soft-deleted) as a key → value record. */
export async function getAllSettings(ctx: Ctx): Promise<SettingsResponse> {
  const rows = await ctx.tx.select().from(orgSettings);
  const out: SettingsResponse = {};
  for (const row of rows) {
    if (row.deletedAt) continue;
    out[row.key] = row.value ?? '';
  }
  return out;
}

/**
 * Upsert a batch of settings by key — update the existing row's value or insert a
 * new one. Each write is audited inside the request transaction (ctx.tx).
 */
export async function upsertSettings(
  ctx: Ctx,
  entries: { key: string; value: string }[],
): Promise<SettingsResponse> {
  const actorId = ctx.actor?.id ?? null;
  for (const { key, value } of entries) {
    const [existing] = await ctx.tx
      .select()
      .from(orgSettings)
      .where(eq(orgSettings.key, key))
      .limit(1);

    if (existing) {
      const [row] = await ctx.tx
        .update(orgSettings)
        .set({ value, updatedBy: actorId, updatedAt: new Date(), deletedAt: null })
        .where(eq(orgSettings.key, key))
        .returning();
      await ctx.audit({
        action: 'update',
        entityType: 'setting',
        entityId: row.id,
        before: existing,
        after: row,
      });
    } else {
      const [row] = await ctx.tx
        .insert(orgSettings)
        .values({ key, value, createdBy: actorId, updatedBy: actorId })
        .returning();
      await ctx.audit({ action: 'create', entityType: 'setting', entityId: row.id, after: row });
    }
  }
  return getAllSettings(ctx);
}
