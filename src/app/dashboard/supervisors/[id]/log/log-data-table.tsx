"use client";

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
import { Eye, FilterX } from "lucide-react";
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
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


export function SupervisorLogDataTable({ initialData }: { initialData: EgyptTransferTransaction[] }) {
  const [data, setData] = useState<EgyptTransferTransaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");
  const { toast } = useToast();
  const tableRef = useRef<HTMLTableElement>(null);

  const receiptPlaceholder = PlaceHolderImages.find(p => p.id === 'receipt-placeholder');

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userPhone.includes(searchTerm) ||
          (item.recipientName && item.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.recipientNumber && item.recipientNumber.includes(searchTerm))) &&
        (statusFilter === "all" || item.status === statusFilter)
    );
  }, [data, searchTerm, statusFilter]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

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
          searching: false, // We use our custom search input
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm flex-grow"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
              <SelectValue placeholder="حالة الطلب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="completed">ناجح</SelectItem>
              <SelectItem value="failed">مرفوض</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={handleClearFilters}>
            <FilterX className="ml-2 h-4 w-4" />
            مسح الفلاتر
          </Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table ref={tableRef}>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العملية</TableHead>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>نوع التحويل</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>اسم المستلم</TableHead>
              <TableHead>رقم المستلم</TableHead>
              <TableHead>حالة الطلب</TableHead>
              <TableHead>توقيت الطلب</TableHead>
              <TableHead>مدة التنفيذ</TableHead>
              <TableHead>الإيصال</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                        لا توجد عمليات لعرضها.
                    </TableCell>
                </TableRow>
            ) : filteredData.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell className="text-xs">{transfer.id}</TableCell>
                <TableCell>
                    <div className="font-medium">{transfer.userName}</div>
                    <div className="text-muted-foreground text-xs">{transfer.userPhone}</div>
                </TableCell>
                <TableCell>{transfer.transferType}</TableCell>
                <TableCell className="text-left">
                    <div className="font-semibold">{transfer.amountEGP.toLocaleString('en-US')} ج.م</div>
                    <div className="text-xs text-muted-foreground">الرسوم: {(transfer.serviceFee || 0).toLocaleString('en-US')} ج.م</div>
                </TableCell>
                <TableCell className="font-medium">{transfer.recipientName}</TableCell>
                <TableCell>{transfer.recipientNumber}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[transfer.status], `hover:${statusColors[transfer.status]}`)}>
                    {statusMap[transfer.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(transfer.timestamp).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell>{transfer.executionDuration || '-'}</TableCell>
                <TableCell>
                  {transfer.receiptImageUrl && transfer.status === 'completed' && receiptPlaceholder ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إيصال العملية {transfer.id}</DialogTitle>
                        </DialogHeader>
                        <Image
                          src={receiptPlaceholder.imageUrl}
                          alt={`إيصال ${transfer.id}`}
                          width={600}
                          height={800}
                          className="rounded-md"
                           data-ai-hint={receiptPlaceholder.imageHint}
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
