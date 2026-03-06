
"use client";

import { useRef, useEffect, useState } from "react";
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
import { ArrowDown, ArrowUp, History, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

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
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableKey, setTableKey] = useState(0);

  const getDifference = (oldRate: number, newRate: number) => {
    return newRate - oldRate;
  };
  
  const cardTitle = selectedDate ? `سجل تغييرات يوم: ${new Date(selectedDate).toLocaleDateString("ar-EG-u-nu-latn", { day: 'numeric', month: 'long' })}` : "آخر التغييرات";
  const cardDescription = selectedDate ? "عرض جميع التغييرات التي تمت على سعر الصرف في هذا اليوم." : "آخر التغييرات التي تمت على أسعار الصرف.";

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [logs]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current) || !logs || logs.length === 0) return;
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;
        $(tableRef.current).DataTable({
          responsive: true,
          order: [], // للحفاظ على ترتيب React (الأحدث أولاً)
          dom: "<'flex items-center justify-end px-4 py-2 gap-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'csv', text: 'CSV', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' }
          ],
          language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
          pageLength: 10,
          searching: false,
          pagingType: 'full_numbers',
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
          $(tableRef.current).DataTable().destroy();
      }
    };
  }, [tableKey]);

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
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-xl overflow-hidden bg-background/50">
        <Table key={tableKey} ref={tableRef}>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[150px] font-bold text-right">الوقت</TableHead>
              <TableHead className="font-bold text-right">زوج العملات</TableHead>
              <TableHead className="font-bold text-right">المُعدِّل</TableHead>
              <TableHead className="text-center font-bold">السعر القديم</TableHead>
              <TableHead className="text-center font-bold">السعر الجديد</TableHead>
              <TableHead className="text-left font-bold">الفارق</TableHead>
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
                  <TableCell className="text-xs text-right">
                    {new Date(log.date).toLocaleString("ar-EG-u-nu-latn", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-right">{log.currencyPair}</TableCell>
                  <TableCell className="font-medium text-xs text-right">{log.modifiedBy}</TableCell>
                  <TableCell className="text-center text-muted-foreground text-xs">{log.oldRate.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{log.newRate.toFixed(2)}</TableCell>
                  <TableCell className="text-left">
                    <Badge
                      variant={isIncrease ? "default" : "destructive"}
                      className={cn(
                        "flex items-center gap-1 w-fit mr-auto text-[10px] px-2 py-0",
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
