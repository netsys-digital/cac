import type { UserRole, UserStatus } from '@cac/shared';
import { api } from './http';

export type AdminUserOrg = {
  id: string;
  name: string;
  slug: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  memberships: Array<{
    id: string;
    role: string;
    organization: AdminUserOrg;
  }>;
};

export const adminUsersApi = {
  list: (token: string, query?: { q?: string; role?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (query?.q) params.set('q', query.q);
    if (query?.role) params.set('role', query.role);
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();
    return api<{ items: AdminUser[] }>(`/api/admin/users${qs ? `?${qs}` : ''}`, {
      accessToken: token,
    });
  },
  get: (token: string, id: string) =>
    api<{ user: AdminUser }>(`/api/admin/users/${id}`, { accessToken: token }),
  update: (
    token: string,
    id: string,
    body: { name?: string; email?: string; role?: UserRole },
  ) =>
    api<{ user: AdminUser }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    }),
  disable: (token: string, id: string) =>
    api<{ user: AdminUser }>(`/api/admin/users/${id}/disable`, {
      method: 'POST',
      accessToken: token,
    }),
  enable: (token: string, id: string) =>
    api<{ user: AdminUser }>(`/api/admin/users/${id}/enable`, {
      method: 'POST',
      accessToken: token,
    }),
  resetPassword: (token: string, id: string, password?: string) =>
    api<{ user: AdminUser; temporaryPassword: string }>(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      accessToken: token,
      body: JSON.stringify(password ? { password } : {}),
    }),
  remove: (token: string, id: string) =>
    api<void>(`/api/admin/users/${id}`, { method: 'DELETE', accessToken: token }),
};
