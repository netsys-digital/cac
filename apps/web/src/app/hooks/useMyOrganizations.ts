import { useEffect, useMemo, useState } from 'react';
import type { OrgPublishKind } from '@cac/shared';
import { myContentsApi } from '../api/myContentsApi';

export type MyOrganization = {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
  country?: string | null;
  region?: string | null;
  publishKinds?: OrgPublishKind[];
};

export function useMyOrganizations(
  accessToken: string | null | undefined,
  publishKind?: OrgPublishKind,
) {
  const [allOrgs, setAllOrgs] = useState<MyOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setAllOrgs([]);
      setOrganizationId('');
      setLoading(false);
      return;
    }
    setLoading(true);
    void myContentsApi
      .listMyOrganizations(accessToken)
      .then((res) => {
        setAllOrgs(res.items);
      })
      .catch(() => {
        setAllOrgs([]);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const orgs = useMemo(() => {
    if (!publishKind) return allOrgs;
    return allOrgs.filter((o) => (o.publishKinds ?? []).includes(publishKind));
  }, [allOrgs, publishKind]);

  useEffect(() => {
    if (orgs.length === 1) setOrganizationId(orgs[0]!.id);
    else if (orgs.length > 1) {
      setOrganizationId((prev) => (orgs.some((o) => o.id === prev) ? prev : orgs[0]!.id));
    } else setOrganizationId('');
  }, [orgs]);

  return { loading, orgs, allOrgs, organizationId, setOrganizationId };
}
