"use client";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { FakkaLogDataTable } from "./data-table";
import type { FakkaLog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FakkaLogPage() {
  const { data: fakkaLogs, isLoading, error } = useRtdbList<FakkaLog>("/fakkaSafe/logs");

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
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-10 w-[100px]" />
              </div>
              <div className="rounded-lg border p-4 space-y-2">
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
    return <div className="text-red-500">Error loading fakka logs: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل حصالة الفكة</CardTitle>
        <CardDescription>
          عرض لجميع عمليات الكسور المالية (الفكة) التي تم تجميعها من التحويلات.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FakkaLogDataTable initialData={fakkaLogs || []} />
      </CardContent>
    </Card>
  );
}
