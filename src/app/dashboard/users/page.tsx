"use client";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { UsersDataTable } from "./data-table";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const { data: users, isLoading, error } = useRtdbList<User>("/users");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <div>
      <UsersDataTable initialData={users || []} />
    </div>
  );
}
