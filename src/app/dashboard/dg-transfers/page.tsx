"use client";

import { useMemo } from "react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { EgyptianTransfersDataTable } from "@/app/dashboard/egyptian-transactions/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, EgyptTransferTransaction } from "@/lib/types";

export default function DgTransfersPage() {
  const { data: transactions, isLoading, error } = useRtdbList<Transaction>("/transactions");

  const dgTransfers = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
      (t): t is EgyptTransferTransaction =>
        t.type === "egypt_transfer" && t.id.startsWith("DG")
    );
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-[260px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading transfers: {error.message}</div>;
  }

  return (
    <div>
      <EgyptianTransfersDataTable initialData={dgTransfers} />
    </div>
  );
}
