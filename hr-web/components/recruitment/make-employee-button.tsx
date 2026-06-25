'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { makeEmployee } from '@/lib/api/recruitment-assessment-client';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { Button } from '@/components/ui/button';

/**
 * "Make Employee" action (Access candidate → employee conversion). Visible only
 * with both EmployeeWrite and RecruitmentWrite; the route itself re-checks the
 * privileged EmployeeWrite gate server-side.
 */
export function MakeEmployeeButton({
  candidateId,
  recruited,
  onConverted,
}: {
  candidateId: string;
  recruited?: boolean;
  onConverted?: (employeeId: string) => void;
}) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [busy, setBusy] = React.useState(false);

  const allowed = can(me, Permissions.EmployeeWrite) && can(me, Permissions.RecruitmentWrite);
  if (!allowed) return null;

  if (recruited) {
    return (
      <Button variant="outline" size="sm" disabled>
        <UserPlus className="h-4 w-4" /> Employee created
      </Button>
    );
  }

  async function onClick() {
    if (!confirm('Create an employee record from this candidate?')) return;
    setBusy(true);
    const r = await makeEmployee(candidateId);
    setBusy(false);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['candidates'] });
    qc.invalidateQueries({ queryKey: ['candidate-assessments'] });
    qc.invalidateQueries({ queryKey: ['employees'] });
    onConverted?.(r.value.employeeId);
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      <UserPlus className="h-4 w-4" /> {busy ? 'Creating…' : 'Make employee'}
    </Button>
  );
}
