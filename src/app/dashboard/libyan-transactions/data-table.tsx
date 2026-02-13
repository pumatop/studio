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
import type { DetailedLibyanTransaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";

const statusColors: Record<DetailedLibyanTransaction['status'], string> = {
  "ناجحة": "bg-green-100 text-green-800",
  "مرفوضة": "bg-red-100 text-red-800",
};


export function LibyanTransactionsDataTable({ initialData }: { initialData: DetailedLibyanTransaction[] }) {
  const [data, setData] = useState<DetailedLibyanTransaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [operationTypeFilter, setOperationTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>();

  const filteredData = useMemo(() => {
    return data.filter(
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
          item.senderPhone.includes(searchTerm) ||
          item.recipientPhone?.includes(searchTerm)) &&
        (operationTypeFilter === "all" || item.operationType === operationTypeFilter) &&
        (statusFilter === "all" || item.status === statusFilter);
      }
    );
  }, [data, searchTerm, operationTypeFilter, statusFilter, date]);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setOperationTypeFilter("all");
    setStatusFilter("all");
    setDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-sm">
          <Input
            placeholder="ابحث برقم المعاملة أو رقم الهاتف..."
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
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {date ? format(date, "dd/MM/y") : <span>اختر يوماً</span>}
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
        <Select value={operationTypeFilter} onValueChange={setOperationTypeFilter}>
          <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
            <SelectValue placeholder="نوع العملية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل العمليات</SelectItem>
            <SelectItem value="تحويل داخلي">تحويل داخلي</SelectItem>
            <SelectItem value="تحويل للجنيه">تحويل للجنيه</SelectItem>
            <SelectItem value="كرت شحن">كرت شحن</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="ناجحة">ناجحة</SelectItem>
            <SelectItem value="مرفوضة">مرفوضة</SelectItem>
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
              <TableHead>نوع العملية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
              <TableHead>رقم هاتف المرسل</TableHead>
              <TableHead>المبلغ المرسل</TableHead>
              <TableHead>رسوم الخدمة</TableHead>
              <TableHead>رقم هاتف المستلم</TableHead>
              <TableHead>المبلغ المستلم</TableHead>
              <TableHead>سعر الصرف</TableHead>
              <TableHead>المبلغ المحول بالجنيه</TableHead>
              <TableHead>نوع الكارت</TableHead>
              <TableHead>فئة الكارت</TableHead>
              <TableHead>سيريال الكارت</TableHead>
              <TableHead>الرقم السري للكارت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                <TableCell>{transaction.operationType}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transaction.status], `hover:${statusColors[transaction.status]}`)}>{transaction.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transaction.timestamp).toLocaleString("ar-EG-u-nu-latn")}</TableCell>
                <TableCell className="font-medium">{transaction.senderPhone}</TableCell>
                <TableCell className="text-left">{transaction.sentAmount.toLocaleString("en-US")} د.ل</TableCell>
                <TableCell className="text-left">{transaction.serviceFee.toLocaleString("en-US")} د.ل</TableCell>
                <TableCell>{transaction.recipientPhone || "-"}</TableCell>
                <TableCell className="text-left">{transaction.receivedAmount.toLocaleString("en-US")} {transaction.operationType === 'تحويل للجنيه' ? 'ج.م' : 'د.ل'}</TableCell>
                <TableCell>{transaction.exchangeRate || "-"}</TableCell>
                <TableCell className="text-left">{transaction.convertedAmountEGP ? `${transaction.convertedAmountEGP.toLocaleString("en-US")} ج.م` : "-"}</TableCell>
                <TableCell>{transaction.cardType || "-"}</TableCell>
                <TableCell className="text-left">{transaction.cardDenomination ? `${transaction.cardDenomination.toLocaleString("en-US")} د.ل` : "-"}</TableCell>
                <TableCell>{transaction.cardSerial || "-"}</TableCell>
                <TableCell>{transaction.cardPin || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
