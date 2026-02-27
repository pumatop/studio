"use client";
import dynamic from "next/dynamic";
import { useRtdbList } from "@/firebase";
import type { Transaction, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// استيراد ديناميكي مع تعطيل SSR لتجنب مشاكل jQuery على السيرفر
const LibyanTransactionsDataTable = dynamic(
  () => import("@/app/dashboard/libyan-transactions/data-table").then(m => m.LibyanTransactionsDataTable),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

const prefixToTitle: Record<string, string> = {
    'dd': 'التحويل من دينار لدينار (DD)',
    'dg': 'التحويل من دينار لجنيه (DG)',
    'dc': 'شراء الكروت (DC)',
    'ec': 'تحويل محفظة كاش (EC)',
    'ei': 'تحويل انستاباي (EI)',
    'ew': 'وصلي للبيت (EW)',
    'el': 'تحويل انستاباي (EL)',
};

export default function TransfersByPrefixPage() {
  const params = useParams();
  const prefix = typeof params.prefix === 'string' ? params.prefix : '';
  const { data: users, isLoading: usersLoading, error: usersError } = useRtdbList<User>("/users");

  const { transactions, isLoading, error } = useMemo(() => {
      if (usersLoading) return { transactions: [], isLoading: true, error: null };
      if (usersError) return { transactions: [], isLoading: false, error: usersError };
      if (!users) return { transactions: [], isLoading: false, error: null };

      const allTransactions = users.flatMap(user => 
          user.transactions 
              ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
              : []
      ) as Transaction[];
      
      return { transactions: allTransactions, isLoading: false, error: null };
  }, [users, usersLoading, usersError]);


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
            <LibyanTransactionsDataTable initialData={filteredTransactions || []} showExchangeRate={['dg'].includes(prefix.toLowerCase())} />
        </CardContent>
     </Card>
  );
}
