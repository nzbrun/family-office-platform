'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<unknown>(null);
  const [assets, setAssets] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryData, assetsData] = await Promise.all([
          apiClient.get('/reporting/summary'),
          apiClient.get('/reporting/assets?page=1&limit=20'),
        ]);

        setSummary(summaryData);
        setAssets(assetsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 mb-6">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <pre className="bg-white p-4 rounded border overflow-auto">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Assets</h2>
              <pre className="bg-white p-4 rounded border overflow-auto">
                {JSON.stringify(assets, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
