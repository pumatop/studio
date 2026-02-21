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
import { FilterX, Calendar as CalendarIcon } from 'lucide-react';
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
import 'pdfmake';

export function FakkaLogDataTable({ initialData }: { initialData: FakkaLog[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>();
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
            if (itemDate < startOfDay || itemDate > endOfDay) {
                return false;
            }
        }
        
        return (searchTerm === '' ||
          item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm));
      }
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [initialData, searchTerm, date]);

  useEffect(() => {
    if (!tableRef.current) {
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
      table.destroy();
    };
  }, [filteredData]);
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث برقم المعاملة، الاسم أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm bg-transparent"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[200px] justify-start text-left font-normal bg-transparent",
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
      </div>
      <div className="glass-table">
        <Table ref={tableRef} className="w-full">
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
              <TableRow key={log.id} className="even:bg-black/5">
                <TableCell className="text-xs font-mono">{log.transactionId}</TableCell>
                <TableCell>
                  <div className="font-medium">{log.userName}</div>
                  <div className="text-muted-foreground text-xs">{log.userPhone}</div>
                </TableCell>
                <TableCell className="font-semibold">{log.amount.toFixed(4)} ج.م</TableCell>
                <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
