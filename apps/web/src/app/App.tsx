import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { UserRole } from '@cac/shared';
import { RequireAuth } from './components/RequireAuth';
import { RequireRole } from './components/RequireRole';
import { PublishGate } from './components/PublishGate';
import { AuthLayout } from './layout/AuthLayout';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/HomePage';
import { RepresentationListPage } from './pages/org/RepresentationListPage';
import { RepresentationWizardPage } from './pages/org/RepresentationWizardPage';
import { AdminRepresentationPage } from './pages/admin/AdminRepresentationPage';
import { AdminDomainsPage } from './pages/admin/AdminDomainsPage';
import { AdminOrganizationsPage } from './pages/admin/AdminOrganizationsPage';
import { AdminCuratePage } from './pages/admin/AdminCuratePage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { NewTechnologyPage } from './pages/catalog/NewTechnologyPage';
import { NewChallengePage } from './pages/catalog/NewChallengePage';
import { NewFundingOfferPage } from './pages/catalog/NewFundingOfferPage';
import { NewCasePage } from './pages/catalog/NewCasePage';
import { MyContentsPage } from './pages/catalog/MyContentsPage';
import { EditTechnologyPage } from './pages/catalog/EditTechnologyPage';
import { EditChallengePage } from './pages/catalog/EditChallengePage';
import { EditFundingOfferPage } from './pages/catalog/EditFundingOfferPage';
import { EditCasePage } from './pages/catalog/EditCasePage';
import { NewConnectionPage } from './pages/connections/NewConnectionPage';
import { MyConnectionsPage } from './pages/connections/MyConnectionsPage';
import { RepresentationProvider } from './auth/RepresentationContext';
import { StaffTasksProvider } from './auth/StaffTasksContext';

function LoginWithReturn() {
  const [params] = useSearchParams();
  const returnUrl = params.get('returnUrl');
  return <LoginPage forcedFrom={returnUrl} />;
}

function AuthedShell() {
  return (
    <RepresentationProvider>
      <StaffTasksProvider>
        <AppShell />
      </StaffTasksProvider>
    </RepresentationProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginWithReturn />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route
        path="/"
        element={
          <RequireAuth>
            <AuthedShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="welcome" element={<Navigate to="/" replace />} />
        <Route path="org/representation" element={<RepresentationListPage />} />
        <Route path="org/representation/new" element={<RepresentationWizardPage />} />
        <Route
          path="my/contents"
          element={
            <PublishGate>
              <MyContentsPage />
            </PublishGate>
          }
        />
        <Route
          path="catalog/technologies/new"
          element={
            <PublishGate>
              <NewTechnologyPage />
            </PublishGate>
          }
        />
        <Route path="catalog/technologies/:id/edit" element={<EditTechnologyPage />} />
        <Route
          path="catalog/challenges/new"
          element={
            <PublishGate>
              <NewChallengePage />
            </PublishGate>
          }
        />
        <Route path="catalog/challenges/:id/edit" element={<EditChallengePage />} />
        <Route
          path="funding-offers/new"
          element={
            <PublishGate>
              <NewFundingOfferPage />
            </PublishGate>
          }
        />
        <Route path="funding-offers/:id/edit" element={<EditFundingOfferPage />} />
        <Route
          path="cases/new"
          element={
            <PublishGate>
              <NewCasePage />
            </PublishGate>
          }
        />
        <Route path="cases/:id/edit" element={<EditCasePage />} />
        <Route path="connections/new" element={<NewConnectionPage />} />
        <Route path="my/connections" element={<MyConnectionsPage />} />
        <Route path="offer/new" element={<Navigate to="/catalog/technologies/new" replace />} />
        <Route path="demand/new" element={<Navigate to="/catalog/challenges/new" replace />} />
        <Route
          path="admin/representation"
          element={
            <RequireRole roles={[UserRole.ADMIN, UserRole.CURADOR]}>
              <AdminRepresentationPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/domains"
          element={
            <RequireRole roles={[UserRole.ADMIN, UserRole.CURADOR]}>
              <AdminDomainsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/organizations"
          element={
            <RequireRole roles={[UserRole.ADMIN, UserRole.CURADOR]}>
              <AdminOrganizationsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/curate"
          element={
            <RequireRole roles={[UserRole.ADMIN, UserRole.CURADOR]}>
              <AdminCuratePage />
            </RequireRole>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRole roles={[UserRole.ADMIN]}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
