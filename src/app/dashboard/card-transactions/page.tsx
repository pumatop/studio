'use client';
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

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>;
  }

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>معاملات شراء الكروت (DC)</CardTitle>
        <CardDescription>
          عرض لجميع معاملات شراء الكروت المسجلة في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!cardTransactions || cardTransactions.length === 0) ? (
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
        ) : (
          <CardTransactionsDataTable initialData={cardTransactions || []} />
        )}
      </CardContent>
    </Card>
  );
}
