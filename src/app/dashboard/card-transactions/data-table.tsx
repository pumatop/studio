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
import { FilterX } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';
import 'pdfmake';

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
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredData = useMemo(() => {
    return initialData.filter(item =>
      (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.cardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (item.serialNumber && item.serialNumber.includes(searchTerm)) ||
       (item.code && item.code.includes(searchTerm)) ||
       item.id.includes(searchTerm))
    );
  }, [initialData, searchTerm]);

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
      searching: false, // Use custom search
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
    });

    return () => {
      if (table && table.table().node() && document.body.contains(table.table().node())) {
        table.destroy();
      }
    };
  }, [filteredData]);

  const handleClearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm bg-transparent"
          />
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
              <TableHead>رقم المعاملة</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>نوع الكرت</TableHead>
              <TableHead>المبلغ (د.ل)</TableHead>
              <TableHead>الرقم المسلسل</TableHead>
              <TableHead>الكود</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>وقت العملية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow key={transaction.id} className="even:bg-black/5">
                <TableCell className="text-xs font-mono">{transaction.id}</TableCell>
                <TableCell>{transaction.userName}</TableCell>
                <TableCell>{transaction.cardType}</TableCell>
                <TableCell className="font-semibold">{transaction.amount.toLocaleString('en-US')} د.ل</TableCell>
                <TableCell className="font-mono">{transaction.serialNumber}</TableCell>
                <TableCell className="font-mono">{transaction.code}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transaction.status], `hover:${statusColors[transaction.status]}`)}>
                    {statusMap[transaction.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(transaction.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
