import { z } from 'zod';

/**
 * Authoritative list of keys stored in the `org_settings` key/value table.
 * Renderer code uses these constants when calling `settings.set` so that
 * typos surface at compile time rather than silently writing dead rows.
 */
export const SettingKey = z.enum([
  'org.name',
  'org.address',
  'org.logo_path',
  'smtp.host',
  'smtp.port',
  'smtp.user',
  'smtp.password',
  'smtp.from_name',
  'smtp.from_address',
  'smtp.tls',
  'theme.mode',
  'backup.daily_enabled',
  'backup.retention_days',
]);
export type SettingKey = z.infer<typeof SettingKey>;

/** `settings.get` takes no parameters and returns every row as a flat map. */
export const SettingsGetRequest = z.object({});
export type SettingsGetRequest = z.infer<typeof SettingsGetRequest>;

export const SettingsGetResponse = z.record(z.string(), z.string().nullable());
export type SettingsGetResponse = z.infer<typeof SettingsGetResponse>;

/** Single-key UPSERT. `null` value clears the setting. */
export const SettingsSetRequest = z.object({
  key: SettingKey,
  value: z.string().nullable(),
});
export type SettingsSetRequest = z.infer<typeof SettingsSetRequest>;

/** "Send test email" button on the SMTP tab. */
export const SmtpTestRequest = z.object({
  to: z.string().email('Must be a valid email address'),
});
export type SmtpTestRequest = z.infer<typeof SmtpTestRequest>;

/**
 * Full SMTP form values. Renderer collects this shape and persists each
 * field individually via `settings.set`. The service exposes the same
 * shape via `getSmtpConfig()` so the mail worker can read a typed config.
 */
export const SmtpConfigSchema = z.object({
  host: z.string().min(1, 'Required'),
  port: z.coerce.number().int().positive().max(65535).default(587),
  user: z.string().nullish(),
  password: z.string().nullish(),
  fromName: z.string().nullish(),
  fromAddress: z.string().email('Must be a valid email address').nullish().or(z.literal('')),
  tls: z.boolean().default(true),
});
export type SmtpConfigValues = z.infer<typeof SmtpConfigSchema>;

/** Org branding form values. */
export const OrgInfoSchema = z.object({
  name: z.string().min(1, 'Required'),
  address: z.string().nullish(),
});
export type OrgInfoValues = z.infer<typeof OrgInfoSchema>;
