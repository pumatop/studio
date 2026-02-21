'use client';
import { useRtdbList } from "@/firebase";
import { UsersDataTable } from "./data-table";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  const { data: users, isLoading, error } = useRtdbList<User>("/users");

  if (error) {
    return <div className="text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <Card className="bg-transparent">
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
          <UsersDataTable initialData={users || []} />
        )}
      </CardContent>
    </Card>
  );
}
