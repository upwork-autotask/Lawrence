'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings-client';
import { SETTING_KEYS, type SettingKey } from '@/lib/api/contracts/settings';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const FIELDS: { key: SettingKey; label: string; type?: string; multiline?: boolean }[] = [
  { key: 'orgName', label: 'Organisation name' },
  { key: 'smtpHost', label: 'SMTP host' },
  { key: 'smtpPort', label: 'SMTP port' },
  { key: 'smtpUser', label: 'SMTP user' },
  { key: 'smtpFrom', label: 'SMTP from address', type: 'email' },
  { key: 'brandingNote', label: 'Branding note', multiline: true },
];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.SettingsWrite);

  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const r = await settingsApi.get();
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  React.useEffect(() => {
    if (settings.data) {
      const init: Record<string, string> = {};
      for (const k of SETTING_KEYS) init[k] = settings.data[k] ?? '';
      setValues(init);
    }
  }, [settings.data]);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const entries = SETTING_KEYS.map((key) => ({ key, value: values[key] ?? '' }));
    const r = await settingsApi.save(entries);
    setSaving(false);
    if (!r.ok) return setError(r.error.message);
    setSaved(true);
    qc.invalidateQueries({ queryKey: ['settings'] });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Organisation, email, and branding configuration.</p>
      </div>

      {settings.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form className="space-y-4 rounded-lg border bg-card p-6" onSubmit={onSubmit}>
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  value={values[f.key] ?? ''}
                  disabled={!canWrite}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <Input
                  type={f.type ?? 'text'}
                  value={values[f.key] ?? ''}
                  disabled={!canWrite}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}

          {canWrite && (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          )}
          {!canWrite && <p className="text-sm text-muted-foreground">You have read-only access to settings.</p>}
        </form>
      )}
    </div>
  );
}
