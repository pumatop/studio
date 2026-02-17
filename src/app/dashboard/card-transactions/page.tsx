"use client";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { CardTransactionsDataTable } from "./data-table";
import type { Transaction, RechargePurchaseTransaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function CardTransactionsPage() {
  const { data: transactions, isLoading, error } = useRtdbList<Transaction>("/transactions");

  const cardTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
        (t): t is RechargePurchaseTransaction => t.type === 'recharge_purchase'
    );
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-[260px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>;
  }

  return (
    <div>
      <CardTransactionsDataTable initialData={cardTransactions || []} />
    </div>
  );
}
