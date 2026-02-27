'use client';

import { useState } from 'react';
import { EgyptianTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { functions } from '@/firebase/client-provider';
import { httpsCallable } from 'firebase/functions';
import { useUploadFile } from '@/hooks/use-upload-file';
import { toast } from '@/hooks/use-toast';

const updateStatusSchema = z.object({
  status: z.enum(['completed', 'failed', 'rejected']),
  receipt: z.any().optional(),
});

interface UpdateStatusFormProps {
  transfer: EgyptianTransaction;
}

export function UpdateStatusForm({ transfer }: UpdateStatusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile, isUploading, error } = useUploadFile();

  const { handleSubmit, control, register } = useForm({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: transfer.status,
    },
  });

  const onSubmit = async (data: z.infer<typeof updateStatusSchema>) => {
    setIsSubmitting(true);

    let receiptUrl = null;
    if (data.receipt && data.receipt.length > 0) {
      const file = data.receipt[0];
      try {
        receiptUrl = await uploadFile(file, `receipts/${transfer.id}`);
      } catch (uploadError) {
        toast({
          title: 'خطأ في رفع الإيصال',
          description: (uploadError as Error).message,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
    }

    const updateTransferStatus = httpsCallable(functions, 'updateTransferStatus');

    try {
      await updateTransferStatus({ transferId: transfer.id, status: data.status, receiptUrl });
      toast({
        title: 'تم تحديث الحالة بنجاح',
        description: `تم تحديث حالة التحويل إلى ${data.status}`,
      });
    } catch (error) {
      toast({
        title: 'خطأ في تحديث الحالة',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="status">الحالة</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label htmlFor="receipt">إيصال المعاملة</Label>
        <Input id="receipt" type="file" {...register('receipt')} />
      </div>
      <Button type="submit" disabled={isSubmitting || isUploading}>
        {isSubmitting ? 'جارٍ التحديث...' : 'تحديث'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  );
}
