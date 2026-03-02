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
import { ArrowDown, ArrowUp, History, FileDown, Printer, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const floatingCardClass = "bg-card shadow-xl border-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl";

export function ChangeLogCard({ 
    logs, 
    isLoading,
    selectedDate,
    onClearSelection,
}: { 
    logs?: ExchangeRateLog[], 
    isLoading?: boolean,
    selectedDate: string | null,
    onClearSelection: () => void,
}) {
  const { toast } = useToast();

  const getDifference = (oldRate: number, newRate: number) => {
    return newRate - oldRate;
  };
  
  const cardTitle = selectedDate ? `سجل تغييرات يوم: ${new Date(selectedDate).toLocaleDateString("ar-EG-u-nu-latn", { day: 'numeric', month: 'long' })}` : "آخر 10 تغييرات";
  const cardDescription = selectedDate ? "عرض جميع التغييرات التي تمت على سعر الصرف في هذا اليوم." : "آخر التغييرات التي تمت على أسعار الصرف.";

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      if (!logs || logs.length === 0) {
        toast({ title: "لا توجد بيانات للتصدير", variant: "destructive" });
        return;
      }
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
          <Card className={cn(floatingCardClass, "hover:translate-y-0")}>
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
    <Card className={floatingCardClass}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span>{cardTitle}</span>
          </CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            {selectedDate && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onClearSelection}>
                    <XCircle className="h-5 w-5" />
                    <span className="sr-only">Clear selection</span>
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-card border-black/10">
                        <FileDown className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="bg-card border-black/10" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl overflow-hidden bg-background/50">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[150px] font-bold">الوقت</TableHead>
              <TableHead className="font-bold">زوج العملات</TableHead>
              <TableHead className="font-bold">المُعدِّل</TableHead>
              <TableHead className="text-center font-bold">السعر القديم</TableHead>
              <TableHead className="text-center font-bold">السعر الجديد</TableHead>
              <TableHead className="text-right font-bold">الفارق</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!logs || logs.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        لا توجد سجلات لعرضها.
                    </TableCell>
                </TableRow>
            ) : logs.map((log) => {
              const difference = getDifference(log.oldRate, log.newRate);
              const isIncrease = difference > 0;
              return (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors tabular-nums">
                  <TableCell className="text-xs">
                    {new Date(log.date).toLocaleString("ar-EG-u-nu-latn", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-xs">{log.currencyPair}</TableCell>
                  <TableCell className="font-medium text-xs">{log.modifiedBy}</TableCell>
                  <TableCell className="text-center text-muted-foreground text-xs">{log.oldRate.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{log.newRate.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={isIncrease ? "default" : "destructive"}
                      className={cn(
                        "flex items-center gap-1 w-fit ml-auto text-[10px] px-2 py-0",
                        isIncrease
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {isIncrease ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(difference).toFixed(2)}</span>
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
