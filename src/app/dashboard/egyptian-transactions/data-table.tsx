'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Eye, FilterX, Calendar as CalendarIcon, CircleDollarSign, User,
  Phone, CalendarDays, Hash, Info, Database, ArrowRightLeft,
  Landmark, Receipt, Wallet, Save, Share2
} from 'lucide-react';
import type { EgyptTransferTransaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import 'pdfmake';

const statusColors: Record<EgyptTransferTransaction['status'], string> = {
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};
const statusMap: Record<EgyptTransferTransaction['status'], string> = {
  completed: 'ناجح',
  failed: 'مرفوض',
  pending: 'قيد التحويل',
};

export function EgyptianTransfersDataTable({ initialData }: { initialData: EgyptTransferTransaction[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | EgyptTransferTransaction['status']>('all');
  const [date, setDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
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

      return (
        (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm) ||
          item.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.recipientNumber.includes(searchTerm)) &&
        (transferTypeFilter === 'all' || item.transferType === transferTypeFilter) &&
        (statusFilter === 'all' || item.status === statusFilter)
      );
    });
  }, [initialData, searchTerm, transferTypeFilter, statusFilter, date]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) {
      return;
    }
    const table = $(tableRef.current).DataTable({
      destroy: true,
      responsive: true,
      dom: "<'flex flex-col sm:flex-row'<'w-full sm:w-1/2'l><'w-full sm:w-1/2'f>>" +
           "<'bg-transparent't>" +
           "<'flex flex-col sm:flex-row'<'w-full sm:w-1/2'i><'w-full sm:w-1/2'p>>" + 
           "<'flex justify-center mt-4'B>",
      buttons: [
          { extend: 'copy', text: '<i class=\'fas fa-copy\'></i> نسخ', className: 'btn-glass' },
          { extend: 'csv', text: '<i class=\'fas fa-file-csv\'></i> CSV', className: 'btn-glass' },
          { extend: 'excel', text: '<i class=\'fas fa-file-excel\'></i> Excel', className: 'btn-glass' },
          { extend: 'pdf', text: '<i class=\'fas fa-file-pdf\'></i> PDF', className: 'btn-glass' },
          { extend: 'print', text: '<i class=\'fas fa-print\'></i> طباعة', className: 'btn-glass' }
      ],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json',
      },
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      searching: false, // We use our custom search input
    });

    return () => {
      if (table && table.table().node() && document.body.contains(table.table().node())) {
        table.destroy();
      }
    };
  }, [filteredData]); // Re-initialize whenever filteredData changes

  const handleClearFilters = () => {
    setSearchTerm('');
    setTransferTypeFilter('all');
    setStatusFilter('all');
    setDate(undefined);
  };

  const handleSaveAsPng = () => {
    toast({
      title: 'خاصية قيد التطوير',
      description: 'سيتم إضافة إمكانية حفظ الإيصال كصورة PNG قريبًا.',
    });
  };

  const handleShare = () => {
    toast({
      title: 'خاصية قيد التطوير',
      description: 'سيتم إضافة إمكانية مشاركة الإيصال قريبًا. يمكنك حفظ الصورة ومشاركتها يدويًا.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            <Input
              placeholder="ابحث بالاسم أو الرقم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm flex-grow bg-transparent"/>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn('w-full bg-transparent sm:w-[200px] justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/y', { locale: arEG }) : <span>اختر يوماً</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="single" selected={date} onSelect={setDate} locale={arEG} formatters={{ formatDay: (day) => new Intl.NumberFormat('en-US').format(day.getDate()) }}/>
              </PopoverContent>
            </Popover>
            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px] bg-transparent"><SelectValue placeholder="نوع التحويل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
                <SelectItem value="انستاباي">انستاباي</SelectItem>
                <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px] bg-transparent"><SelectValue placeholder="حالة الطلب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="completed">ناجح</SelectItem>
                <SelectItem value="failed">مرفوض</SelectItem>
                <SelectItem value="pending">قيد التحويل</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}><FilterX className="ml-2 h-4 w-4" />مسح</Button>
          </div>
      </div>
      
      {/* Table */}
      <div className="glass-table">
        <Table ref={tableRef} className="w-full">
          <TableHeader>
            <TableRow>
                <TableHead>رقم العملية</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>نوع التحويل</TableHead>
                <TableHead>المبلغ (د.ل)</TableHead>
                <TableHead>المبلغ (ج.م)</TableHead>
                <TableHead>حالة الطلب</TableHead>
                <TableHead>توقيت الطلب</TableHead>
                <TableHead>الإيصال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transfer) => (
              <TableRow key={transfer.id} className={cn('even:bg-black/5', transfer.status === 'pending' && 'bg-yellow-500/10')}>
                <TableCell className="text-xs font-mono">{transfer.id}</TableCell>
                <TableCell>
                    <div className="font-medium">{transfer.userName}</div>
                    <div className="text-muted-foreground text-xs">{transfer.userPhone}</div>
                </TableCell>
                <TableCell>{transfer.transferType}</TableCell>
                 <TableCell className="font-semibold">
                    {transfer.amountLYD.toLocaleString('en-US')} د.ل
                </TableCell>
                <TableCell>
                    <div className="font-semibold">{transfer.amountEGP.toLocaleString('en-US')} ج.م</div>
                    <div className="text-xs text-muted-foreground">الرسوم: {(transfer.serviceFee || 0).toLocaleString('en-US')} ج.م</div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>
                    {statusMap[transfer.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transfer.timestamp).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell>
                  {transfer.status === 'completed' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent/20"><Eye className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-white/10 backdrop-blur-md border-white/30">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                              <CircleDollarSign className="h-8 w-8 text-primary" />
                              <span className="text-2xl font-bold text-primary">حولّي كاش</span>
                          </DialogTitle>
                          <DialogDescription>إيصال تحويل إلكتروني</DialogDescription>
                        </DialogHeader>
                        <div className="p-4 border rounded-lg bg-black/10" dir="rtl">
                          <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between"> <span className="font-semibold text-muted-foreground flex items-center gap-2"><Hash size={14} />رقم العملية:</span> <span className="font-mono">{transfer.id}</span></div>
                              <div className="flex justify-between"> <span className="font-semibold text-muted-foreground flex items-center gap-2"><CalendarDays size={14} />التاريخ:</span> <span>{new Date(transfer.timestamp).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
                              <div className="flex justify-between items-center"> <span className="font-semibold text-muted-foreground flex items-center gap-2"><Info size={14} />الحالة:</span> <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>{statusMap[transfer.status]}</Badge></div>
                          </div>
                          <Separator className="my-4 bg-white/20" />
                          <div className="grid grid-cols-1 gap-4 my-4 text-sm">
                              <div>
                                  <h3 className="font-bold mb-2 flex items-center gap-2"><User className="text-muted-foreground" size={16}/> من (المرسل)</h3>
                                  <p className="flex items-center gap-2"><User size={14} className="opacity-70"/> {transfer.userName}</p>
                                  <p className="text-muted-foreground flex items-center gap-2"><Phone size={14} className="opacity-70"/> {transfer.userPhone}</p>
                              </div>
                          </div>
                          <div className="border rounded-lg text-sm bg-background/50">
                            <Table><TableBody>
                                <TableRow><TableCell className="font-semibold flex items-center gap-2"><Database className="text-muted-foreground" size={14} /> المبلغ بالدينار</TableCell><TableCell className="text-left font-mono">{transfer.amountLYD.toLocaleString('en-US', {minimumFractionDigits: 2})} د.ل</TableCell></TableRow>
                                <TableRow><TableCell className="font-semibold flex items-center gap-2"><ArrowRightLeft className="text-muted-foreground" size={14} /> سعر الصرف</TableCell><TableCell className="text-left font-mono">x {transfer.exchangeRate}</TableCell></TableRow>
                                <TableRow><TableCell className="font-semibold flex items-center gap-2"><Landmark className="text-muted-foreground" size={14} /> المبلغ بالجنيه</TableCell><TableCell className="text-left font-mono">{transfer.amountEGP.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell></TableRow>
                                <TableRow><TableCell className="font-semibold flex items-center gap-2"><Receipt className="text-muted-foreground" size={14} /> رسوم الخدمة</TableCell><TableCell className="text-left font-mono">{(transfer.serviceFee || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell></TableRow>
                                <TableRow className="bg-muted/50"><TableCell className="font-bold flex items-center gap-2"><Wallet className="text-primary" size={14} /> الإجمالي المستلم</TableCell><TableCell className="text-left font-bold font-mono">{transfer.amountEGP.toLocaleString('en-US', {minimumFractionDigits: 2})} ج.م</TableCell></TableRow>
                            </TableBody></Table>
                          </div>
                          <div className="text-center text-xs text-muted-foreground mt-6">شكراً لاستخدامكم خدمات حولّي كاش</div>
                        </div>
                        <DialogFooter className="pt-4 gap-2 sm:justify-start">
                           <Button variant="outline" onClick={handleShare}><Share2 className="ml-2 h-4 w-4" />مشاركة الإيصال</Button>
                           <Button onClick={handleSaveAsPng}><Save className="ml-2 h-4 w-4" />حفظ كصورة</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : ('-')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
