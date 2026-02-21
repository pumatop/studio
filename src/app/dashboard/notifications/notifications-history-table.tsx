"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { Notification, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { FilterX, Eye } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

const typeMap = {
  standard: "عادي",
  popup: "منبثق",
  banner: "شريط جانبي",
};

export function NotificationsHistoryTable({ notifications, users }: { notifications: Notification[], users: User[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef<HTMLTableElement>(null);
  
  const enrichedNotifications = useMemo(() => {
    return notifications.map(notif => {
      if (notif.target !== 'all') {
        const user = users.find(u => u.id === notif.target);
        return { ...notif, targetName: user?.name || notif.target };
      }
      return { ...notif, targetName: 'جميع المستخدمين' };
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications, users]);

  const filteredData = useMemo(() => {
    return enrichedNotifications.filter(item =>
      (item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.targetName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [enrichedNotifications, searchTerm]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) {
      return;
    }

    if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
    }
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) {
          return;
        }

        $(tableRef.current).DataTable({
          responsive: true,
          dom: "<'flex items-center justify-end px-4 py-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'csv', text: 'CSV', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' }
          ],
          language: {
            url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json',
          },
          searching: false,
          pageLength: 5,
          lengthMenu: [5, 10, 25, 50],
          pagingType: 'full_numbers',
          order: [[3, 'desc']]
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, [filteredData]);

  const handleClearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
          <Input
            placeholder="ابحث بالعنوان، المحتوى أو المستلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm"
          />
          <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
            <FilterX className="ml-2 h-4 w-4" />
            مسح
          </Button>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table ref={tableRef} className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>المستلم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>وقت الإرسال</TableHead>
              <TableHead>الصورة</TableHead>
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
