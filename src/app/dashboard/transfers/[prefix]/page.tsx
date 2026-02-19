"use client";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { LibyanTransactionsDataTable } from "@/app/dashboard/libyan-transactions/data-table";
import type { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const prefixToTitle: Record<string, string> = {
    'dd': 'تحويلات DD (تحويل داخلي)',
    'dc': 'تحويلات DC (شراء كروت)',
    'dg': 'تحويلات DG (تحويل للجنيه)',
    'ec': 'تحويلات EC',
    'el': 'تحويلات EL',
    'ew': 'تحويلات EW',
    'dh': 'تحويلات DH (تحويل للجنيه)',
};

export default function TransfersByPrefixPage() {
  const params = useParams();
  const prefix = typeof params.prefix === 'string' ? params.prefix : '';
  const { data: transactions, isLoading, error } = useRtdbList<Transaction>("/transactions");

  const filteredTransactions = useMemo(() => {
    if (!transactions || !prefix) return [];
    return transactions.filter(t => t.id.toUpperCase().startsWith(prefix.toUpperCase()));
  }, [transactions, prefix]);

  const pageTitle = prefixToTitle[prefix.toLowerCase()] || `تحويلات ${prefix.toUpperCase()}`;

  if (isLoading) {
    return (
      <div className="space-y-4">
         <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-10 w-[260px]" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[150px]" />
                  <Skeleton className="h-10 w-[120px]" />
                </div>
                <div className="rounded-lg border p-4 space-y-2 mt-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
         </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>;
  }

  return (
     <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>عرض لجميع المعاملات التي تبدأ بالمعرف {prefix.toUpperCase()}.</CardDescription>
        </CardHeader>
        <CardContent>
            <LibyanTransactionsDataTable initialData={filteredTransactions || []} />
        </CardContent>
     </Card>
  );
}
