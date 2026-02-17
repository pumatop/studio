"use client";

import { useMemo } from "react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { LibyanTransactionsDataTable } from "@/app/dashboard/libyan-transactions/data-table";
import { EgyptianTransfersDataTable } from "@/app/dashboard/egyptian-transactions/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, EgyptTransferTransaction } from "@/lib/types";

export default function AuditLogPage() {
  const { data: transactions, isLoading, error } = useRtdbList<Transaction>("/transactions");

  const egyptianTransfers = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
      (t): t is EgyptTransferTransaction => t.type === "egypt_transfer"
    );
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>سجل المعاملات العام</CardTitle>
          <CardDescription>عرض لجميع المعاملات المسجلة في النظام من قاعدة البيانات الحية.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error.message}</div>
          ) : (
            <LibyanTransactionsDataTable initialData={transactions || []} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات المصرية</CardTitle>
          <CardDescription>
            عرض لجميع التحويلات المصرية المسجلة في النظام من قاعدة البيانات الحية.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error.message}</div>
          ) : (
            <EgyptianTransfersDataTable initialData={egyptianTransfers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
