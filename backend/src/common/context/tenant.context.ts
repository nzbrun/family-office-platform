export interface TenantContext {
  userId: string;
  tenantId: string | null;
  role: string;
  effectiveTenantId: string | null; // tenantId from JWT or X-Tenant-Id header for SUPER_ADMIN
}
