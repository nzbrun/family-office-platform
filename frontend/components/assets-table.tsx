'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Asset } from '@/types/reporting';

interface AssetsTableProps {
  assets: Asset[];
}

export function AssetsTable({ assets }: AssetsTableProps) {
  const formatCurrency = (value: string, currency: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (assets.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        No assets found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Latest Valuation</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Legal Entity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>{asset.type}</TableCell>
              <TableCell>
                {asset.latestValuation ? (
                  <div>
                    <div className="font-medium">
                      {formatCurrency(asset.latestValuation.value, asset.latestValuation.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(asset.latestValuation.date)}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{asset.currency}</TableCell>
              <TableCell>
                {asset.legalEntity ? asset.legalEntity.name : <span className="text-muted-foreground">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
