/**
 * Types for Reporting API responses
 */

export interface TotalByCurrency {
  currency: string;
  total: string; // Decimal as string from backend
}

export interface TotalByAssetType {
  type: string;
  total: string;
}

export interface TotalByLegalEntity {
  legalEntityId: string;
  name: string;
  total: string;
}

export interface ReportingSummary {
  totalsByCurrency: TotalByCurrency[];
  totalsByAssetType: TotalByAssetType[];
  totalsByLegalEntity: TotalByLegalEntity[];
  assetsWithoutValuationCount: number;
  assetsCount: number;
}

export interface LatestValuation {
  date: string; // ISO date string
  value: string; // Decimal as string
  currency: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  type: string;
  country: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  currency: string;
  legalEntityId: string | null;
  latestValuation: LatestValuation | null;
  legalEntity: LegalEntity | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetsResponse {
  data: Asset[];
  pagination: Pagination;
}
