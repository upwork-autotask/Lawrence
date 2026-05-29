import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import { orgSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import log from 'electron-log/main';
import type {
  SettingKey, SettingsGetResponse, SmtpConfigValues,
} from '@shared/ipc/settings';

/** Returns every row in `org_settings` as a flat `{ key: value }` map. */
export function listSettings(): SettingsGetResponse {
  const db = getDb();
  const rows = db.select({ key: orgSettings.key, value: orgSettings.value }).from(orgSettings).all();
  const out: Record<string, string | null> = {};
  for (const r of rows) {
    out[r.key] = r.value;
  }
  return out;
}

/** Reads a single setting. Returns `null` if the key has never been written. */
export function getSetting(key: SettingKey): string | null {
  const db = getDb();
  const row = db
    .select({ value: orgSettings.value })
    .from(orgSettings)
    .where(eq(orgSettings.key, key))
    .get();
  return row?.value ?? null;
}

/**
 * UPSERT a single setting. Inserts on first write, updates otherwise.
 * All writes go through `mutate()` so the outbox + audit log stay correct.
 */
export async function setSetting(
  key: SettingKey, value: string | null, userId: number,
): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(orgSettings).where(eq(orgSettings.key, key)).get();
    if (!before) {
      const inserted = tx.insert(orgSettings).values({
        key, value,
        createdBy: userId,
        updatedBy: userId,
      }).returning().get();
      return {
        result: null,
        envelope: {
          entity: 'org_settings', entityId: inserted.id, op: 'insert',
          payload: inserted, baseVersion: 0, userId, after: inserted,
        },
      };
    }
    const next = {
      value,
      updatedAt: new Date(),
      updatedBy: userId,
      syncVersion: (before.syncVersion ?? 0) + 1,
    };
    tx.update(orgSettings).set(next).where(eq(orgSettings.id, before.id)).run();
    return {
      result: null,
      envelope: {
        entity: 'org_settings', entityId: before.id, op: 'update',
        payload: { key, ...next }, baseVersion: before.syncVersion ?? 0, userId,
        before, after: { ...before, ...next },
      },
    };
  });
}

/**
 * Reads the SMTP-related keys from `org_settings` and returns them as a
 * typed object. Defaults match the Zod schema's defaults so the mail
 * worker always sees a usable config even before the user saves the form.
 */
export function getSmtpConfig(): SmtpConfigValues {
  const all = listSettings();
  const portRaw = all['smtp.port'];
  const portParsed = portRaw ? Number(portRaw) : 587;
  return {
    host: all['smtp.host'] ?? '',
    port: Number.isFinite(portParsed) && portParsed > 0 ? portParsed : 587,
    user: all['smtp.user'] ?? null,
    password: all['smtp.password'] ?? null,
    fromName: all['smtp.from_name'] ?? null,
    fromAddress: all['smtp.from_address'] ?? null,
    tls: all['smtp.tls'] !== 'false',
  };
}

/**
 * STUB: would dispatch a one-shot test email via nodemailer using the
 * persisted SMTP config. Wiring the real send is deferred to the mailer
 * service pass; for now we just log and return ok so the renderer can
 * confirm the round-trip without a working SMTP server.
 *
 * TODO: replace with `nodemailer.createTransport(getSmtpConfig()).sendMail(...)`
 * once the EmailWorker lands.
 */
export async function testSmtp(to: string): Promise<{ ok: true }> {
  const cfg = getSmtpConfig();
  log.info(`[settings.testSmtp] Would send test email to ${to} via ${cfg.host}:${cfg.port}`);
  // eslint-disable-next-line no-console
  console.log(`Would send test email to ${to}`);
  return { ok: true };
}
