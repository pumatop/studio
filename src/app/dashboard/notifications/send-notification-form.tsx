"use client";

import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2, BellOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreview } from './notification-preview';
import { ImageUploader } from './image-uploader';
import { NotificationTypeSelector } from './notification-type-selector';
import type { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "محتوى الإشعار مطلوب"),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal('')),
  type: z.enum(['standard', 'popup', 'banner', 'banner-ad', 'popup-ad', 'image-only'], { required_error: "نوع الإشعار مطلوب" }),
  target: z.string().min(1, "يجب تحديد المستلم"),
});

interface SendNotificationFormProps {
  users: User[];
  targetUser: User | null;
  onNotificationSent: () => void;
}

export function SendNotificationForm({ users, targetUser, onNotificationSent }: SendNotificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const functions = useFunctions();

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      imageUrl: '',
      type: 'standard',
      target: targetUser ? targetUser.id : 'all',
    },
  });

  const watchAllFields = methods.watch();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const sendNotification = httpsCallable(functions, 'sendNotification');
      await sendNotification(values);

      toast({
        title: "نجاح!",
        description: "تم إرسال الإشعار بنجاح.",
      });
      onNotificationSent();
      methods.reset();
    } catch (error: any) {
      console.error("Error sending notification: ", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال الإشعار. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>إنشاء إشعار</CardTitle>
                    <CardDescription>{targetUser ? `إرسال إشعار إلى ${targetUser.name}` : 'املأ التفاصيل أدناه لإرسال إشعار جديد.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
                        {!targetUser && (
                           <div className="space-y-2">
                                <label htmlFor="target" className="font-semibold text-sm">إرسال إلى</label>
                                <Select
                                    onValueChange={(value) => methods.setValue('target', value)}
                                    defaultValue={methods.getValues('target')}
                                >
                                    <SelectTrigger id="target">
                                        <SelectValue placeholder="اختر المستلم..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كافة المستخدمين</SelectItem>
                                        {users.map(user => {
                                            const hasToken = user.fcmToken || user.fcmTokens;
                                            return (
                                                <SelectItem key={user.id} value={user.id} disabled={!hasToken}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{user.name}</span>
                                                        {!hasToken && <BellOff className="h-4 w-4 text-muted-foreground mr-2" />}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label htmlFor="title" className="font-semibold text-sm">العنوان</label>
                            <Input id="title" {...methods.register('title')} placeholder="عنوان الإشعار" />
                            {methods.formState.errors.title && <p className="text-sm text-red-500">{methods.formState.errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="body" className="font-semibold text-sm">المحتوى</label>
                            <Textarea id="body" {...methods.register('body')} placeholder="محتوى رسالة الإشعار" />
                            {methods.formState.errors.body && <p className="text-sm text-red-500">{methods.formState.errors.body.message}</p>}
                        </div>
                        
                        <ImageUploader />

                        <NotificationTypeSelector />
                        
                        {methods.formState.errors.type && <p className="text-sm text-red-500">{methods.formState.errors.type.message}</p>}

                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'جارٍ الإرسال...' : (targetUser ? `إرسال إلى ${targetUser.name}` : 'إرسال الإشعار')}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="col-span-1 sticky top-24">
                <CardHeader>
                    <CardTitle>معاينة حية</CardTitle>
                    <CardDescription>شاهد كيف سيبدو إشعارك على الأجهزة المختلفة.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationPreview
                        title={watchAllFields.title}
                        body={watchAllFields.body}
                        imageUrl={watchAllFields.imageUrl}
                        type={watchAllFields.type as any}
                    />
                </CardContent>
            </Card>
        </div>
    </FormProvider>
  );
}
