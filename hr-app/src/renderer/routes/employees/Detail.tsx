import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Pencil, ArrowLeft } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';

export function EmployeeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const empId = Number(id);
  const canEdit = useCan(Permissions.EmployeeWrite);

  const q = useQuery({
    queryKey: ['employee', empId],
    queryFn: async () => {
      const r = await api.employees.get({ id: empId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const e = q.data;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{e.fullName}</h1>
            <p className="text-sm text-muted-foreground">{e.employeeNumber}</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/employees/${empId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Email" value={e.email} />
          <Field label="Mobile" value={e.phoneMobile} />
          <Field label="Status" value={e.employmentStatus} />
          <Field label="Department" value={e.departmentName} />
          <Field label="Job title" value={e.jobTitleName} />
          <Field label="Region" value={e.regionName} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
