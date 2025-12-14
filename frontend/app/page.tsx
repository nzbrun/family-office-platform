'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Navbar } from '@/components/navbar';
import { KPICard } from '@/components/kpi-card';
import { AssetsTable } from '@/components/assets-table';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import type { ReportingSummary, AssetsResponse } from '@/types/reporting';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [assets, setAssets] = useState<AssetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryData, assetsData] = await Promise.all([
          apiClient.get<ReportingSummary>('/reporting/summary'),
          apiClient.get<AssetsResponse>('/reporting/assets?page=1&limit=20'),
        ]);

        setSummary(summaryData);
        setAssets(assetsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>
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
                  <AssetsTable assets={assets.data} />
                ) : (
                  <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                    No assets available
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
