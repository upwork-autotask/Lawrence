import { z } from 'zod';

/**
 * Settings are stored as flat key/value rows (org_settings). The client sends a
 * batch of entries; the server upserts each by key. Known keys drive the UI form,
 * but the contract stays generic so new keys can be added without a schema change.
 */
export const SettingsUpsert = z.object({
  entries: z.array(
    z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.string(),
    }),
  ),
});

export type SettingsUpsertInput = z.infer<typeof SettingsUpsert>;

/** All settings, as a key → value record. */
export type SettingsResponse = Record<string, string>;

/** Known setting keys the Settings UI renders fields for. */
export const SETTING_KEYS = [
  'orgName',
  'smtpHost',
  'smtpPort',
  'smtpUser',
  'smtpFrom',
  'brandingNote',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
