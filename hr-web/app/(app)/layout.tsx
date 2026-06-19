'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/hooks/use-me';
import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && me === null) router.replace('/login');
  }, [isLoading, me, router]);

  if (isLoading || !me) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar me={me} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar me={me} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
