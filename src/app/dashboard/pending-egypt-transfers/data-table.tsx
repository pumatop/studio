'use client';

import { useState } from 'react';
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
  const [selectedTransfer, setSelectedUser] = useState<EgyptTransferTransaction | null>(null);

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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العملية</TableHead>
              <TableHead>المستخدم</TableHead>
              <TableHead>المبلغ (ج.م)</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>رقم المستلم</TableHead>
              <TableHead>اسم المستلم</TableHead>
              <TableHead>المندوب</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="text-left">الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell className="font-mono text-xs">{transfer.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{transfer.userName}</div>
                  <div className="text-xs text-muted-foreground">{transfer.userPhone}</div>
                </TableCell>
                <TableCell className="font-bold text-primary whitespace-nowrap">
                  {transfer.amountEGP.toLocaleString('en-US')} ج.م
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="whitespace-nowrap">
                    {transfer.methodDisplayName || (transfer as any).transferType || transfer.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{transfer.recipientNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 min-w-[120px]">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{transfer.recipientName || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 min-w-[100px]">
                    <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs">{(transfer as any).agentInfo || transfer.delegateName || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums">
                  {new Date(transfer.timestamp).toLocaleString("ar-EG-u-nu-latn", {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </TableCell>
                <TableCell className="text-left">
                  <Button size="sm" onClick={() => setSelectedUser(transfer)}>
                    تحديث الحالة
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الحوالة</DialogTitle>
            <DialogDescription>
              رقم العملية: {selectedTransfer?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <UpdateStatusForm 
              transfer={selectedTransfer} 
              onSuccess={() => setSelectedUser(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
