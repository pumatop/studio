'use client';
import { useRtdbList } from "@/firebase";
import { CardTransactionsDataTable } from "./data-table";
import type { Transaction, RechargePurchaseTransaction, User } from "@/lib/types";
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
    <Card>
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
