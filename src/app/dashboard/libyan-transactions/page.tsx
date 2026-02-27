'use client';
import dynamic from "next/dynamic";
import { useRtdbList } from "@/firebase";
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

// استيراد ديناميكي مع تعطيل SSR لتجنب مشاكل jQuery على السيرفر
const LibyanTransactionsDataTable = dynamic(
  () => import("./data-table").then(m => m.LibyanTransactionsDataTable),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

export default function LibyanTransactionsPage() {
  const { data: users, isLoading: usersLoading, error: usersError } = useRtdbList<User>("/users");

  const transactions = useMemo(() => {
    if (!users) return [];
    return users.flatMap(user => 
        user.transactions 
            ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
            : []
    ) as Transaction[];
  }, [users]);

  const financialTransactions = useMemo(() => {
    if (!transactions) return [];
    // استثناء معاملات شراء الكروت
    return transactions.filter(t => t.type !== 'recharge_purchase');
  }, [transactions]);

  if (usersError) {
    return <div className="text-red-500">Error loading transactions: {usersError.message}</div>;
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
        {usersLoading && (!financialTransactions || financialTransactions.length === 0) ? (
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
