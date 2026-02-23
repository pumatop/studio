'use client';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useDatabase, removeRtdb } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Notification, User } from '@/lib/types';


const typeMap: { [key: string]: string } = {
  standard: "قياسي",
  popup: "منبثق",
  banner: "بانر",
  'banner-ad': 'بانر إعلاني',
  'popup-ad': 'إعلان منبثق',
  'image-only': 'صورة فقط',
};
  

export function NotificationsHistoryTable({ notifications, users }: { notifications: Notification[], users: User[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);

  const { database } = useDatabase();
  const { toast } = useToast();

  const targetMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((user) => map.set(user.id, user.name));
    return map;
  }, [users]);

  const enrichedNotifications = useMemo(() => {
    return notifications.map((notification) => ({
      ...notification,
      targetName: notification.target === 'all' 
        ? 'الكل' 
        : targetMap.get(notification.target) || notification.target,
    }));
  }, [notifications, targetMap]);

  const filteredData = useMemo(() => {
    return enrichedNotifications.filter((notification) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTermLower) ||
        notification.body.toLowerCase().includes(searchTermLower) ||
        notification.targetName.toLowerCase().includes(searchTermLower);
      
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [enrichedNotifications, searchTerm, typeFilter]);

  const handleDelete = async () => {
      if (!notificationToDelete) return;

      const { id, target } = notificationToDelete;
      let pathToDelete: string;

      if (target === 'all') {
          pathToDelete = `/notifications/${id}`;
      } else {
          pathToDelete = `/users/${target}/notifications/${id}`;
      }

      try {
          await removeRtdb(database, pathToDelete);
          toast({
              title: "تم الحذف بنجاح",
              description: `تم حذف الإشعار "${notificationToDelete.title}".`,
              variant: "destructive",
          });
      } catch (error: any) {
          toast({
              title: "حدث خطأ",
              description: `فشل حذف الإشعار. ${error.message}`,
              variant: "destructive",
          });
      } finally {
          setNotificationToDelete(null);
      }
  };


  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg shadow-sm bg-background">
        <div className="mb-4 text-6xl">🤷‍♂️</div>
        <h3 className="text-xl font-semibold mb-2">لا توجد بيانات متاحة</h3>
        <p className="text-muted-foreground">حاول تغيير مرشحات البحث الخاصة بك.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg shadow-sm bg-card text-card-foreground">
        <div className="p-4 flex items-center justify-between gap-4">
          <Input
            placeholder="ابحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="فلترة حسب النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="standard">قياسي</SelectItem>
              <SelectItem value="popup">منبثق</SelectItem>
              <SelectItem value="banner">بانر</SelectItem>
              <SelectItem value="banner-ad">بانر إعلاني</SelectItem>
              <SelectItem value="popup-ad">إعلان منبثق</SelectItem>
              <SelectItem value="image-only">صورة فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الإشعار</TableHead>
                <TableHead>المرسل إليه</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>صورة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((notification) => (
                <TableRow key={notification.id} className="even:bg-muted/20">
                  <TableCell>
                      <div className="font-semibold">{notification.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{notification.body}</div>
                  </TableCell>
                  <TableCell>{notification.targetName}</TableCell>
                  <TableCell>
                      <Badge variant="outline">{typeMap[notification.type] || notification.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(notification.createdAt).toLocaleString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </TableCell>
                  <TableCell>
                      {notification.imageUrl && (
                          <a href={notification.imageUrl} target="_blank" rel="noopener noreferrer">
                              <Image src={notification.imageUrl} alt="صورة الإشعار" width={40} height={40} className="rounded-md object-cover" />
                          </a>
                      )}
                  </TableCell>
                  <TableCell className="text-left">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setNotificationToDelete(notification)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  <span>حذف</span>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                  <AlertDialogDescription>
                      سيتم حذف الإشعار "{notificationToDelete?.title}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setNotificationToDelete(null)}>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      نعم، حذف
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}