'use client';

import { useMemo } from "react";
import { useRtdbList } from "@/firebase";
import { EgyptianTransfersDataTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction, EgyptTransferTransaction, User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EgyptianTransfersPage() {
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


  const egyptianTransfers = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(
      (t): t is EgyptTransferTransaction => t.type === "egypt_transfer"
    );
  }, [transactions]);

  if (error) {
    return <div className="text-red-500">Error loading transfers: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل التحويلات المصرية</CardTitle>
        <CardDescription>
          عرض لجميع التحويلات المصرية المسجلة في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!egyptianTransfers || egyptianTransfers.length === 0) ? (
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
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <EgyptianTransfersDataTable initialData={egyptianTransfers || []} />
        )}
      </CardContent>
    </Card>
  );
}
