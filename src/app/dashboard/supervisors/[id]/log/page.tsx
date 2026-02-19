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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


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
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full space-y-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-10 w-full sm:w-[170px]" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-lg" />
                <div className="rounded-lg border p-4 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </CardContent>
      </Card>
    );
  }

  if (!supervisor) {
    notFound();
  }

  return (
    <Card>
       <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full">
                    <CardTitle>سجل عمليات: {supervisor.name}</CardTitle>
                    <CardDescription>
                        عرض جميع التحويلات المنفذة والمرفوضة من قبل المشرف/المندوب.
                    </CardDescription>
                </div>
                <Link href="/dashboard/supervisors" className="w-full sm:w-auto shrink-0">
                    <Button variant="outline" className="w-full">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        العودة للمشرفين
                    </Button>
                </Link>
            </div>
       </CardHeader>
       <CardContent>
            <SupervisorLogDataTable initialData={supervisorTransfers} />
       </CardContent>
    </Card>
  );
}
