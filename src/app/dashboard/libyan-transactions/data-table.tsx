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
import type { Transaction, AccountTransferTransaction, EgyptTransferTransaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn, exportToCsv } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX, Calendar as CalendarIcon, FileDown, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<Transaction['status'], string> = {
  "completed": "bg-green-100 text-green-800",
  "failed": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const statusMap: Record<Transaction['status'], string> = {
    "completed": "ناجحة",
    "failed": "مرفوضة",
    "pending": "قيد الانتظار"
}

const typeMap: Record<string, string> = {
    'account_transfer': 'تحويل داخلي',
    'egypt_transfer': 'تحويل للجنيه',
    'recharge_purchase': 'شراء كروت',
}

const getSenderPhone = (transaction: Transaction): string | null => {
    if (transaction.type === 'account_transfer') return transaction.senderPhone;
    if (transaction.type === 'egypt_transfer') return transaction.userPhone;
    if (transaction.type === 'recharge_purchase') return transaction.userPhone;
    return null;
}

export function LibyanTransactionsDataTable({ initialData, showExchangeRate = true }: { initialData: Transaction[], showExchangeRate?: boolean }) {
  const [data, setData] = useState<Transaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [operationTypeFilter, setOperationTypeFilter] = useState<"all" | keyof typeof typeMap>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>();
  const { toast } = useToast();

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
        
        const senderPhone = getSenderPhone(item) || '';
        const recipientPhone = (item.type === 'account_transfer' && item.recipientPhone) || '';

        return (searchTerm === "" ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          senderPhone.includes(searchTerm) ||
          recipientPhone.includes(searchTerm)) &&
        (operationTypeFilter === "all" || item.type === operationTypeFilter) &&
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
  
  const renderSentAmount = (transaction: Transaction) => {
    switch (transaction.type) {
        case 'account_transfer':
            return transaction.totalDeduction.toLocaleString("en-US") + " د.ل";
        case 'egypt_transfer':
            return transaction.amountLYD.toLocaleString("en-US") + " د.ل";
        case 'recharge_purchase':
             return transaction.amount.toLocaleString("en-US") + " د.ل";
        default:
            return '-';
    }
  }

  const renderServiceFee = (transaction: Transaction) => {
    if ('fee' in transaction && transaction.fee) {
        return transaction.fee.toLocaleString("en-US") + " د.ل";
    }
     if (transaction.type === 'recharge_purchase') {
        const fee = transaction.balanceBefore - transaction.balanceAfter - transaction.amount;
        return fee > 0 ? fee.toLocaleString("en-US") + " د.ل" : "-";
    }
    return '-';
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      if (format === 'csv') {
        exportToCsv('libyan-transactions.csv', filteredData);
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
              placeholder="ابحث برقم المعاملة أو رقم الهاتف..."
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
            <Select value={operationTypeFilter} onValueChange={(value) => setOperationTypeFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل العمليات</SelectItem>
                <SelectItem value="account_transfer">تحويل داخلي</SelectItem>
                <SelectItem value="egypt_transfer">تحويل للجنيه</SelectItem>
                 <SelectItem value="recharge_purchase">شراء كروت</SelectItem>
              </SelectContent>
            </Select>

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
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>نوع العملية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
              <TableHead>هاتف المرسل</TableHead>
              <TableHead>المبلغ المرسل</TableHead>
              <TableHead>رسوم الخدمة</TableHead>
              <TableHead>هاتف المستلم</TableHead>
              <TableHead>المبلغ المستلم</TableHead>
              {showExchangeRate && <TableHead>سعر الصرف</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => {
                const tx = transaction as AccountTransferTransaction | EgyptTransferTransaction;
              return (
              <TableRow key={tx.id}>
                <TableCell className="text-xs">{tx.id}</TableCell>
                <TableCell>{typeMap[tx.type]}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[tx.status], `hover:${statusColors[tx.status]}`)}>{statusMap[tx.status]}</Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(tx.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell className="font-medium">{getSenderPhone(tx)}</TableCell>
                <TableCell className="text-left">{renderSentAmount(tx)}</TableCell>
                <TableCell className="text-left">{renderServiceFee(tx)}</TableCell>
                <TableCell>{tx.type === 'account_transfer' ? tx.recipientPhone : "-"}</TableCell>
                <TableCell className="text-left">{tx.type === 'account_transfer' ? `${tx.amount.toLocaleString("en-US")} د.ل` : tx.type === 'egypt_transfer' ? `${tx.amountEGP.toLocaleString("en-US")} ج.م` : '-'}</TableCell>
                {showExchangeRate && <TableCell>{tx.type === 'egypt_transfer' ? tx.exchangeRate : "-"}</TableCell>}
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
