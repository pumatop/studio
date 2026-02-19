"use client";
import { useRtdbList } from "@/firebase";
import { CardTransactionsDataTable } from "./data-table";
import type { Transaction, RechargePurchaseTransaction } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>معاملات شراء الكروت (DC)</CardTitle>
        <CardDescription>
          عرض لجميع معاملات شراء الكروت المسجلة في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardTransactionsDataTable initialData={cardTransactions || []} />
      </CardContent>
    </Card>
  );
}
