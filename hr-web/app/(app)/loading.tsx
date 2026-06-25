import { Loader2 } from 'lucide-react';

/**
 * Route-transition fallback for the (app) content pane. Next.js renders this in
 * the <main> slot while the next route segment loads, so clicking a nav item
 * shows immediate feedback instead of a frozen-looking page.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
