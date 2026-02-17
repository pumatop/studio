"use client";

import { useRtdbObject } from "@/firebase/rtdb/use-rtdb-object";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { SupervisorLogDataTable } from "./log-data-table";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Supervisor, Transaction, EgyptTransferTransaction } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupervisorLogPage({ params }: { params: { id: string } }) {
  const { data: supervisor, isLoading: supervisorLoading } = useRtdbObject<Supervisor>(`/supervisors/${params.id}`);
  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>('/transactions');

  const isLoading = supervisorLoading || transactionsLoading;

  const supervisorTransfers = useMemo(() => {
    if (!supervisor || !transactions) return [];
    return transactions.filter((t): t is EgyptTransferTransaction =>
      t.type === 'egypt_transfer' &&
      t.delegateName === supervisor.name &&
      (t.status === 'completed' || t.status === 'failed')
    );
  }, [supervisor, transactions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full space-y-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-lg" />
            <div className="rounded-lg border p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (!supervisor) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold">سجل عمليات: {supervisor.name}</h1>
          <p className="text-muted-foreground">
            عرض جميع التحويلات المنفذة والمرفوضة من قبل المشرف/المندوب.
          </p>
        </div>
        <Link href="/dashboard/supervisors" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للمشرفين
          </Button>
        </Link>
      </div>
      <SupervisorLogDataTable initialData={supervisorTransfers} />
    </div>
  );
}
