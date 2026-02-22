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

const typeMap: { [key: string]: string } = {
    standard: "قياسي",
    popup: "منبثق",
    banner: "بانر",
  };
  

export function NotificationsHistoryTable({ notifications, users, supervisors }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const targetMap = useMemo(() => {
    const map = new Map();
    (users || []).forEach((user: any) => map.set(user.id, user.name));
    (supervisors || []).forEach((supervisor: any) => map.set(supervisor.id, supervisor.name));
    return map;
  }, [users, supervisors]);

  const enrichedNotifications = useMemo(() => {
    return notifications.map((notification: any) => ({
      ...notification,
      targetName: notification.target === 'all' 
        ? 'الكل' 
        : targetMap.get(notification.target) || notification.target,
    }));
  }, [notifications, targetMap]);

  const filteredData = useMemo(() => {
    return enrichedNotifications.filter((notification: any) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        notification.title.toLowerCase().includes(searchTermLower) ||
        notification.body.toLowerCase().includes(searchTermLower) ||
        notification.targetName.toLowerCase().includes(searchTermLower);
      
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [enrichedNotifications, searchTerm, typeFilter]);



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
                    <Badge variant="outline">{typeMap[notification.type]}</Badge>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}