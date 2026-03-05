
'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { RechargePurchaseTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FilterX, Calendar as CalendarIcon, Search, CreditCard } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

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

const months = [
    { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
    { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
    { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
    { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
];

// مكون لعرض المبالغ مع العملة جهة اليسار
const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#1A4B84]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
);

/**
 * مكون لعرض التاريخ والوقت بنمط عربي دقيق
 */
const DateTimeDisplay = ({ timestamp }: { timestamp: number | undefined }) => {
    if (!timestamp) return <span className="text-slate-300">---</span>;
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0];
    const period = date.getHours() >= 12 ? 'م' : 'ص';
    
    return (
        <div className="flex items-center justify-start gap-0.5 tabular-nums" dir="rtl">
            <span>{day}</span>
            <span className="opacity-40">/</span>
            <span>{month}</span>
            <span className="opacity-40">/</span>
            <span>{year}</span>
            <span className="mx-2"></span>
            <span className="font-bold">{timePart}</span>
            <span className="text-[10px] font-black mr-1">{period}</span>
        </div>
    );
};

export function CardTransactionsDataTable({ initialData }: { initialData: RechargePurchaseTransaction[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      const itemDate = new Date(item.timestamp);
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate < startOfDay || itemDate > endOfDay) return false;
      } else {
        const itemMonth = (itemDate.getMonth() + 1).toString();
        if (itemMonth !== selectedMonth) return false;
      }

      return (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.cardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (item.serialNumber && item.serialNumber.includes(searchTerm)) ||
       (item.code && item.code.includes(searchTerm)) ||
       item.id.includes(searchTerm));
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, date, selectedMonth]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;
    if ($.fn.DataTable.isDataTable(tableRef.current)) $(tableRef.current).DataTable().destroy();
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;
        $(tableRef.current).DataTable({
          responsive: true,
          dom: "<'flex items-center justify-end px-4 py-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'csv', text: 'CSV', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'print', text: 'PDF', autoPrint: false, exportOptions: { columns: ':visible' }, className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' }
          ],
          language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
          searching: false,
          pageLength: 10,
          lengthMenu: [10, 25, 50, 100],
          pagingType: 'full_numbers',
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) $(tableRef.current).DataTable().destroy();
    };
  }, [filteredData]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDate(undefined);
    setSelectedMonth((new Date().getMonth() + 1).toString());
  };

  const currentMonthVal = (new Date().getMonth() + 1).toString();

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث بالاسم، النوع، المسلسل أو المعرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm h-11 rounded-xl"
          />
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="inline-flex h-9 w-auto border-none bg-[#E3F2FD] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1A4B84] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl" className="rounded-2xl border-none shadow-2xl max-h-[300px]">
                    {months.map(m => (
                        <SelectItem key={m.val} value={m.val} className="rounded-xl font-bold">
                            {m.val === currentMonthVal ? `هذا الشهر (${m.label})` : m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant={'outline'} className={cn('h-11 rounded-xl justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/y', { locale: arEG }) : <span>فلتر باليوم</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="single" selected={date} onSelect={setDate} locale={arEG} />
              </PopoverContent>
            </Popover>

          <Button variant="ghost" size="icon" onClick={handleClearFilters} className="h-11 w-11 rounded-xl text-slate-400">
            <FilterX className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar relative">
            <Table ref={tableRef}>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">رقم المعاملة</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">المستخدم</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">نوع الكرت</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">المبلغ</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">الرقم المسلسل/الكود</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">وقت العملية</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((tx, index) => (
                    <TableRow key={`${tx.id}-${index}`} className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
                        <TableCell className="text-xs font-mono text-slate-500 font-bold">{tx.id}</TableCell>
                        <TableCell className="font-bold text-sm text-slate-700">{tx.userName}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-3.5 w-3.5 text-sky-500" />
                                <span className="font-bold text-xs">{tx.cardType}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <CurrencyDisplay amount={tx.amount} currency="د.ل" colorClass="text-sky-600 text-sm" />
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col text-[10px] font-mono font-bold">
                                <span className="text-slate-400">SN: {tx.serialNumber || '---'}</span>
                                <span className="text-primary tracking-tighter">Code: {tx.code || '---'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge className={cn("text-[10px] font-bold border-none", statusColors[tx.status])}>
                                {statusMap[tx.status]}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">
                            <DateTimeDisplay timestamp={tx.timestamp} />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
