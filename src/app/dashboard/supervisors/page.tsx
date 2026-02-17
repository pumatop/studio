"use client";

import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { SupervisorsDataTable } from "./data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Supervisor } from "@/lib/types";

export default function SupervisorsPage() {
  const { data: supervisors, isLoading, error } = useRtdbList<Supervisor>("/supervisors");

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading supervisors: {error.message}</div>;
  }

  return (
    <div>
      <SupervisorsDataTable initialData={supervisors || []} />
    </div>
  );
}
