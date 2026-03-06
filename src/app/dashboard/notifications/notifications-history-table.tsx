'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
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
import { MoreHorizontal, Trash2, FilterX, Search, BellRing } from 'lucide-react';
import { useDatabase, removeRtdb } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Notification, User } from '@/lib/types';
import { cn } from '@/lib/utils';

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

const typeMap: { [key: string]: string } = {
  standard: "قياسي",
  popup: "منبثق",
  banner: "بانر",
  'banner-ad': 'بانر إعلاني',
  'popup-ad': 'إعلان منبثق',
  'image-only': 'صورة فقط',
};

/**
 * مكون لعرض التاريخ والوقت بنمط عربي دقيق (الوقت أولاً ثم التاريخ)
 */
const DateTimeDisplay = ({ timestamp }: { timestamp: number | undefined }) => {
    if (!timestamp) return <span className="text-slate-300">---</span>;
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0];
    const period = date.getHours() >= 12 ? 'م' : 'ص';
    
    return (
        <div className="flex flex-col items-start gap-0.5 tabular-nums" dir="rtl">
            <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">{timePart}</span>
                <span className="text-[10px] font-black text-slate-400">{period}</span>
            </div>
            <div className="flex items-center text-[10px] text-slate-400 font-medium">
                <span>{day}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{month}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{year}</span>
            </div>
        </div>
    );
};

export function NotificationsHistoryTable({ notifications, users }: { notifications: Notification[], users: User[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [tableKey, setTableKey] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);

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
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [enrichedNotifications, searchTerm, typeFilter]);

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [filteredData]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;
        $(tableRef.current).DataTable({
          responsive: true,
          order: [], // للحفاظ على ترتيب React (الأحدث أولاً)
          dom: "<'flex items-center justify-end px-4 py-2 gap-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' }
          ],
          language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
          pageLength: 100, // عرض 100 إشعار في الصفحة كما طلب المستخدم
          lengthMenu: [10, 25, 50, 100, 200],
          searching: false,
          pagingType: 'full_numbers',
        });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
          $(tableRef.current).DataTable().destroy();
      }
    };
  }, [tableKey]);

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

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="ابحث بالعنوان أو المحتوى أو المستلم..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pr-10 h-11 rounded-xl bg-white border-slate-200" 
                />
            </div>
            <div className="flex items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px] h-11 rounded-xl bg-white">
                        <SelectValue placeholder="نوع الإشعار" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الأنواع</SelectItem>
                        <SelectItem value="standard">قياسي</SelectItem>
                        <SelectItem value="popup">منبثق</SelectItem>
                        <SelectItem value="banner">بانر</SelectItem>
                        <SelectItem value="banner-ad">بانر إعلاني</SelectItem>
                        <SelectItem value="popup-ad">إعلان منبثق</SelectItem>
                        <SelectItem value="image-only">صورة فقط</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={handleClearFilters} className="h-11 w-11 rounded-xl text-slate-400 hover:text-primary">
                    <FilterX className="h-5 w-5" />
                </Button>
            </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="rounded-[2rem] border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar relative">
          <Table key={tableKey} ref={tableRef}>
            <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">محتوى الإشعار</TableHead>
                <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المرسل إليه</TableHead>
                <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-center h-12">النوع</TableHead>
                <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">التوقيت</TableHead>
                <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">صورة</TableHead>
                <TableHead className="text-left font-black text-[#1B69FF] text-[10px] uppercase tracking-widest h-12">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-bold italic">لا توجد إشعارات تطابق البحث</TableCell>
                </TableRow>
              ) : filteredData.map((notification) => (
                <TableRow key={notification.id} className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
                  <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                              <BellRing className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="flex flex-col text-right">
                              <span className="font-black text-sm text-[#001F3D]">{notification.title}</span>
                              <span className="text-[11px] text-slate-400 font-bold line-clamp-1 max-w-[250px]">{notification.body}</span>
                          </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 font-bold text-[10px] px-3">
                          {notification.targetName}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tighter px-2.5 py-0.5">
                          {typeMap[notification.type] || notification.type}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    <DateTimeDisplay timestamp={notification.createdAt} />
                  </TableCell>
                  <TableCell>
                      {notification.imageUrl ? (
                          <a href={notification.imageUrl} target="_blank" rel="noopener noreferrer" className="relative block h-10 w-10 overflow-hidden rounded-lg border bg-slate-50 hover:scale-110 transition-transform">
                              <Image src={notification.imageUrl} alt="Notif" fill className="object-cover" />
                          </a>
                      ) : (
                          <span className="text-slate-300">---</span>
                      )}
                  </TableCell>
                  <TableCell className="text-left">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[140px]">
                              <DropdownMenuItem onClick={() => setNotificationToDelete(notification)} className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm text-destructive focus:text-destructive">
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  <span>حذف السجل</span>
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
          <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8" dir="rtl">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-[#001F3D]">هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription className="font-bold text-slate-500 mt-2 leading-relaxed">
                      سيتم حذف سجل الإشعار "{notificationToDelete?.title}" من قاعدة البيانات. لن يتمكن المستخدمون من رؤيته في سجلاتهم التاريخية داخل التطبيق.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 pt-6 flex flex-col sm:flex-row">
                  <AlertDialogCancel onClick={() => setNotificationToDelete(null)} className="rounded-xl font-bold border-slate-200 flex-1 h-12">إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm px-8 flex-1 h-12">
                      نعم، احذف السجل
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
