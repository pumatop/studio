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
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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
        receiptUrl // يتم إرسال الرابط للدالة السحابية التي ستقوم بحفظه باسم receiptImageUrl في مسار المستخدم
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-3">
        <Label htmlFor="status" className="font-black text-[10px] uppercase tracking-widest text-slate-400">الحالة النهائية للتحويل</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="h-12 rounded-xl font-bold border-slate-200">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
                <SelectItem value="completed" className="font-bold text-green-600 focus:bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>ناجح (تم التحويل بنجاح)</span>
                  </div>
                </SelectItem>
                <SelectItem value="failed" className="font-bold text-red-600 focus:bg-red-50">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <span>مرفوض (فشل التحويل - استرداد الرصيد)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="receipt" className="font-black text-[10px] uppercase tracking-widest text-slate-400">إيصال المعاملة (اختياري)</Label>
        <div className="relative">
          <Input 
            id="receipt" 
            type="file" 
            {...register('receipt')} 
            accept="image/*" 
            className="h-12 pt-3 rounded-xl border-dashed border-2 cursor-pointer hover:bg-slate-50 transition-colors"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full h-12 rounded-xl font-black text-sm bg-[#1A4B84] hover:bg-[#1A4B84]/90 shadow-lg shadow-primary/20" disabled={isSubmitting || isUploading}>
          {(isSubmitting || isUploading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'جاري الحفظ...' : isUploading ? 'جاري رفع الإيصال...' : 'تأكيد التحديث النهائي'}
        </Button>
      </div>
    </form>
  );
}
