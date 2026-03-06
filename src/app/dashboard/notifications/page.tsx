
'use client';

import { useState, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User, Notification } from "@/lib/types";
import { useUser, useRtdbList, useRtdbObject, useDatabase, updateRtdb, useFunctions } from "@/firebase";
import { httpsCallable } from 'firebase/functions';
import { useToast } from "@/hooks/use-toast";
import { SendNotificationForm } from "./send-notification-form";
import { NotificationsHistoryTable } from "./notifications-history-table";
import { UserSelection } from "./user-selection";
import { NotificationPreview } from './notification-preview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Mail, Users, Loader2, Trash2, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define schema
const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "محتوى الإشعار مطلوب"),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal('')),
  type: z.enum(['standard', 'popup', 'banner', 'banner-ad', 'popup-ad', 'image-only'], { required_error: "نوع الإشعار مطلوب" }),
});

export default function NotificationsPage() {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const { toast } = useToast();
    const functions = useFunctions();
    const { database } = useDatabase();

    const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");
    const { data: globalNotifications, isLoading: notificationsLoading } = useRtdbList<Notification>("/notifications");

    const { user: authUser } = useUser();
    const { data: currentUser } = useRtdbObject<User>(authUser ? `/users/${authUser.uid}` : null);

    const methods = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            body: '',
            imageUrl: '',
            type: 'standard',
        },
    });

    const watchAllFields = methods.watch();

    const handleToggleUser = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleToggleAll = () => {
        if (users && selectedUserIds.length === users.length) {
            setSelectedUserIds([]);
        } else if (users) {
            setSelectedUserIds(users.map(u => u.id));
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const sendNotification = httpsCallable(functions, 'sendNotification');
            
            const finalTargets = selectedUserIds.length > 0 ? selectedUserIds : ['all'];
            
            if (finalTargets.length === 1 && finalTargets[0] === 'all') {
                await sendNotification({ ...values, target: 'all' });
            } else {
                await Promise.all(finalTargets.map(id => sendNotification({ ...values, target: id })));
            }

            toast({
                title: "تم الإرسال بنجاح!",
                description: `تم إرسال الإشعار إلى ${finalTargets.length === 1 && finalTargets[0] === 'all' ? 'جميع المستخدمين' : `${finalTargets.length} مستخدم`}.`,
            });
            
            methods.reset({ ...methods.getValues(), title: '', body: '', imageUrl: '' }); 
            setSelectedUserIds([]);
        } catch (error: any) {
            console.error("Error sending notification: ", error);
            toast({
                title: "خطأ",
                description: error.message || "فشل إرسال الإشعار. يرجى المحاولة مرة أخرى.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAllNotifications = async () => {
        setIsDeletingAll(true);
        try {
            const updates: Record<string, null> = {};
            updates['/notifications'] = null;
            if (users) {
                users.forEach(user => {
                    updates[`/users/${user.id}/notifications`] = null;
                });
            }
            await updateRtdb(database, '/', updates);
            toast({
                title: "تم الحذف بنجاح",
                description: "تم مسح كافة سجلات الإشعارات من النظام.",
                variant: "destructive"
            });
        } catch (error: any) {
            console.error("Error deleting all notifications: ", error);
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        } finally {
            setIsDeletingAll(false);
            setDeleteAllDialogOpen(false);
        }
    };

    const isLoadingData = usersLoading || notificationsLoading;
    const canDeleteAll = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');

    const allNotifications = useMemo(() => {
        const combinedNotifs: Notification[] = [];
        if (globalNotifications) combinedNotifs.push(...globalNotifications);
        if (users) {
            users.forEach(user => {
                if (user.notifications) {
                    const userNotifications = Object.entries(user.notifications).map(([id, notif]) => ({
                        ...(notif as object),
                        id,
                    })) as Notification[];
                    combinedNotifs.push(...userNotifications);
                }
            });
        }
        return combinedNotifs.sort((a, b) => b.createdAt - a.createdAt);
    }, [users, globalNotifications]);

    return (
        <FormProvider {...methods}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pb-10" dir="rtl">
                <div className="space-y-8">
                     <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                         <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl"><Mail className="h-6 w-6 text-primary" /></div>
                            <div>
                                <CardTitle className="text-xl font-black text-[#001F3D] dark:text-foreground">محتوى الإشعار</CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400">أدخل تفاصيل الرسالة التي سيتم إرسالها.</CardDescription>
                            </div>
                        </CardHeader>
                         <CardContent className="p-8">
                             <SendNotificationForm />
                         </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl"><Users className="h-6 w-6 text-orange-600" /></div>
                            <div>
                                <CardTitle className="text-xl font-black text-[#001F3D] dark:text-foreground">المستلمون</CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400">حدد المستخدمين المستهدفين أو اترك فارغاً للإرسال للكل.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                             {usersLoading && !users ? (
                                <div className="space-y-2 p-4">
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                </div>
                             ) : (
                                <UserSelection 
                                    users={users || []} 
                                    selectedUserIds={selectedUserIds}
                                    onToggleUser={handleToggleUser}
                                    onToggleAll={handleToggleAll}
                                />
                             )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                     <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden sticky top-24">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6">
                            <CardTitle className="text-xl font-black text-[#001F3D] dark:text-foreground">معاينة حية</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400">شاهد كيف سيظهر الإشعار على هواتف المستخدمين.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <NotificationPreview
                                title={watchAllFields.title}
                                body={watchAllFields.body}
                                imageUrl={watchAllFields.imageUrl}
                                type={watchAllFields.type as any}
                            />
                        </CardContent>
                        <CardFooter className="p-8 bg-slate-50/30 dark:bg-slate-900/10 border-t dark:border-white/5 flex flex-col gap-4">
                            <Button 
                                onClick={methods.handleSubmit(onSubmit)} 
                                disabled={isSubmitting} 
                                size="lg" 
                                className="w-full rounded-[1.5rem] h-14 font-black text-lg bg-[#1B69FF] hover:bg-[#1B69FF]/90 shadow-xl shadow-primary/20 gap-3"
                            >
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                                {isSubmitting ? 'جاري الإرسال والمعالجة...' : 
                                 selectedUserIds.length > 0 ? `إرسال إلى ${selectedUserIds.length} مستخدم` : 'إرسال لجميع المستخدمين'}
                            </Button>
                            
                            {canDeleteAll && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setDeleteAllDialogOpen(true)}
                                    disabled={isSubmitting || isDeletingAll}
                                    className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold text-xs"
                                >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف كافة سجلات الإشعارات المرسلة
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
            
             <div className="space-y-8 mt-8">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-8">
                        <CardTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground">سجل الإشعارات المرسلة</CardTitle>
                        <CardDescription className="text-sm font-bold text-slate-400 mt-1">تاريخ العمليات السابقة وحالات الإرسال.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        {isLoadingData && allNotifications.length === 0 ? (
                             <Skeleton className="h-64 w-full rounded-3xl" />
                        ) : (
                             <NotificationsHistoryTable notifications={allNotifications} users={users || []} />
                        )}
                    </CardContent>
                </Card>
            </div>

             <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 bg-card" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground">هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                            سيتم حذف كافة سجلات الإشعارات المرسلة نهائياً من النظام. لن يؤثر هذا على الإشعارات التي وصلت بالفعل لهواتف المستخدمين.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 pt-6 flex flex-col sm:flex-row">
                        <AlertDialogCancel className="rounded-xl font-bold border-slate-200 dark:border-white/10 flex-1 h-12">إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAllNotifications}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm px-8 flex-1 h-12"
                            disabled={isDeletingAll}
                        >
                            {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : 'نعم، احذف السجل'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </FormProvider>
    );
}
