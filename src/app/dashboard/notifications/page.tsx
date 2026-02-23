"use client";

import { useState, useMemo } from "react";
import type { User, Notification } from "@/lib/types";
import { useRtdbList, useFunctions } from "@/firebase";
import { SendNotificationForm } from "./send-notification-form";
import { NotificationsHistoryTable } from "./notifications-history-table";
import { UserSelection } from "./user-selection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);

    const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");
    const { data: globalNotifications, isLoading: notificationsLoading } = useRtdbList<Notification>("/notifications");
    const functions = useFunctions();

    const subscribedUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => user.notificationSettings?.isSubscribed === true);
    }, [users]);

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


    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const isLoading = usersLoading || notificationsLoading;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Mail className="h-6 w-6 text-primary" />
                           إرسال إشعار عام
                        </CardTitle>
                        <CardDescription>
                            سيتم إرسال هذا الإشعار إلى جميع المستخدمين. لإرسال إشعار مخصص، اختر مستخدماً من القائمة الجانبية.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SendNotificationForm
                            targetUser={null} // For sending to all
                            onNotificationSent={() => {}}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>سجل الإشعارات المرسلة</CardTitle>
                        <CardDescription>عرض لجميع الإشعارات التي تم إرسالها من خلال النظام.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && allNotifications.length === 0 ? (
                             <Skeleton className="h-48 w-full" />
                        ) : (
                             <NotificationsHistoryTable notifications={allNotifications} users={users || []} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            إرسال لمستخدم محدد
                        </CardTitle>
                         <CardDescription>
                            اضغط على مستخدم لإرسال إشعار مخصص له.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading && !users ? (
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

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>إرسال إشعار إلى: {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            هذا الإشعار سيصل إلى {selectedUser?.phone} فقط.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="pt-4">
                        <SendNotificationForm
                            targetUser={selectedUser}
                            onNotificationSent={() => setDialogOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
