import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '@renderer/lib/auth';
import { AppShell } from '@renderer/components/layout/AppShell';
import { Login } from '@renderer/routes/Login';
import { EmployeesList } from '@renderer/routes/employees/List';
import { EmployeeDetail } from '@renderer/routes/employees/Detail';
import { EmployeeForm } from '@renderer/routes/employees/Form';
import { LeaveList } from '@renderer/routes/leave/List';
import { LeaveDetail } from '@renderer/routes/leave/Detail';
import { LeaveForm } from '@renderer/routes/leave/Form';
import { DisciplinaryList } from '@renderer/routes/disciplinary/List';
import { DisciplinaryDetail } from '@renderer/routes/disciplinary/Detail';
import { DisciplinaryForm } from '@renderer/routes/disciplinary/Form';
import { SettingsPage } from '@renderer/routes/settings/Page';
import { JobDescriptionsList } from '@renderer/routes/job-descriptions/List';
import { JobDescriptionDetail } from '@renderer/routes/job-descriptions/Detail';
import { JobDescriptionForm } from '@renderer/routes/job-descriptions/Form';
import { TrainingList } from '@renderer/routes/training/List';
import { TrainingDetail } from '@renderer/routes/training/Detail';
import { TrainingForm } from '@renderer/routes/training/Form';
import { PerformanceList } from '@renderer/routes/performance/List';
import { PerformanceDetail } from '@renderer/routes/performance/Detail';
import { PerformanceForm } from '@renderer/routes/performance/Form';
import { DevelopmentList } from '@renderer/routes/development/List';
import { DevelopmentDetail } from '@renderer/routes/development/Detail';
import { DevelopmentForm } from '@renderer/routes/development/Form';
import { Placeholder } from '@renderer/routes/Placeholder';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/employees" replace />} />
            <Route path="employees" element={<EmployeesList />} />
            <Route path="employees/new" element={<EmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="employees/:id/edit" element={<EmployeeForm />} />
            <Route path="leave" element={<LeaveList />} />
            <Route path="leave/new" element={<LeaveForm />} />
            <Route path="leave/:id" element={<LeaveDetail />} />
            <Route path="leave/:id/edit" element={<LeaveForm />} />
            <Route path="disciplinary" element={<DisciplinaryList />} />
            <Route path="disciplinary/new" element={<DisciplinaryForm />} />
            <Route path="disciplinary/:id" element={<DisciplinaryDetail />} />
            <Route path="disciplinary/:id/edit" element={<DisciplinaryForm />} />
            <Route path="recruitment" element={<Placeholder title="Recruitment" />} />
            <Route path="job-descriptions" element={<JobDescriptionsList />} />
            <Route path="job-descriptions/new" element={<JobDescriptionForm />} />
            <Route path="job-descriptions/:id" element={<JobDescriptionDetail />} />
            <Route path="job-descriptions/:id/edit" element={<JobDescriptionForm />} />
            <Route path="training" element={<TrainingList />} />
            <Route path="training/new" element={<TrainingForm />} />
            <Route path="training/internal/:id" element={<TrainingDetail kind="internal" />} />
            <Route path="training/internal/:id/edit" element={<TrainingForm />} />
            <Route path="training/external/:id" element={<TrainingDetail kind="external" />} />
            <Route path="training/external/:id/edit" element={<TrainingForm />} />
            <Route path="performance" element={<PerformanceList />} />
            <Route path="performance/new" element={<PerformanceForm />} />
            <Route path="performance/:id" element={<PerformanceDetail />} />
            <Route path="performance/:id/edit" element={<PerformanceForm />} />
            <Route path="development" element={<DevelopmentList />} />
            <Route path="development/new" element={<DevelopmentForm />} />
            <Route path="development/:id" element={<DevelopmentDetail />} />
            <Route path="development/:id/edit" element={<DevelopmentForm />} />
            <Route path="succession" element={<Placeholder title="Succession" />} />
            <Route path="expenses" element={<Placeholder title="Expenses" />} />
            <Route path="exit" element={<Placeholder title="Exit" />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
