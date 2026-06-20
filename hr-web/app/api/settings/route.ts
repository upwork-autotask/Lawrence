import { withHandler } from '@/lib/api/handler';
import { SettingsUpsert } from '@/lib/api/contracts/settings';
import { getAllSettings, upsertSettings } from '@/lib/services/settings';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SettingsRead,
  handler: (_input, ctx) => getAllSettings(ctx),
});

export const PUT = withHandler({
  schema: SettingsUpsert,
  source: 'body',
  permission: Permissions.SettingsWrite,
  handler: (input, ctx) => upsertSettings(ctx, input.entries),
});
