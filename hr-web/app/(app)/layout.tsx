'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/hooks/use-me';
import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && me === null) router.replace('/login');
  }, [isLoading, me, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [me]);

  if (isLoading || !me) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar me={me} className="hidden md:flex" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <Sidebar
            me={me}
            className="relative h-full w-72 max-w-[85vw] shadow-xl"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar me={me} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
