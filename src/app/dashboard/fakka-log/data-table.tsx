"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { FakkaLog } from "@/lib/types";
import { cn, exportToCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterX, Calendar as CalendarIcon, FileDown, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function FakkaLogDataTable({ initialData }: { initialData: FakkaLog[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return initialData.filter(
      (item) => {
        const itemDate = new Date(item.timestamp);
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            if (itemDate < startOfDay || itemDate > endOfDay) {
                return false;
            }
        }
        
        return (searchTerm === "" ||
          item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm));
      }
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, date]);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setDate(undefined);
  };
  
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      if (format === 'csv') {
        exportToCsv('fakka-log.csv', filteredData);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث برقم المعاملة، الاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "dd/MM/y", { locale: arEG }) : <span>اختر يوماً</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={arEG}
                formatters={{ formatDay: (day) => new Intl.NumberFormat('en-US').format(day.getDate()) }}
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
            <FilterX className="ml-2 h-4 w-4" />
            مسح
          </Button>
        </div>
        <div className="flex items-center gap-2 self-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
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
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم المعاملة الأصلية</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>المبلغ (ج.م)</TableHead>
              <TableHead>وقت العملية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">{log.transactionId}</TableCell>
                <TableCell>
                  <div className="font-medium">{log.userName}</div>
                  <div className="text-muted-foreground text-xs">{log.userPhone}</div>
                </TableCell>
                <TableCell className="text-left font-semibold">{log.amount.toFixed(4)} ج.م</TableCell>
                <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
