"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExchangeRateLog } from "@/lib/types";
import { ArrowDown, ArrowUp, History } from "lucide-react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { Skeleton } from "@/components/ui/skeleton";

export function ChangeLogCard() {
  const { data: allLogs, isLoading } = useRtdbList<ExchangeRateLog>('/exchangeRateLogs');

  const logs = (() => {
    if (!allLogs || allLogs.length === 0) {
      return [];
    }
    // Use the most recent log entry as the reference for "today"
    const mostRecentDate = new Date(
      Math.max(...allLogs.map(log => new Date(log.date).getTime()))
    );
    const oneWeekAgo = new Date(mostRecentDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return allLogs
      .filter(log => new Date(log.date) >= oneWeekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  const getDifference = (oldRate: number, newRate: number) => {
    return newRate - oldRate;
  };
  
  if (isLoading) {
      return (
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                </CardTitle>
                <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2 border rounded-lg p-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <span>سجل التغيرات</span>
        </CardTitle>
        <CardDescription>التغييرات التي تمت على سعر الصرف في آخر أسبوع.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">التاريخ</TableHead>
              <TableHead>المُعدِّل</TableHead>
              <TableHead className="text-center">السعر القديم</TableHead>
              <TableHead className="text-center">السعر الجديد</TableHead>
              <TableHead className="text-right">الفارق</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const difference = getDifference(log.oldRate, log.newRate);
              const isIncrease = difference > 0;
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.date).toLocaleString("ar-EG-u-nu-latn", {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{log.modifiedBy}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{log.oldRate.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-semibold">{log.newRate.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={isIncrease ? "default" : "destructive"}
                      className={`flex items-center gap-1 w-fit ml-auto ${
                        isIncrease
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {isIncrease ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span>{difference.toFixed(2)}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
