
"use client";

import React, { useState } from 'react';
import type { User, NotificationType } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2, BellOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationPreview } from './notification-preview';

const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "محتوى الإشعار مطلوب"),
  imageUrl: z.string().url("يجب أن يكون رابط الصورة صحيحاً").optional().or(z.literal('')),
  type: z.enum(['standard', 'popup', 'banner'], { required_error: "نوع الإشعار مطلوب" }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      imageUrl: '',
      type: 'standard',
      target: targetUser ? targetUser.id : 'all',
    },
  });

  const watchAllFields = form.watch();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const sendNotification = httpsCallable(functions, 'sendNotification');
      await sendNotification(values);

      toast({
        title: "نجاح!",
        description: "تم إرسال الإشعار بنجاح.",
      });
      if(targetUser) { 
        onNotificationSent();
      }
      form.reset({ title: '', body: '', imageUrl: '', type: 'standard', target: 'all' });
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>محتويات الإشعار</CardTitle>
                <CardDescription>املأ تفاصيل الإشعار الذي تود إرساله.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {!targetUser && (
                        <div className="space-y-2">
                            <label htmlFor="target" className="font-semibold text-sm">المستلم</label>
                            <Controller
                                control={form.control}
                                name="target"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                        <SelectTrigger id="target">
                                            <SelectValue placeholder="اختر المستلم" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">كافة المستخدمين</SelectItem>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id} disabled={!user.fcmTokens && !user.fcmToken}>
                                                  <div className="flex items-center gap-2">
                                                    {(!user.fcmTokens && !user.fcmToken) && <BellOff className="h-4 w-4 text-muted-foreground" />}
                                                    <span>{user.name}</span>
                                                  </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {form.formState.errors.target && <p className="text-sm text-red-500">{form.formState.errors.target.message}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="title" className="font-semibold text-sm">العنوان</label>
                        <Input id="title" {...form.register('title')} placeholder="عنوان الإشعار" disabled={isLoading} />
                        {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="body" className="font-semibold text-sm">المحتوى</label>
                        <Textarea id="body" {...form.register('body')} placeholder="محتوى رسالة الإشعار" disabled={isLoading}/>
                        {form.formState.errors.body && <p className="text-sm text-red-500">{form.formState.errors.body.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="imageUrl" className="font-semibold text-sm">رابط الصورة (اختياري)</label>
                        <Input id="imageUrl" {...form.register('imageUrl')} placeholder="https://example.com/image.png" disabled={isLoading}/>
                        {form.formState.errors.imageUrl && <p className="text-sm text-red-500">{form.formState.errors.imageUrl.message}</p>}
                    </div>

                     <div className="space-y-2">
                        <label htmlFor="type" className="font-semibold text-sm">نوع الإشعار</label>
                        <Controller
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="اختر نوع الإشعار" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">عادي</SelectItem>
                                        <SelectItem value="popup">نافذة منبثقة</SelectItem>
                                        <SelectItem value="banner">شريط إعلاني</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.type && <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>}
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Card className="col-span-1 sticky top-24">
            <CardHeader>
                <CardTitle>معاينة الإشعار</CardTitle>
                 <CardDescription>شاهد كيف سيبدو إشعارك على الأجهزة المختلفة.</CardDescription>
            </CardHeader>
            <CardContent>
                <NotificationPreview
                    title={watchAllFields.title}
                    body={watchAllFields.body}
                    imageUrl={watchAllFields.imageUrl}
                    type={watchAllFields.type}
                />
            </CardContent>
        </Card>
    </div>
  );
}
