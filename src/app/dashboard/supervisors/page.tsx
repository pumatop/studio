'use client';

import dynamic from "next/dynamic";
import { useRtdbList } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supervisor, User, Transaction } from "@/lib/types";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// استيراد ديناميكي مع تعطيل SSR لتجنب مشاكل jQuery على السيرفر
const SupervisorsDataTable = dynamic(
  () => import("./data-table").then(m => m.SupervisorsDataTable),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

export default function SupervisorsPage() {
  const { data: supervisors, isLoading: supervisorsLoading, error: supervisorsError } = useRtdbList<Supervisor>("/supervisors");
  const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");

  // تجميع كافة المعاملات من جميع المستخدمين لحساب إحصائيات المناديب
  const allTransactions = useMemo(() => {
    if (!users) return [];
    return users.flatMap(user => 
        user.transactions 
            ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
            : []
    ) as Transaction[];
  }, [users]);

  const isLoading = supervisorsLoading || usersLoading;

  if (supervisorsError) {
    return <div className="text-red-500">Error loading supervisors: {supervisorsError.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة المشرفين والمندوبين</CardTitle>
        <CardDescription>
          عرض وإدارة المشرفين والمناديب مع ملخص الأداء المالي المباشر.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!supervisors || supervisors.length === 0) ? (
           <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-10 w-full max-w-xs" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[150px]" />
                <Skeleton className="h-10 w-[100px]" />
            </div>
            <div className="rounded-lg border p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <SupervisorsDataTable initialData={supervisors || []} allTransactions={allTransactions} />
        )}
      </CardContent>
    </Card>
  );
}
