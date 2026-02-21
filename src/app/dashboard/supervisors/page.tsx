'use client';

import { useRtdbList } from "@/firebase";
import { SupervisorsDataTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supervisor } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SupervisorsPage() {
  const { data: supervisors, isLoading, error } = useRtdbList<Supervisor>("/supervisors");

  if (error) {
    return <div className="text-red-500">Error loading supervisors: {error.message}</div>;
  }

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>قائمة المشرفين والمندوبين</CardTitle>
        <CardDescription>
          عرض وإدارة جميع المشرفين والمندوبين المسجلين في النظام.
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
          <SupervisorsDataTable initialData={supervisors || []} />
        )}
      </CardContent>
    </Card>
  );
}
