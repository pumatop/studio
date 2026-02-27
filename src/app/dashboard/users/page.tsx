'use client';
import dynamic from "next/dynamic";
import { useRtdbList } from "@/firebase";
import type { User, Transaction } from "@/lib/types";
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
const UsersDataTable = dynamic(
  () => import("./data-table").then(m => m.UsersDataTable),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

export default function UsersPage() {
  const { data: users, isLoading, error } = useRtdbList<User>("/users");

  const allTransactions = useMemo(() => {
    if (!users) return [];
    return users.flatMap(user => 
        user.transactions 
            ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
            : []
    ) as Transaction[];
  }, [users]);

  if (error) {
    return <div className="text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة المستخدمين</CardTitle>
        <CardDescription>
          عرض وإدارة جميع المستخدمين المسجلين في النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!users || users.length === 0) ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[150px]" />
              <Skeleton className="h-10 w-[150px]" />
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
          <UsersDataTable initialData={users || []} allTransactions={allTransactions} transactionsLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}
