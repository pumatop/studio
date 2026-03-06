
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
import type { FakkaLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FilterX, Calendar as CalendarIcon, PiggyBank } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { arEG } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

const months = [
    { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
    { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
    { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
    { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
];

// مكون لعرض المبالغ مع العملة جهة اليسار
const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#001F3D]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className={cn("text-[0.7em] opacity-70 font-bold", currency === "ج.م" ? "text-primary" : "text-green-600")}>{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 4 })}</span>
    </div>
);

/**
 * مكون لعرض التاريخ والوقت بنمط عربي دقيق (الوقت أولاً ثم التاريخ)
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
        <div className="flex flex-col items-start gap-0.5 tabular-nums" dir="rtl">
            <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{timePart}</span>
                <span className="text-[10px] font-black text-slate-400">{period}</span>
            </div>
            <div className="flex items-center text-[10px] text-slate-400 font-medium">
                <span>{day}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{month}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{year}</span>
            </div>
        </div>
    );
};

export function FakkaLogDataTable({ initialData }: { initialData: FakkaLog[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [tableKey, setTableKey] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter(
      (item) => {
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
        
        return (searchTerm === '' ||
          item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm));
      }
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, date, selectedMonth]);

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [filteredData]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;
    
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
          pageLength: 100,
          lengthMenu: [10, 25, 50, 100],
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
            placeholder="ابحث بالمعرف، الاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm h-11 rounded-xl bg-card border-slate-200 dark:border-white/10"
          />
          
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="inline-flex h-9 w-auto border-none bg-[#E3F2FD] dark:bg-primary/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
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
              <Button variant={"outline"} className={cn("h-11 rounded-xl justify-start text-left font-normal bg-card border-slate-200 dark:border-white/10", !date && "text-muted-foreground")}>
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "dd/MM/y", { locale: arEG }) : <span>فلتر باليوم</span>}
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

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
            <Table key={tableKey} ref={tableRef}>
                <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b dark:border-white/5 shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">رقم المعاملة الأصلية</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">اسم المستخدم</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المبلغ المقتطع</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">وقت العملية</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((log, index) => (
                    <TableRow key={`${log.id}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b dark:border-white/5 last:border-0">
                        <TableCell className="text-xs font-mono text-slate-500 font-bold">{log.transactionId}</TableCell>
                        <TableCell>
                            <div className="font-bold text-sm text-slate-700 dark:text-foreground">{log.userName}</div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">{log.userPhone}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <PiggyBank className="h-3.5 w-3.5 text-orange-500" />
                                <CurrencyDisplay amount={log.amount} currency="ج.م" colorClass="text-orange-600 text-sm" />
                            </div>
                        </TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">
                            <DateTimeDisplay timestamp={log.timestamp} />
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
