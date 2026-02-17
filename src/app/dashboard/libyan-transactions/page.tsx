"use client";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { LibyanTransactionsDataTable } from "./data-table";
import type { Transaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function LibyanTransactionsPage() {
  const { data: transactions, isLoading, error } = useRtdbList<Transaction>("/transactions");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-[260px]" />
          <Skeleton className="h-10 w-[180px]" />
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
      <LibyanTransactionsDataTable initialData={transactions || []} />
    </div>
  );
}
