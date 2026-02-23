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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Mail, Users, Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Define schema here as it's now shared
const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "محتوى الإشعار مطلوب"),
  imageUrl: z.string().url("رابط الصورة غير صحيح").optional().or(z.literal('')),
  type: z.enum(['standard', 'popup', 'banner', 'banner-ad', 'popup-ad', 'image-only'], { required_error: "نوع الإشعار مطلوب" }),
  target: z.string().min(1, "يجب تحديد المستلم"),
});

export default function NotificationsPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
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
            target: 'all',
        },
    });

    const watchAllFields = methods.watch();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const sendNotification = httpsCallable(functions, 'sendNotification');
            await sendNotification(values);

            toast({
                title: "نجاح!",
                description: "تم إرسال الإشعار بنجاح.",
            });
            // Reset fields but keep target/type
            methods.reset({ ...methods.getValues(), title: '', body: '', imageUrl: '' }); 
            if (isDialogOpen) {
                setDialogOpen(false);
                 // After dialog closes, reset form to 'all'
                setSelectedUser(null);
                methods.reset({
                    title: '', body: '', imageUrl: '', type: 'standard', target: 'all',
                });
            }
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
    
    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        methods.reset({
            title: '',
            body: '',
            imageUrl: '',
            type: 'standard',
            target: user.id,
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
        methods.reset({ // Reset to default 'all' target when dialog closes
            title: '', body: '', imageUrl: '', type: 'standard', target: 'all',
        });
    }

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
                title: "نجاح!",
                description: "تم حذف جميع الإشعارات بنجاح.",
                variant: "destructive"
            });

        } catch (error: any) {
            console.error("Error deleting all notifications: ", error);
            toast({
                title: "خطأ",
                description: error.message || "فشل حذف جميع الإشعارات.",
                variant: "destructive",
            });
        } finally {
            setIsDeletingAll(false);
            setDeleteAllDialogOpen(false);
        }
    };

    const isLoadingData = usersLoading || notificationsLoading;
    const canDeleteAll = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');

    const allNotifications = useMemo(() => {
        const combinedNotifs: Notification[] = [];
        if (globalNotifications) {
            combinedNotifs.push(...globalNotifications);
        }
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Column 1: Form & User Selection */}
                <div className="space-y-6">
                     <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                               <Mail className="h-6 w-6 text-primary" />
                               محتوى الإشعار
                            </CardTitle>
                            <CardDescription>
                                أدخل تفاصيل الإشعار هنا. لإرسال إشعار مخصص، اختر مستخدماً من القائمة.
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                             <SendNotificationForm />
                         </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                إرسال لمستخدم محدد
                            </CardTitle>
                             <CardDescription>
                                اضغط على مستخدم لفتح نافذة إرسال إشعار مخصص له.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoadingData && !users ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                             ) : (
                                <UserSelection users={users || []} onUserSelect={handleUserSelect} />
                             )}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: Preview */}
                <div className="lg:col-span-1">
                     <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>المعاينة والإعدادات</CardTitle>
                            <CardDescription>شاهد كيف سيبدو إشعارك واختر نوعه أدناه.</CardDescription>
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
            </div>
            
             {/* Full Width Submit and History */}
             <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={methods.handleSubmit(onSubmit)} disabled={isSubmitting || (canDeleteAll && isDeletingAll)} size="lg" className="w-full">
                        {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Mail className="ml-2 h-4 w-4" />}
                        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الإشعار للجميع'}
                    </Button>
                    {canDeleteAll && (
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteAllDialogOpen(true)}
                            size="lg"
                            className="w-full"
                            disabled={isSubmitting || isDeletingAll}
                        >
                            {isDeletingAll ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />}
                            {isDeletingAll ? 'جاري الحذف...' : 'حذف جميع الإشعارات'}
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>سجل الإشعارات المرسلة</CardTitle>
                        <CardDescription>عرض لجميع الإشعارات التي تم إرسالها من خلال النظام.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingData && allNotifications.length === 0 ? (
                             <Skeleton className="h-48 w-full" />
                        ) : (
                             <NotificationsHistoryTable notifications={allNotifications} users={users || []} />
                        )}
                    </CardContent>
                </Card>
            </div>
            
             {/* Dialog for specific user */}
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>إرسال إشعار إلى: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            هذا الإشعار سيصل إلى {selectedUser?.phone} فقط.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Form part */}
                        <div className="space-y-6">
                            <SendNotificationForm />
                            <Button onClick={methods.handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'جارٍ الإرسال...' : `إرسال إلى ${selectedUser?.name}`}
                            </Button>
                        </div>
                        {/* Preview part */}
                        <div>
                             <Card className="sticky top-10">
                                <CardHeader>
                                    <CardTitle>المعاينة والإعدادات</CardTitle>
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
                    </div>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هذا الإجراء سيقوم بحذف **جميع** الإشعارات المرسلة بشكل نهائي من النظام، سواء كانت عامة أو خاصة. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAllNotifications}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            disabled={isDeletingAll}
                        >
                            {isDeletingAll ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                            {isDeletingAll ? 'جاري الحذف...' : 'نعم، حذف الكل'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </FormProvider>
    );
}
