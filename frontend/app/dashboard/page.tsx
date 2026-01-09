'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/kpi-card';
import { AssetsTable } from '@/components/assets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import type { ReportingSummary, AssetsResponse } from '@/types/reporting';

export default function DashboardPage() {
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [assets, setAssets] = useState<AssetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryData, assetsData] = await Promise.all([
          apiClient.get<ReportingSummary>('/reporting/summary'),
          apiClient.get<AssetsResponse>(`/reporting/assets?page=${page}&limit=${limit}`),
        ]);

        setSummary(summaryData);
        setAssets(assetsData);
      } catch (err) {
        if (err instanceof Error) {
          const errorWithStatus = err as Error & { statusCode?: number };
          if (errorWithStatus.statusCode === 403) {
            setError('No autorizado');
          } else if (errorWithStatus.statusCode === 429) {
            setError('Demasiadas solicitudes. Por favor, intente más tarde.');
          } else {
            setError(err.message || 'Failed to load data');
          }
        } else {
          setError('Failed to load data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, limit]);

  const formatCurrency = (value: string, currency: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/assistant" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Assistant
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <p className="text-gray-600">Overview of your investment portfolio</p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {isLoading ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border p-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {summary?.totalsByCurrency.map((item) => (
                    <KPICard
                      key={item.currency}
                      title={`Total (${item.currency})`}
                      value={formatCurrency(item.total, item.currency)}
                    />
                  ))}
                  <KPICard
                    title="Total Assets"
                    value={summary?.assetsCount ?? 0}
                  />
                  <KPICard
                    title="Assets Without Valuation"
                    value={summary?.assetsWithoutValuationCount ?? 0}
                    description="Assets that need valuation"
                  />
                </div>

                {/* Assets Table */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">Assets</h2>
                    <p className="text-sm text-gray-600">
                      {assets?.pagination.total
                        ? `Showing ${assets.data.length} of ${assets.pagination.total} assets`
                        : 'No assets found'}
                    </p>
                  </div>
                  {assets ? (
                    <>
                      <AssetsTable assets={assets.data} />
                      {assets.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set('page', String(page - 1));
                              router.push(`/dashboard?${params.toString()}`);
                            }}
                          >
                            Prev
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {page} of {assets.pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            disabled={page >= assets.pagination.totalPages}
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set('page', String(page + 1));
                              router.push(`/dashboard?${params.toString()}`);
                            }}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                      No assets available
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
