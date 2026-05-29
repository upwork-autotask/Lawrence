import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequest as LoginSchema, BootstrapRequest as BootstrapSchema } from '@shared/ipc/auth';
import { useAuth } from '@renderer/lib/auth';
import { api } from '@renderer/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';

type LoginValues = { username: string; password: string };
type BootstrapValues = { fullName: string; username: string; password: string };

export function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = React.useState<'loading' | 'login' | 'bootstrap'>('loading');
  const [serverError, setServerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const r = await api.auth.status();
      setMode(r.ok && r.value.usersExist ? 'login' : 'bootstrap');
    })();
  }, []);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const bootstrapForm = useForm<BootstrapValues>({
    resolver: zodResolver(BootstrapSchema),
    defaultValues: { fullName: '', username: '', password: '' },
  });

  async function onLogin(values: LoginValues) {
    setServerError(null);
    const r = await auth.login(values);
    if (r.ok) {
      navigate('/employees', { replace: true });
    } else {
      if (r.error.code === 'UNAUTHENTICATED') setServerError('Invalid username or password.');
      else if (r.error.code === 'VALIDATION') {
        for (const [k, v] of Object.entries(r.error.fields)) {
          loginForm.setError(k as keyof LoginValues, { message: v });
        }
      } else {
        setServerError(r.error.code === 'INTERNAL' ? r.error.message : `Error: ${r.error.code}`);
      }
    }
  }

  async function onBootstrap(values: BootstrapValues) {
    setServerError(null);
    const r = await auth.bootstrap(values);
    if (r.ok) navigate('/employees', { replace: true });
    else {
      if (r.error.code === 'VALIDATION') {
        for (const [k, v] of Object.entries(r.error.fields)) {
          bootstrapForm.setError(k as keyof BootstrapValues, { message: v });
        }
      } else {
        setServerError(r.error.code === 'CONFLICT' ? r.error.message ?? 'Already bootstrapped' : `Error: ${r.error.code}`);
      }
    }
  }

  if (mode === 'loading') {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>{mode === 'login' ? 'Sign in' : 'Create administrator'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Access your HR workspace.'
              : 'First-run setup. This account has full system access.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...loginForm.register('username')} autoComplete="username" autoFocus />
                {loginForm.formState.errors.username && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...loginForm.register('password')} autoComplete="current-password" />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={bootstrapForm.handleSubmit(onBootstrap)}>
              <div className="space-y-1">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...bootstrapForm.register('fullName')} autoFocus />
                {bootstrapForm.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{bootstrapForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...bootstrapForm.register('username')} />
                {bootstrapForm.formState.errors.username && (
                  <p className="text-xs text-destructive">{bootstrapForm.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...bootstrapForm.register('password')} />
                {bootstrapForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{bootstrapForm.formState.errors.password.message}</p>
                )}
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              <Button type="submit" className="w-full" disabled={bootstrapForm.formState.isSubmitting}>
                {bootstrapForm.formState.isSubmitting ? 'Creating…' : 'Create administrator'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          v0.1.0 · Local-only mode
        </CardFooter>
      </Card>
    </div>
  );
}
