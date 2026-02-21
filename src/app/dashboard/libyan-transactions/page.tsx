'use client';
import { useRtdbList } from "@/firebase";
import { LibyanTransactionsDataTable } from "./data-table";
import type { Transaction, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LibyanTransactionsPage() {
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

  const financialTransactions = useMemo(() => {
    if (!transactions) return [];
    // Exclude card purchase transactions
    return transactions.filter(t => t.type !== 'recharge_purchase');
  }, [transactions]);

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>المعاملات المالية (د.ل)</CardTitle>
        <CardDescription>
          عرض لجميع التحويلات الداخلية وتحويلات الدينار إلى جنيه.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!financialTransactions || financialTransactions.length === 0) ? (
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
        ) : (
          <LibyanTransactionsDataTable initialData={financialTransactions || []} />
        )}
      </CardContent>
    </Card>
  );
}
