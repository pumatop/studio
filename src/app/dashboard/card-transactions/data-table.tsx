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
import type { RechargePurchaseTransaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";

const statusColors: Record<RechargePurchaseTransaction['status'], string> = {
  "completed": "bg-green-100 text-green-800",
  "failed": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const statusMap: Record<RechargePurchaseTransaction['status'], string> = {
    "completed": "ناجحة",
    "failed": "مرفوضة",
    "pending": "قيد الانتظار"
}

export function CardTransactionsDataTable({ initialData }: { initialData: RechargePurchaseTransaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>();

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
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm)) &&
        (statusFilter === "all" || item.status === statusFilter);
      }
    );
  }, [initialData, searchTerm, statusFilter, date]);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDate(undefined);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-sm">
          <Input
            placeholder="ابحث برقم المعاملة، الاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full sm:w-[260px] justify-start text-left font-normal",
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="completed">ناجحة</SelectItem>
            <SelectItem value="failed">مرفوضة</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
          <FilterX className="ml-2 h-4 w-4" />
          مسح الفلاتر
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>نوع الكرت</TableHead>
              <TableHead>المبلغ (د.ل)</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-xs">{transaction.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{transaction.userName}</div>
                  <div className="text-muted-foreground text-xs">{transaction.userPhone}</div>
                </TableCell>
                <TableCell>{transaction.cardType}</TableCell>
                <TableCell className="text-left font-semibold">{transaction.amount.toLocaleString("en-US")} د.ل</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transaction.status], `hover:${statusColors[transaction.status]}`)}>{statusMap[transaction.status]}</Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transaction.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
