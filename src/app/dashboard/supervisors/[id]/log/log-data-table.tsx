'use client';

import React, { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, FilterX, Search, Landmark, Banknote, Truck, CalendarDays } from "lucide-react";
import type { EgyptTransferTransaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

const statusColors: Record<EgyptTransferTransaction["status"], string> = {
  "completed": "bg-green-100 text-green-800",
  "failed": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const statusMap: Record<EgyptTransferTransaction["status"], string> = {
    "completed": "ناجح",
    "failed": "مرفوض",
    "pending": "قيد التحويل",
};

const months = [
    { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
    { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
    { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
    { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
];

// مكون لعرض المبالغ مع العملة جهة اليسار
const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#1B69FF]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

export function SupervisorLogDataTable({ initialData }: { initialData: EgyptTransferTransaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString());
  const [tableKey, setTableKey] = useState(0);
  
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter(
      (item) => {
        const matchesSearch = (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm) ||
          (item.recipientName && item.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.recipientNumber && item.recipientNumber.includes(searchTerm)));
        
        const matchesStatus = (statusFilter === "all" || item.status === statusFilter);
        const matchesType = (typeFilter === "all" || item.transferType === typeFilter);
        
        const itemMonth = (new Date(item.timestamp).getMonth() + 1).toString();
        const matchesMonth = itemMonth === monthFilter;

        return matchesSearch && matchesStatus && matchesType && matchesMonth;
      }
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, statusFilter, typeFilter, monthFilter]);

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [filteredData]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;

    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;

        $(tableRef.current).DataTable({
          responsive: true,
          dom: "<'flex items-center justify-end px-4 py-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
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
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setMonthFilter((new Date().getMonth() + 1).toString());
  };

  const currentMonthVal = (new Date().getMonth() + 1).toString();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-3 w-full md:w-auto flex-1 items-center">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="بحث باسم العميل أو رقم هاتفه..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pr-10 h-11 rounded-xl bg-white border-slate-200 text-right" 
                />
            </div>
            
            <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px] h-11 rounded-xl bg-white"><SelectValue placeholder="نوع التحويل" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الأنواع</SelectItem>
                        <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
                        <SelectItem value="انستاباي">انستاباي</SelectItem>
                        <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="inline-flex h-9 w-auto border-none bg-[#E3F2FD] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[110px] h-11 rounded-xl bg-white"><SelectValue placeholder="الحالة" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="completed">ناجح</SelectItem>
                        <SelectItem value="failed">مرفوض</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-primary" onClick={handleClearFilters}>
                    <FilterX className="h-5 w-5" />
                </Button>
            </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar relative">
            <Table key={tableKey} ref={tableRef}>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">رقم العملية</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">العميل المرسل</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">نوع التحويل</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">المبلغ والرسوم</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">بيانات المستلم</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-[10px] uppercase tracking-widest text-right h-12">التوقيت</TableHead>
                        <TableHead className="text-left font-black text-[#001F3D] text-[10px] uppercase tracking-widest h-12">الإيصال</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-40 text-center text-muted-foreground font-bold italic">لا توجد عمليات مطابقة</TableCell>
                        </TableRow>
                    ) : filteredData.map((transfer, index) => (
                        <TableRow key={`${transfer.id}-${index}`} className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
                            <TableCell className="text-xs font-mono text-slate-500 font-bold">{transfer.id}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-700">{transfer.userName}</span>
                                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">{transfer.userPhone}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 border-slate-200">
                                    {transfer.transferType}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <CurrencyDisplay amount={transfer.amountEGP} currency="ج.م" colorClass="text-green-600 text-sm" />
                                    <div className="flex items-center gap-1 opacity-50">
                                        <span className="text-[9px] font-bold">الرسوم:</span>
                                        <CurrencyDisplay amount={transfer.serviceFee || 0} currency="ج.م" colorClass="text-orange-600 text-[10px]" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-700">{transfer.recipientName}</span>
                                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">{transfer.recipientNumber}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge className={cn("text-[10px] font-bold border-none shadow-none", statusColors[transfer.status])}>
                                    {statusMap[transfer.status]}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-[11px] whitespace-nowrap">
                                <DateTimeDisplay timestamp={transfer.timestamp} />
                            </TableCell>
                            <TableCell className="text-left">
                                {transfer.receiptImageUrl && transfer.status === 'completed' ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 text-[#1B69FF]">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md rounded-[2rem]">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-black text-[#001F3D]">إيصال العملية {transfer.id}</DialogTitle>
                                            </DialogHeader>
                                            <div className="relative aspect-[3/4] w-full mt-4">
                                                <Image
                                                    src={transfer.receiptImageUrl}
                                                    alt={`إيصال ${transfer.id}`}
                                                    fill
                                                    className="object-contain rounded-2xl border bg-slate-50"
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <span className="text-slate-300">---</span>
                                )}
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