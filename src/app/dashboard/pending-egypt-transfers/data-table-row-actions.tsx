
'use client';

import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { EgyptTransferTransaction } from '@/lib/types';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { UpdateStatusForm } from './update-status-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const transfer = row.original as EgyptTransferTransaction;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setIsUpdateStatusDialogOpen(true)}>تحديث الحالة</DropdownMenuItem>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة التحويل</DialogTitle>
          </DialogHeader>
          <UpdateStatusForm 
            transfer={transfer} 
            onSuccess={() => setIsUpdateStatusDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
