'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Wallet,
  FileText,
  Smartphone,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import type { User, Transaction, EgyptTransferTransaction, UserSession } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDatabase, updateRtdb, useFunctions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from '@/components/ui/skeleton';

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

// استيراد ديناميكي لمنع أخطاء SSR
const LibyanTransactionsDataTable = dynamic(
  () => import('../libyan-transactions/data-table').then(m => m.LibyanTransactionsDataTable),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

const EgyptianTransfersDataTable = dynamic(
  () => import('../egyptian-transactions/data-table').then(m => m.EgyptianTransfersDataTable),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

const roleMap: Record<User['role'], string> = {
    "user": "مستخدم",
    "merchant": "تاجر",
    "admin": "Admin",
    "superadmin": "Super Admin",
};

const statusMap: Record<User['status'], string> = {
    "active": "نشط",
    "banned": "محظور",
};

const connectionStatusColors: Record<UserSession["connectionStatus"], string> = {
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

const statusColors: Record<User['status'], string> = {
  "active": "bg-green-100 text-green-800",
  "banned": "bg-red-100 text-red-800",
};

function UserDetailsDialog({ user, open, onOpenChange, onUserUpdate, onDeleteSession, allTransactions }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: (userId: string, updates: Partial<User>) => void, onDeleteSession: (userId: string, sessionId: string) => void, onLogoutAllSessions: (userId: string) => void, allTransactions: Transaction[] }) {
    const { toast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user?.name || "");

    const idCardPlaceholder = PlaceHolderImages.find(p => p.id === 'id-card-placeholder');

    const getImageUrl = (urlOrPlaceholder: string | null | undefined): string | null => {
        if (!urlOrPlaceholder) return null;
        try { new URL(urlOrPlaceholder); return urlOrPlaceholder; } catch (_) {
            if (urlOrPlaceholder === 'id-card-placeholder' && idCardPlaceholder) return idCardPlaceholder.imageUrl;
        }
        return null;
    }

    const frontImageUrl = getImageUrl(user?.idImageUrl);

    const userFinancialTransactions = useMemo(() => {
        if (!user) return [];
        return allTransactions.filter(t => (t.type === 'account_transfer' && (t.senderId === user.id || t.recipientId === user.id)) || (t.type === 'egypt_transfer' && t.userId === user.id));
    }, [user, allTransactions]);
    
    const userEgyptianTransactions = useMemo(() => {
        if (!user) return [];
        return allTransactions.filter((t): t is EgyptTransferTransaction => t.type === 'egypt_transfer' && t.userId === user.id);
    }, [user, allTransactions]);

    const sessions = useMemo(() => {
        if (!user?.sessions) return [];
        return Object.entries(user.sessions).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.lastUpdate - a.lastUpdate);
    }, [user]);

    useEffect(() => { if (user) setName(user.name); }, [user]);

    if (!user) return null;
    
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) setIsEditingName(false); onOpenChange(o); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9"/>
                            <Button size="sm" onClick={() => { onUserUpdate(user.id, { name }); setIsEditingName(false); toast({ title: "تم التحديث" }); }}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>إلغاء</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <DialogTitle>{user.name}</DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)}><Pencil className="h-4 w-4" /></Button>
                        </div>
                    )}
                    <DialogDescription>{user.phone}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-1 space-y-4">
                        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet /> الأرصدة</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>د.ل:</span> <span className="font-semibold">{(user.balanceLYD || 0).toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>ج.م:</span> <span className="font-semibold">{(user.balanceEGP || 0).toFixed(2)}</span></div>
                            </CardContent>
                        </Card>
                        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText /> الهوية</CardTitle></CardHeader>
                            <CardContent className="pt-4">
                                {frontImageUrl ? <a href={frontImageUrl} target="_blank" rel="noopener noreferrer"><Image src={frontImageUrl} alt="ID" width={300} height={200} className="rounded-md object-contain border" /></a> : <div className="h-32 border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">لا توجد صورة</div>}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <Button size="sm" onClick={() => onUserUpdate(user.id, { verification: 'verified' })}>توثيق</Button>
                                    <Button size="sm" variant="destructive" onClick={() => onUserUpdate(user.id, { verification: 'unverified' })}>إلغاء</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Smartphone /> الجلسات</CardTitle></CardHeader>
                            <CardContent>
                                <Table><TableHeader><TableRow><TableHead>الجهاز</TableHead><TableHead>الحالة</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                    <TableBody>{sessions.map(s => <TableRow key={s.id}><TableCell>{s.activeDevice}</TableCell><TableCell><Badge className={connectionStatusColors[s.connectionStatus]}>{s.connectionStatus}</Badge></TableCell><TableCell className="text-left"><Button size="sm" variant="ghost" onClick={() => onDeleteSession(user.id, s.id)}>إنهاء</Button></TableCell></TableRow>)}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Tabs defaultValue="libyan">
                            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="libyan">د.ل</TabsTrigger><TabsTrigger value="egyptian">ج.م</TabsTrigger></TabsList>
                            <TabsContent value="libyan">{userFinancialTransactions.length > 0 ? <LibyanTransactionsDataTable initialData={userFinancialTransactions} showExchangeRate={false} /> : <p className="text-center p-4">لا يوجد سجل</p>}</TabsContent>
                            <TabsContent value="egyptian">{userEgyptianTransactions.length > 0 ? <EgyptianTransfersDataTable initialData={userEgyptianTransactions} /> : <p className="text-center p-4">لا يوجد سجل</p>}</TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function UsersDataTable({ initialData, allTransactions }: { initialData: User[], allTransactions: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { database } = useDatabase();
  const functions = useFunctions();
  const tableRef = useRef<HTMLTableElement>(null);
  
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredData = useMemo(() => {
    return initialData.filter(u => (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm)) && (roleFilter === 'all' || u.role === roleFilter));
  }, [initialData, searchTerm, roleFilter]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;

    if ($.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
    }
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;

        $(tableRef.current).DataTable({
          responsive: true,
          dom: "<'flex items-center justify-end px-4 py-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' }
          ],
          language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
          pageLength: 10,
          searching: false,
          pagingType: 'full_numbers',
        });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (tableRef.current && $.fn.DataTable.isDataTable(tableRef.current)) {
        $(tableRef.current).DataTable().destroy();
      }
    };
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input placeholder="بحث بالاسم أو الهاتف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="merchant">تاجر</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border">
        <Table ref={tableRef}>
          <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الهاتف</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead className="text-left">إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{filteredData.map(u => (
            <TableRow key={u.id} className={cn(u.status === 'banned' && 'bg-red-50/50')}>
              <TableCell>{u.name}</TableCell><TableCell>{u.phone}</TableCell><TableCell>{roleMap[u.role]}</TableCell>
              <TableCell><Badge className={statusColors[u.status]}>{statusMap[u.status]}</Badge></TableCell>
              <TableCell className="text-left"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => { setSelectedUser(u); setDetailsOpen(true); }}><Eye className="ml-2 h-4 w-4" /> تفاصيل</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => updateRtdb(database, `/users/${u.id}`, { status: u.status === 'active' ? 'banned' : 'active' })}>حظر/فك</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
      <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setDetailsOpen} onUserUpdate={(id, up) => updateRtdb(database, `/users/${id}`, up)} onDeleteSession={(uid, sid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, sessionId: sid })} onLogoutAllSessions={(uid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, action: 'deleteAll' })} allTransactions={allTransactions} />
    </div>
  );
}