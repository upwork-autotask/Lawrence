import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  OrgInfoSchema, SmtpConfigSchema,
  type OrgInfoValues, type SmtpConfigValues, type SettingKey,
} from '@shared/ipc/settings';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@renderer/components/ui/tabs';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import { CheckCircle2, Send } from 'lucide-react';

type SettingsMap = Record<string, string | null>;

export function SettingsPage() {
  const canWrite = useCan(Permissions.SettingsWrite);

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<SettingsMap> => {
      const r = await api.settings.get({});
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Organisation info, SMTP and backup configuration.
        </p>
      </div>

      {query.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {query.data && (
        <Tabs defaultValue="org">
          <TabsList>
            <TabsTrigger value="org">Org info</TabsTrigger>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
          </TabsList>

          <TabsContent value="org">
            <OrgInfoTab settings={query.data} canWrite={canWrite} />
          </TabsContent>
          <TabsContent value="smtp">
            <SmtpTab settings={query.data} canWrite={canWrite} />
          </TabsContent>
          <TabsContent value="backup">
            <BackupTab settings={query.data} canWrite={canWrite} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/** Shared mutation hook — persists a batch of key/value pairs sequentially. */
function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (changes: { key: SettingKey; value: string | null }[]) => {
      for (const c of changes) {
        const r = await api.settings.set(c);
        if (!r.ok) throw r.error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

function SavedBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-green-600">
      <CheckCircle2 className="h-4 w-4" /> Saved
    </span>
  );
}

// ─── Org info tab ───────────────────────────────────────────────────────────

function OrgInfoTab({ settings, canWrite }: { settings: SettingsMap; canWrite: boolean }) {
  const save = useSaveSettings();

  const form = useForm<OrgInfoValues>({
    resolver: zodResolver(OrgInfoSchema),
    defaultValues: {
      name: settings['org.name'] ?? '',
      address: settings['org.address'] ?? '',
    },
  });

  React.useEffect(() => {
    form.reset({
      name: settings['org.name'] ?? '',
      address: settings['org.address'] ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings['org.name'], settings['org.address']]);

  const onSubmit = (v: OrgInfoValues) => {
    save.mutate([
      { key: 'org.name', value: v.name },
      { key: 'org.address', value: v.address ?? null },
    ]);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation</CardTitle>
          <CardDescription>Used on PDF headers and email footers.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <Label>Organisation name *</Label>
            <Input disabled={!canWrite} {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input disabled={!canWrite} {...form.register('address')} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-3">
        <SavedBadge visible={save.isSuccess && !form.formState.isDirty} />
        <Button type="submit" disabled={!canWrite || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

// ─── SMTP tab ───────────────────────────────────────────────────────────────

function SmtpTab({ settings, canWrite }: { settings: SettingsMap; canWrite: boolean }) {
  const save = useSaveSettings();
  const [testTo, setTestTo] = React.useState('');
  const [testStatus, setTestStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testError, setTestError] = React.useState<string | null>(null);

  const form = useForm<SmtpConfigValues>({
    resolver: zodResolver(SmtpConfigSchema),
    defaultValues: {
      host: settings['smtp.host'] ?? '',
      port: settings['smtp.port'] ? Number(settings['smtp.port']) : 587,
      user: settings['smtp.user'] ?? '',
      password: settings['smtp.password'] ?? '',
      fromName: settings['smtp.from_name'] ?? '',
      fromAddress: settings['smtp.from_address'] ?? '',
      tls: settings['smtp.tls'] !== 'false',
    },
  });

  React.useEffect(() => {
    form.reset({
      host: settings['smtp.host'] ?? '',
      port: settings['smtp.port'] ? Number(settings['smtp.port']) : 587,
      user: settings['smtp.user'] ?? '',
      password: settings['smtp.password'] ?? '',
      fromName: settings['smtp.from_name'] ?? '',
      fromAddress: settings['smtp.from_address'] ?? '',
      tls: settings['smtp.tls'] !== 'false',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings['smtp.host'], settings['smtp.port'], settings['smtp.user'],
    settings['smtp.password'], settings['smtp.from_name'],
    settings['smtp.from_address'], settings['smtp.tls'],
  ]);

  const onSubmit = (v: SmtpConfigValues) => {
    save.mutate([
      { key: 'smtp.host', value: v.host },
      { key: 'smtp.port', value: String(v.port) },
      { key: 'smtp.user', value: v.user ?? null },
      { key: 'smtp.password', value: v.password ?? null },
      { key: 'smtp.from_name', value: v.fromName ?? null },
      { key: 'smtp.from_address', value: v.fromAddress ?? null },
      { key: 'smtp.tls', value: v.tls ? 'true' : 'false' },
    ]);
  };

  async function sendTest() {
    setTestStatus('sending');
    setTestError(null);
    const r = await api.settings.testSmtp({ to: testTo });
    if (r.ok) {
      setTestStatus('sent');
    } else {
      setTestStatus('error');
      setTestError(r.error.code === 'VALIDATION'
        ? Object.values(r.error.fields).join(', ')
        : r.error.code);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SMTP server</CardTitle>
            <CardDescription>Outbound email for approvals and notifications.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Host *</Label>
              <Input disabled={!canWrite} placeholder="smtp.example.com" {...form.register('host')} />
              {form.formState.errors.host && (
                <p className="text-xs text-destructive">{form.formState.errors.host.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Port *</Label>
              <Input
                type="number"
                disabled={!canWrite}
                {...form.register('port', { valueAsNumber: true })}
              />
              {form.formState.errors.port && (
                <p className="text-xs text-destructive">{form.formState.errors.port.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input disabled={!canWrite} {...form.register('user')} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" disabled={!canWrite} {...form.register('password')} />
            </div>
            <div className="space-y-1">
              <Label>From name</Label>
              <Input disabled={!canWrite} placeholder="HR Desktop" {...form.register('fromName')} />
            </div>
            <div className="space-y-1">
              <Label>From address</Label>
              <Input
                type="email"
                disabled={!canWrite}
                placeholder="noreply@example.com"
                {...form.register('fromAddress')}
              />
              {form.formState.errors.fromAddress && (
                <p className="text-xs text-destructive">{form.formState.errors.fromAddress.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="smtp-tls"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                disabled={!canWrite}
                {...form.register('tls')}
              />
              <Label htmlFor="smtp-tls">Use TLS</Label>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-end gap-3">
          <SavedBadge visible={save.isSuccess && !form.formState.isDirty} />
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send test email</CardTitle>
          <CardDescription>
            Dispatches a one-off message using the saved SMTP config above.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>To address</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              disabled={!canWrite}
              value={testTo}
              onChange={(e) => { setTestTo(e.target.value); setTestStatus('idle'); }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!canWrite || !testTo || testStatus === 'sending'}
            onClick={sendTest}
          >
            <Send className="mr-2 h-4 w-4" />
            {testStatus === 'sending' ? 'Sending…' : 'Send test'}
          </Button>
        </CardContent>
        {testStatus === 'sent' && (
          <CardContent className="pt-0 text-sm text-green-600">
            Test dispatched (currently a stub — check the main-process log).
          </CardContent>
        )}
        {testStatus === 'error' && testError && (
          <CardContent className="pt-0 text-sm text-destructive">
            {testError}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ─── Backup tab ─────────────────────────────────────────────────────────────

const BackupFormSchema = z.object({
  dailyEnabled: z.boolean().default(false),
  retentionDays: z.coerce.number().int().positive().max(365).default(7),
});
type BackupFormValues = z.infer<typeof BackupFormSchema>;

function BackupTab({ settings, canWrite }: { settings: SettingsMap; canWrite: boolean }) {
  const save = useSaveSettings();

  const form = useForm<BackupFormValues>({
    resolver: zodResolver(BackupFormSchema),
    defaultValues: {
      dailyEnabled: settings['backup.daily_enabled'] === 'true',
      retentionDays: settings['backup.retention_days']
        ? Number(settings['backup.retention_days'])
        : 7,
    },
  });

  React.useEffect(() => {
    form.reset({
      dailyEnabled: settings['backup.daily_enabled'] === 'true',
      retentionDays: settings['backup.retention_days']
        ? Number(settings['backup.retention_days'])
        : 7,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings['backup.daily_enabled'], settings['backup.retention_days']]);

  const onSubmit = (v: BackupFormValues) => {
    save.mutate([
      { key: 'backup.daily_enabled', value: v.dailyEnabled ? 'true' : 'false' },
      { key: 'backup.retention_days', value: String(v.retentionDays) },
    ]);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup</CardTitle>
          <CardDescription>
            Automatic backups zip the database and attachments to the user data folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 pt-2">
            <input
              id="backup-enabled"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              disabled={!canWrite}
              {...form.register('dailyEnabled')}
            />
            <Label htmlFor="backup-enabled">Enable daily backups</Label>
          </div>
          <div className="space-y-1">
            <Label>Retention (days)</Label>
            <Input
              type="number"
              disabled={!canWrite}
              {...form.register('retentionDays', { valueAsNumber: true })}
            />
            {form.formState.errors.retentionDays && (
              <p className="text-xs text-destructive">{form.formState.errors.retentionDays.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-3">
        <SavedBadge visible={save.isSuccess && !form.formState.isDirty} />
        <Button type="submit" disabled={!canWrite || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
