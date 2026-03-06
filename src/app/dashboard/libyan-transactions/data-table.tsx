
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
import type { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterX, Calendar as CalendarIcon, Truck, Banknote, PiggyBank } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  'completed': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
  'pending': 'bg-yellow-100 text-yellow-800',
};

const statusMap: Record<string, string> = {
    'completed': 'ناجحة',
    'failed': 'مرفوضة',
    'pending': 'قيد الانتظار'
}

const typeMap: Record<string, string> = {
    'account_transfer': 'تحويل داخلي',
    'egypt_transfer': 'تحويل للجنيه',
    'recharge_purchase': 'شراء كروت',
    'egypt_home': 'وصلي للبيت',
    'egypt_wallets': 'محفظة كاش',
    'egypt_instapay': 'انستاباي',
}

const months = [
    { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
    { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
    { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
    { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
];

const getSenderPhone = (transaction: Transaction): string | null => {
    const tx = transaction as any;
    if (tx.type === 'account_transfer') return tx.senderPhone;
    if (tx.type === 'egypt_transfer') return tx.userPhone;
    if (tx.type === 'recharge_purchase') return tx.userPhone;
    if (['egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(tx.type)) return tx.userPhone;
    return null;
}

const CurrencyDisplay = ({ 
    amount, 
    currency, 
    colorClass = "text-[#001F3D]", 
    decimals = 2 
}: { 
    amount: number, 
    currency: string, 
    colorClass?: string,
    decimals?: number
}) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
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
                <span className="font-bold text-slate-700">{timePart}</span>
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

export function LibyanTransactionsDataTable({ 
  initialData, 
  showExchangeRate = true,
  showDelegate = true,
  showFee = false,
  showReceivedAmount = true,
  showTypeFilter = false
}: { 
  initialData: Transaction[], 
  showExchangeRate?: boolean,
  showDelegate?: boolean,
  showFee?: boolean,
  showReceivedAmount?: boolean,
  showTypeFilter?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [date, setDate] = useState<Date | undefined>();
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [tableKey, setTableKey] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter(
      (item) => {
        const tx = item as any;
        const itemDate = new Date(tx.timestamp);
        
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
        
        const senderPhone = getSenderPhone(item) || '';
        const recipientPhone = (tx.type === 'account_transfer' && tx.recipientPhone) || 
                               (['egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(tx.type) && tx.recipientNumber) || '';
        const recipientName = tx.recipientName || '';
        const agentInfo = tx.agentInfo || tx.delegateName || '';

        return (searchTerm === '' ||
          tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          senderPhone.includes(searchTerm) ||
          recipientPhone.includes(searchTerm) ||
          recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agentInfo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || tx.status === statusFilter) &&
        (typeFilter === 'all' || tx.type === typeFilter);
      }
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, statusFilter, typeFilter, date, selectedMonth]);

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [filteredData]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;
        $(tableRef.current).DataTable({
          responsive: true,
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
    setStatusFilter('all');
    setTypeFilter('all');
    setDate(undefined);
    setSelectedMonth((new Date().getMonth() + 1).toString());
  };

  const currentMonthVal = (new Date().getMonth() + 1).toString();

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            <Input
              placeholder="ابحث بالمعرف، الهاتف، الاسم أو المندوب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm h-11 rounded-xl"
            />
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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

            {showTypeFilter && (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-11 rounded-xl bg-white"><SelectValue placeholder="نوع العملية" /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {Object.entries(typeMap).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] h-11 rounded-xl"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="completed">ناجحة</SelectItem>
                <SelectItem value="failed">مرفوضة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={handleClearFilters} className="h-11 w-11 rounded-xl text-slate-400">
              <FilterX className="h-5 w-5" />
            </Button>
          </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar relative">
            <Table key={tableKey} ref={tableRef}>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">رقم العملية</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">النوع</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">التوقيت</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المرسل</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المبلغ المرسل</TableHead>
                        <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المستلم</TableHead>
                        {showReceivedAmount && <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المبلغ المستلم</TableHead>}
                        {showFee && <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">رسوم الخدمة</TableHead>}
                        {showDelegate && <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المندوب</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((tx: any, index) => {
                        const isEgyptLocal = ['egypt_home', 'egypt_wallets', 'egypt_instapay', 'egypt_transfer'].includes(tx.type);
                        const currency = isEgyptLocal ? "ج.م" : "د.ل";
                        return (
                            <TableRow key={`${tx.id}-${index}`} className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
                                <TableCell className="text-xs font-mono text-slate-500 font-bold">{tx.id}</TableCell>
                                <TableCell className="text-xs font-bold">{typeMap[tx.type] || tx.type}</TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("text-[10px] font-bold border-none", statusColors[tx.status])}>
                                        {statusMap[tx.status] || tx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-[11px] whitespace-nowrap">
                                    <DateTimeDisplay timestamp={tx.timestamp} />
                                </TableCell>
                                <TableCell className="text-[11px]">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-slate-700">{tx.senderName || tx.userName || '-'}</div>
                                        <div className="text-slate-400 font-mono tabular-nums">{getSenderPhone(tx)}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <CurrencyDisplay 
                                            amount={tx.type === 'account_transfer' ? (tx.totalDeduction || 0) : (tx.amount || tx.amountLYD || tx.amountEGP || 0)} 
                                            currency={currency}
                                            colorClass={isEgyptLocal ? "text-primary" : "text-green-600"}
                                            decimals={isEgyptLocal ? 0 : 2}
                                        />
                                        {isEgyptLocal && tx.fakkaAmount > 0 && (
                                            <div className="flex items-center gap-1 opacity-60">
                                                <PiggyBank className="h-2.5 w-2.5 text-orange-500" />
                                                <CurrencyDisplay amount={tx.fakkaAmount} currency="ج.م" colorClass="text-orange-600 text-[9px]" decimals={2} />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px]">
                                    {isEgyptLocal ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 tabular-nums">{tx.recipientNumber || '-'}</span>
                                            {tx.recipientName && (
                                                <span className="text-[10px] text-slate-400 font-bold">{tx.recipientName}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <div className="font-bold text-slate-700">{tx.recipientName || tx.userName || '-'}</div>
                                            <div className="text-slate-400 font-mono tabular-nums">
                                                {tx.type === 'account_transfer' ? tx.recipientPhone : (tx.recipientNumber || tx.userPhone || '-')}
                                            </div>
                                        </div>
                                    )}
                                </TableCell>
                                {showReceivedAmount && (
                                    <TableCell>
                                        <CurrencyDisplay 
                                            amount={tx.type === 'account_transfer' ? (tx.amount || 0) : (tx.amountEGP || 0)} 
                                            currency={tx.type === 'account_transfer' ? "د.ل" : "ج.م"}
                                            decimals={tx.type === 'account_transfer' ? 2 : 0}
                                        />
                                    </TableCell>
                                )}
                                {showFee && (
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Banknote className="h-3 w-3 text-orange-500 opacity-40" />
                                            <CurrencyDisplay 
                                                amount={tx.fee || tx.serviceFee || 0} 
                                                currency={currency}
                                                colorClass="text-orange-600 text-xs"
                                                decimals={isEgyptLocal ? 0 : 2}
                                            />
                                        </div>
                                    </TableCell>
                                )}
                                {showDelegate && (
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <Truck className="h-3 w-3 opacity-40" />
                                            <span>{tx.agentInfo || tx.delegateName || '-'}</span>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
