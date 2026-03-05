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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Wallet,
  FileText,
  Smartphone,
  Pencil,
  MoreHorizontal,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserX,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
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

// Dynamic imports for nested data tables
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
    "admin": "مسؤول",
    "superadmin": "مسؤول خارق",
};

const statusMap: Record<User['status'], string> = {
    "active": "نشط",
    "banned": "مجمد",
};

const verificationMap: Record<User['verification'], string> = {
    "verified": "موثق",
    "pending": "قيد المراجعة",
    "unverified": "غير موثق",
};

const connectionStatusColors: Record<string, string> = {
  "متصل": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "غير متصل": "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-400",
};

const statusColors: Record<User['status'], string> = {
  "active": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "banned": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const verificationColors: Record<User['verification'], string> = {
    "verified": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "unverified": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

function UserDetailsDialog({ 
    user, 
    open, 
    onOpenChange, 
    onUserUpdate, 
    onDeleteSession, 
    onLogoutAllSessions, 
    allTransactions 
}: { 
    user: User | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    onUserUpdate: (userId: string, updates: Partial<User>) => void, 
    onDeleteSession: (userId: string, sessionId: string) => void, 
    onLogoutAllSessions: (userId: string) => void, 
    allTransactions: Transaction[] 
}) {
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
        return allTransactions.filter(t => 
            (t.type === 'account_transfer' && ((t as any).senderId === user.id || (t as any).recipientId === user.id)) || 
            (t.type === 'egypt_transfer' && (t as any).userId === user.id)
        );
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
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 text-right">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-[200px]"/>
                                    <Button size="sm" onClick={() => { onUserUpdate(user.id, { name }); setIsEditingName(false); toast({ title: "تم تحديث الاسم بنجاح" }); }}>حفظ</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>إلغاء</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-2xl font-bold">{user.name}</DialogTitle>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditingName(true)}><Pencil className="h-4 w-4" /></Button>
                                </div>
                            )}
                            <DialogDescription className="text-base mt-1 flex items-center gap-2 justify-start">
                                <Smartphone className="h-4 w-4" /> {user.phone}
                                <Badge className={cn("mr-2", statusColors[user.status])}>{statusMap[user.status]}</Badge>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-sm py-1 px-3", verificationColors[user.verification])}>
                                {user.verification === 'verified' ? <ShieldCheck className="ml-1.5 h-4 w-4" /> : user.verification === 'pending' ? <Clock className="ml-1.5 h-4 w-4" /> : <ShieldAlert className="ml-1.5 h-4 w-4" />}
                                {verificationMap[user.verification]}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                                        <Wallet className="h-5 w-5" /> المحفظة والأرصدة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                                        <span className="text-sm font-medium">رصيد ليبي (LYD)</span>
                                        <span className="text-lg font-bold text-green-700 dark:text-green-400 tabular-nums">{(user.balanceLYD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                        <span className="text-sm font-medium">رصيد مصري (EGP)</span>
                                        <span className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">{(user.balanceEGP || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {user.balanceEgyptianPending > 0 && (
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
                                            <span className="text-sm font-medium">معلق مصري</span>
                                            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">{(user.balanceEgyptianPending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2 text-primary">
                                        <FileText className="h-5 w-5" /> إثبات الهوية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden border bg-muted">
                                        {frontImageUrl ? (
                                            <a href={frontImageUrl} target="_blank" rel="noopener noreferrer">
                                                <Image src={frontImageUrl} alt="ID Front" fill className="object-contain" />
                                            </a>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                                <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                                <span className="text-xs">لم يتم رفع صورة الهوية</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button 
                                            variant="outline" 
                                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                                            size="sm"
                                            onClick={() => onUserUpdate(user.id, { verification: 'verified' })}
                                        >
                                            <UserCheck className="ml-2 h-4 w-4" /> توثيق
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                            size="sm"
                                            onClick={() => onUserUpdate(user.id, { verification: 'unverified' })}
                                        >
                                            <UserX className="ml-2 h-4 w-4" /> إلغاء
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2 text-primary">
                                            <Smartphone className="h-5 w-5" /> الأجهزة المتصلة
                                        </CardTitle>
                                        <CardDescription className="text-xs">إدارة جلسات الدخول الحالية للمستخدم</CardDescription>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-8"
                                        onClick={() => {
                                            if(window.confirm('هل أنت متأكد من تسجيل خروج المستخدم من جميع الأجهزة؟')) {
                                                onLogoutAllSessions(user.id);
                                                toast({ title: "تم إرسال طلب تسجيل الخروج من جميع الأجهزة" });
                                            }
                                        }}
                                    >
                                        <LogOut className="ml-2 h-4 w-4" /> تسجيل خروج الكل
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="text-xs">الجهاز / النظام</TableHead>
                                                    <TableHead className="text-xs">IP / الموقع</TableHead>
                                                    <TableHead className="text-xs">الحالة</TableHead>
                                                    <TableHead className="text-left text-xs">إجراء</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sessions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-sm">لا توجد جلسات نشطة حالياً</TableCell>
                                                    </TableRow>
                                                ) : sessions.map(s => (
                                                    <TableRow key={s.id} className="text-xs tabular-nums">
                                                        <TableCell>
                                                            <div className="font-medium">{s.activeDevice || 'جهاز غير معروف'}</div>
                                                            <div className="text-[10px] text-muted-foreground">{s.phoneOS}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>{s.ipAddress || '---'}</div>
                                                            <div className="text-[10px] text-muted-foreground">تحديث: {new Date(s.lastUpdate).toLocaleTimeString('ar-EG')}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={cn("text-[10px] px-1.5 py-0", connectionStatusColors[s.connectionStatus])}>
                                                                {s.connectionStatus}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-left">
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="h-7 w-7 p-0 text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                onClick={() => {
                                                                    if(window.confirm('إنهاء هذه الجلسة؟')) {
                                                                        onDeleteSession(user.id, s.id);
                                                                        toast({ title: "تم إنهاء الجلسة" });
                                                                    }
                                                                }}
                                                            >
                                                                <UserX className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Tabs defaultValue="libyan" dir="rtl" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 p-1">
                                    <TabsTrigger value="libyan" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Wallet className="ml-2 h-4 w-4" /> سجل المعاملات (د.ل)
                                    </TabsTrigger>
                                    <TabsTrigger value="egyptian" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Activity className="ml-2 h-4 w-4" /> التحويلات المصرية (ج.م)
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="libyan" className="mt-4">
                                    {userFinancialTransactions.length > 0 ? (
                                        <LibyanTransactionsDataTable initialData={userFinancialTransactions} showExchangeRate={false} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg opacity-40">
                                            <AlertCircle className="h-10 w-10 mb-2" />
                                            <p className="text-sm">لا يوجد سجل معاملات مالية لهذا المستخدم</p>
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="egyptian" className="mt-4">
                                    {userEgyptianTransactions.length > 0 ? (
                                        <EgyptianTransfersDataTable initialData={userEgyptianTransactions} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg opacity-40">
                                            <Activity className="h-10 w-10 mb-2" />
                                            <p className="text-sm">لا توجد طلبات تحويل مصرية مسجلة</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-4 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function UsersDataTable({ initialData, allTransactions }: { initialData: User[], allTransactions: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { database } = useDatabase();
  const tableRef = useRef<HTMLTableElement>(null);
  const { toast } = useToast();
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    return initialData.filter(u => 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm)) && 
        (roleFilter === 'all' || u.role === roleFilter) &&
        (statusFilter === 'all' || u.status === statusFilter)
    );
  }, [initialData, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    import('jquery').then(($) => {
        if (!tableRef.current) return;
        // @ts-ignore
        if ($.default.fn.DataTable.isDataTable(tableRef.current)) {
            // @ts-ignore
            $(tableRef.current).DataTable().destroy();
        }
        
        const timer = setTimeout(() => {
          // @ts-ignore
          $(tableRef.current!).DataTable({
            responsive: true,
            dom: "<'flex items-center justify-between gap-4 mb-4'B>rt<'flex items-center justify-between mt-4'ip>",
            buttons: [
                { extend: 'copy', text: 'نسخ', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' },
                { extend: 'excel', text: 'Excel', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' },
                { extend: 'print', text: 'طباعة', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' }
            ],
            language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
            pageLength: 10,
            searching: false,
          });
        }, 100);
        return () => { clearTimeout(timer); };
    });
  }, [filteredData]);

  const handleToggleBan = async (user: User) => {
      const newStatus = user.status === 'active' ? 'banned' : 'active';
      const action = newStatus === 'active' ? 'إلغاء التجميد' : 'تجميد';
      if(window.confirm(`هل أنت متأكد من ${action} المستخدم ${user.name}؟`)) {
          try {
              await updateRtdb(database, `/users/${user.id}`, { status: newStatus });
              toast({ title: `تم ${action} المستخدم بنجاح` });
          } catch(e: any) {
              toast({ title: "فشل تحديث الحالة", description: e.message, variant: 'destructive' });
          }
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Input 
                placeholder="بحث بالاسم أو رقم الهاتف..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="max-w-md pr-10" 
            />
            <Eye className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
        </div>
        <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الرتب</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="merchant">تاجر</SelectItem>
                    <SelectItem value="admin">مسؤول</SelectItem>
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="banned">مجمد</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
        <Table ref={tableRef}>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">المستخدم</TableHead>
              <TableHead className="font-bold">نوع الحساب</TableHead>
              <TableHead className="font-bold text-center">التوثيق</TableHead>
              <TableHead className="font-bold text-center">حالة الحساب</TableHead>
              <TableHead className="font-bold">الاتصال</TableHead>
              <TableHead className="font-bold">آخر ظهور</TableHead>
              <TableHead className="font-bold text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map(u => {
                const isOnline = u.connectionStatus === 'متصل';
                return (
                    <TableRow key={u.id} className={cn(u.status === 'banned' && 'bg-red-50/30 opacity-70')}>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{u.name}</span>
                                <span className="text-[11px] text-muted-foreground tabular-nums">{u.phone}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-sm font-bold text-primary">
                            {roleMap[u.role]}
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[10px] px-2", verificationColors[u.verification])}>
                                {verificationMap[u.verification]}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge className={cn("text-[10px] px-2", statusColors[u.status])}>
                                {statusMap[u.status]}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1.5">
                                <span className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                                <span className="text-xs">{u.connectionStatus || 'غير متصل'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                            {u.lastSeen ? new Date(u.lastSeen).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '---'}
                        </TableCell>
                        <TableCell className="text-left">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuItem onClick={() => { setSelectedUser(u); setDetailsOpen(true); }}>
                                        <Eye className="ml-2 h-4 w-4" /> عرض التفاصيل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleBan(u)} className={cn(u.status === 'active' ? "text-destructive" : "text-green-600")}>
                                        {u.status === 'active' ? <UserX className="ml-2 h-4 w-4" /> : <UserCheck className="ml-2 h-4 w-4" />}
                                        {u.status === 'active' ? 'تجميد المستخدم' : 'إلغاء التجميد'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>

      <UserDetailsDialog 
        user={selectedUser} 
        open={isDetailsOpen} 
        onOpenChange={setDetailsOpen} 
        onUserUpdate={(id, up) => updateRtdb(database, `/users/${id}`, up)} 
        onDeleteSession={(uid, sid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, sessionId: sid })} 
        onLogoutAllSessions={(uid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, action: 'deleteAll' })} 
        allTransactions={allTransactions} 
      />
    </div>
  );
}
