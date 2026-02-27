'use client';
import dynamic from "next/dynamic";
import { useRtdbList } from "@/firebase";
import type { FakkaLog } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// استيراد ديناميكي مع تعطيل SSR لتجنب مشاكل jQuery على السيرفر
const FakkaLogDataTable = dynamic(
  () => import("./data-table").then(m => m.FakkaLogDataTable),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

export default function FakkaLogPage() {
  const { data: fakkaLogs, isLoading, error } = useRtdbList<FakkaLog>("/fakkaSafe/logs");

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل الفكة</CardTitle>
        <CardDescription>
            هنا تظهر كل عمليات الفكة التي تمت على النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (!fakkaLogs || fakkaLogs.length === 0) ? (
          <div className="space-y-4">
              <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <Skeleton className="h-10 w-[200px]" />
                  <Skeleton className="h-10 w-[100px]" />
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
              </div>
          </div>
        ) : (
          <FakkaLogDataTable initialData={fakkaLogs || []} />
        )}
      </CardContent>
    </Card>
  );
}
