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
import { FilterX, Calendar as CalendarIcon, User, Truck } from 'lucide-react';
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

const getSenderPhone = (transaction: Transaction): string | null => {
    const tx = transaction as any;
    if (tx.type === 'account_transfer') return tx.senderPhone;
    if (tx.type === 'egypt_transfer') return tx.userPhone;
    if (tx.type === 'recharge_purchase') return tx.userPhone;
    if (['egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(tx.type)) return tx.userPhone;
    return null;
}

export function LibyanTransactionsDataTable({ initialData, showExchangeRate = true }: { initialData: Transaction[], showExchangeRate?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [operationTypeFilter, setOperationTypeFilter] = useState<'all' | keyof typeof typeMap>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [date, setDate] = useState<Date | undefined>();
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
            if (itemDate < startOfDay || itemDate > endOfDay) {
                return false;
            }
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
        (operationTypeFilter === 'all' || tx.type === operationTypeFilter) &&
        (statusFilter === 'all' || tx.status === statusFilter);
      }
    );
  }, [initialData, searchTerm, operationTypeFilter, statusFilter, date]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) {
      return;
    }

    if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
    }
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) {
          return;
        }
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
          language: {
            url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json',
          },
          pageLength: 10,
          lengthMenu: [10, 25, 50, 100],
          searching: false,
          pagingType: 'full_numbers',
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, [filteredData]);
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setOperationTypeFilter('all');
    setStatusFilter('all');
    setDate(undefined);
  };
  
  const renderSentAmount = (transaction: Transaction) => {
    const tx = transaction as any;
    switch (tx.type) {
        case 'account_transfer':
            return (tx.totalDeduction || 0).toLocaleString('en-US') + ' د.ل';
        case 'egypt_transfer':
            return (tx.amountLYD || 0).toLocaleString('en-US') + ' د.ل';
        case 'recharge_purchase':
             return (tx.amount || 0).toLocaleString('en-US') + ' د.ل';
        case 'egypt_home':
        case 'egypt_wallets':
        case 'egypt_instapay':
             return (tx.totalDeduction || 0).toLocaleString('en-US') + ' ج.م';
        default:
            return '-';
    }
  }

  const renderServiceFee = (transaction: Transaction) => {
    const tx = transaction as any;
    const isEgp = ['egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(tx.type);
    const currency = isEgp ? ' ج.م' : ' د.ل';

    if (typeof tx.serviceFee === 'number') {
        return tx.serviceFee.toLocaleString('en-US') + currency;
    }
    if (typeof tx.fee === 'number') {
        return tx.fee.toLocaleString('en-US') + currency;
    }
     if (tx.type === 'recharge_purchase') {
        const fee = (tx.balanceBefore || 0) - (tx.balanceAfter || 0) - (tx.amount || 0);
        return fee > 0 ? fee.toLocaleString('en-US') + ' د.ل' : '-';
    }
    return '-';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            <Input
              placeholder="ابحث برقم المعاملة، الهاتف، الاسم أو المندوب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-[200px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/y', { locale: arEG }) : <span>اختر يوماً</span>}
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
                <SelectItem value="egypt_home">وصلي للبيت</SelectItem>
                <SelectItem value="egypt_wallets">محفظة كاش</SelectItem>
                <SelectItem value="egypt_instapay">انستاباي</SelectItem>
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
      </div>
      <div className="rounded-lg border">
        <Table ref={tableRef} className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>نوع العملية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
              <TableHead>هاتف المرسل</TableHead>
              <TableHead>المبلغ المرسل</TableHead>
              <TableHead>رسوم الخدمة</TableHead>
              <TableHead>اسم المستلم</TableHead>
              <TableHead>هاتف المستلم</TableHead>
              <TableHead>المبلغ المستلم</TableHead>
              <TableHead>المندوب/الوكيل</TableHead>
              {showExchangeRate && <TableHead>سعر الصرف</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction, index) => {
                const tx = transaction as any;
                const agentName = tx.agentInfo || tx.delegateName || '-';
                const recipientName = tx.recipientName || tx.userName || '-';
              return (
              <TableRow key={`${tx.id}-${index}`} className="even:bg-muted/20">
                <TableCell className="text-xs font-mono">{tx.id}</TableCell>
                <TableCell>{typeMap[tx.type] || tx.type}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[tx.status] || 'bg-gray-100', `hover:${statusColors[tx.status]}`)}>
                    {statusMap[tx.status] || tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(tx.timestamp).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell className="font-medium">{getSenderPhone(tx)}</TableCell>
                <TableCell>{renderSentAmount(tx)}</TableCell>
                <TableCell>{renderServiceFee(tx)}</TableCell>
                <TableCell>{recipientName}</TableCell>
                <TableCell>
                    {tx.type === 'account_transfer' ? tx.recipientPhone : 
                     ['egypt_home', 'egypt_wallets', 'egypt_instapay', 'egypt_transfer'].includes(tx.type) ? tx.recipientNumber || tx.userPhone : 
                     '-'}
                </TableCell>
                <TableCell>
                    {tx.type === 'account_transfer' ? `${(tx.amount || 0).toLocaleString('en-US')} د.ل` : 
                     ['egypt_transfer', 'egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(tx.type) ? `${(tx.amountEGP || 0).toLocaleString('en-US')} ج.م` : 
                     '-'}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                        {agentName !== '-' && <Truck className="h-3 w-3 text-muted-foreground" />}
                        <span>{agentName}</span>
                    </div>
                </TableCell>
                {showExchangeRate && <TableCell>{tx.type === 'egypt_transfer' ? tx.exchangeRate?.toFixed(2) || '-' : '-'}</TableCell>}
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
