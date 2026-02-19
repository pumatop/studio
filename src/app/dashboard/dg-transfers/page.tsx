"use client";

import { useMemo } from "react";
import { useRtdbList } from "@/firebase";
import { EgyptianTransfersDataTable } from "@/app/dashboard/egyptian-transactions/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, EgyptTransferTransaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading transfers: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>التحويل من دينار لجنيه (DG)</CardTitle>
        <CardDescription>
          عرض جميع تحويلات الدينار إلى جنيه التي تبدأ بالمعرف DG.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EgyptianTransfersDataTable initialData={dgTransfers} />
      </CardContent>
    </Card>
  );
}
