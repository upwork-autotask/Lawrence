import { Construction } from 'lucide-react';

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Construction className="h-10 w-10" />
      <div className="text-lg font-medium text-foreground">{title}</div>
      <p className="max-w-md text-center text-sm">
        This module is on the build roadmap and will be available in an upcoming release.
        Until then the other modules in the sidebar are fully functional.
      </p>
    </div>
  );
}
