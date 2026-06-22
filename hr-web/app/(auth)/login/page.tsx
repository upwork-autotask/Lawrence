'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api/auth-client';
import { LoginInput, BootstrapInput } from '@/lib/api/contracts/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<'loading' | 'login' | 'bootstrap'>('loading');
  const [serverError, setServerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    authApi.status().then((r) => setMode(r.ok && r.value.usersExist ? 'login' : 'bootstrap'));
  }, []);

  const loginForm = useForm({ resolver: zodResolver(LoginInput), defaultValues: { username: '', password: '' } });
  const bootForm = useForm({ resolver: zodResolver(BootstrapInput), defaultValues: { fullName: '', username: '', password: '' } });

  async function onLogin(values: { username: string; password: string }) {
    setServerError(null);
    const r = await authApi.login(values.username, values.password);
    if (r.ok) router.replace('/employees');
    else setServerError(r.error.code === 'UNAUTHENTICATED' ? 'Invalid username or password.' : r.error.message);
  }

  async function onBootstrap(values: { fullName: string; username: string; password: string }) {
    setServerError(null);
    const r = await authApi.bootstrap(values);
    if (r.ok) router.replace('/employees');
    else setServerError(r.error.message);
  }

  if (mode === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Sign in' : 'Create administrator'}</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'HR Management System' : 'First-run setup — this account has full access.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
              <FormField label="Username" error={loginForm.formState.errors.username?.message}>
                <Input autoFocus autoComplete="username" {...loginForm.register('username')} />
              </FormField>
              <FormField label="Password" error={loginForm.formState.errors.password?.message}>
                <Input type="password" autoComplete="current-password" {...loginForm.register('password')} />
              </FormField>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={bootForm.handleSubmit(onBootstrap)}>
              <FormField label="Full name" error={bootForm.formState.errors.fullName?.message}>
                <Input autoFocus {...bootForm.register('fullName')} />
              </FormField>
              <FormField label="Username" error={bootForm.formState.errors.username?.message}>
                <Input {...bootForm.register('username')} />
              </FormField>
              <FormField label="Password" error={bootForm.formState.errors.password?.message}>
                <Input type="password" {...bootForm.register('password')} />
              </FormField>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={bootForm.formState.isSubmitting}>
                {bootForm.formState.isSubmitting ? 'Creating…' : 'Create administrator'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">v0.1.0</CardFooter>
      </Card>
    </div>
  );
}
