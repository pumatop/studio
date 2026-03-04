
'use client';

import { useState, useMemo } from 'react';
import { useRtdbList } from '@/firebase';
import type { EgyptTransferTransaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UpdateStatusForm } from './update-status-form';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, User, Truck } from 'lucide-react';

export function PendingEgyptTransfersDataTable() {
  const { data, isLoading, error } = useRtdbList<EgyptTransferTransaction>('admin/pending_egypt_transfers');
  const [selectedTransfer, setSelectedTransfer] = useState<EgyptTransferTransaction | null>(null);

  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4 border rounded-lg bg-destructive/10">حدث خطأ: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <p className="text-muted-foreground">لا توجد حوالات معلقة حالياً.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase">رقم العملية</TableHead>
              <TableHead className="font-bold text-xs">المستخدم</TableHead>
              <TableHead className="font-bold text-xs">المبلغ (ج.م)</TableHead>
              <TableHead className="font-bold text-xs">النوع</TableHead>
              <TableHead className="font-bold text-xs">رقم المستلم</TableHead>
              <TableHead className="font-bold text-xs">اسم المستلم</TableHead>
              <TableHead className="font-bold text-xs">المندوب</TableHead>
              <TableHead className="font-bold text-xs">رسوم الخدمة</TableHead>
              <TableHead className="font-bold text-xs text-right">التاريخ</TableHead>
              <TableHead className="text-left font-bold text-xs">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((transfer) => {
              const dateObj = new Date(transfer.timestamp);
              const period = dateObj.getHours() >= 12 ? 'م' : 'ص';
              const timeOnly = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
              
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear();

              return (
                <TableRow key={transfer.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-[10px] font-bold text-slate-500">{transfer.id}</TableCell>
                  <TableCell>
                    <div className="font-bold text-xs">{transfer.userName}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">{transfer.userPhone}</div>
                  </TableCell>
                  <TableCell className="font-black text-primary whitespace-nowrap text-sm tabular-nums">
                    {transfer.amountEGP.toLocaleString('en-US')} ج.م
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap text-[10px] font-bold px-2 py-0">
                      {transfer.methodDisplayName || (transfer as any).transferType || transfer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">{transfer.recipientNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 min-w-[120px]">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs font-bold">{transfer.recipientName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 min-w-[100px]">
                      <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-bold">{(transfer as any).agentInfo || transfer.delegateName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-xs text-orange-600 tabular-nums">
                    {(transfer.serviceFee || 0).toLocaleString('en-US')} ج.م
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums text-right font-medium">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-end gap-1" dir="rtl">
                        <span className="font-bold text-slate-700">{timeOnly}</span>
                        <span className="text-[10px] opacity-70 font-black">{period}</span>
                      </div>
                      <div className="text-[10px] opacity-60 flex items-center justify-end gap-0.5" dir="rtl">
                        <span>{day}</span>
                        <span>/</span>
                        <span>{month}</span>
                        <span>/</span>
                        <span>{year}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <Button size="sm" variant="default" className="h-8 text-[11px] font-bold rounded-lg shadow-sm" onClick={() => setSelectedTransfer(transfer)}>
                      تحديث الحالة
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#1A4B84]">تحديث حالة الحوالة</DialogTitle>
            <DialogDescription className="font-bold text-xs">
              رقم العملية: <span className="font-mono text-primary">{selectedTransfer?.id}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <UpdateStatusForm 
              transfer={selectedTransfer} 
              onSuccess={() => setSelectedTransfer(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
