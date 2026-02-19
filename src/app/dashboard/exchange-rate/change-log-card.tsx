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
import { ArrowDown, ArrowUp, History, FileDown, Printer } from "lucide-react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function ChangeLogCard() {
  const { data: allLogs, isLoading } = useRtdbList<ExchangeRateLog>('/exchangeRateLogs');
  const { toast } = useToast();

  const logs = useMemo(() => {
    if (!allLogs || allLogs.length === 0) {
      return [];
    }
    return [...allLogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Show last 10 changes
  }, [allLogs]);


  const getDifference = (oldRate: number, newRate: number) => {
    return newRate - oldRate;
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      if (format === 'csv') {
        exportToCsv('exchange-rate-logs.csv', logs);
      } else {
        toast({
            title: "خاصية قيد التطوير",
            description: `سيتم إضافة تصدير الملفات بصيغة ${format.toUpperCase()} قريباً.`,
        });
      }
  };

  const handlePrint = () => {
      window.print();
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
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <span>سجل التغيرات</span>
          </CardTitle>
          <CardDescription>آخر التغييرات التي تمت على أسعار الصرف.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <FileDown className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">التاريخ</TableHead>
              <TableHead>زوج العملات</TableHead>
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
                      month: '2-digit',
                      day: '2-digit',
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{log.currencyPair}</TableCell>
                  <TableCell className="font-medium">{log.modifiedBy}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{log.oldRate.toFixed(3)}</TableCell>
                  <TableCell className="text-center font-semibold">{log.newRate.toFixed(3)}</TableCell>
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
                      <span>{difference.toFixed(3)}</span>
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
