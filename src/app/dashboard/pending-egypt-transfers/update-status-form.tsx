'use client';

import { useState } from 'react';
import type { EgyptTransferTransaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { useUploadFile } from '@/hooks/use-upload-file';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const updateStatusSchema = z.object({
  status: z.enum(['completed', 'failed']),
  receipt: z.any().optional(),
});

interface UpdateStatusFormProps {
  transfer: EgyptTransferTransaction;
  onSuccess: () => void;
}

export function UpdateStatusForm({ transfer, onSuccess }: UpdateStatusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile, isUploading } = useUploadFile();
  const functions = useFunctions();

  const { handleSubmit, control, register } = useForm({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: 'completed' as const,
    },
  });

  const onSubmit = async (data: z.infer<typeof updateStatusSchema>) => {
    setIsSubmitting(true);

    let receiptUrl = null;
    if (data.receipt && data.receipt.length > 0) {
      const file = data.receipt[0];
      try {
        receiptUrl = await uploadFile(file, `receipts/${transfer.id}_${Date.now()}`);
      } catch (uploadError: any) {
        toast({
          title: 'خطأ في رفع الإيصال',
          description: uploadError.message,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const updateTransferStatus = httpsCallable(functions, 'updateTransferStatus');
      await updateTransferStatus({ 
        transferId: transfer.id, 
        status: data.status, 
        receiptUrl 
      });
      
      toast({
        title: 'تم التحديث بنجاح',
        description: `تم تحديث حالة التحويل إلى ${data.status === 'completed' ? 'ناجح' : 'مرفوض'}`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'خطأ في تحديث الحالة',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="status">الحالة النهائية</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">ناجح (تم التحويل)</SelectItem>
                <SelectItem value="failed">مرفوض (فشل التحويل)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="receipt">إيصال المعاملة (اختياري)</Label>
        <Input id="receipt" type="file" {...register('receipt')} accept="image/*" />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
        {(isSubmitting || isUploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'جاري الحفظ...' : isUploading ? 'جاري رفع الإيصال...' : 'تأكيد التحديث'}
      </Button>
    </form>
  );
}
