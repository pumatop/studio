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
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Eye,
  Wallet,
  FileText,
  Smartphone,
  Pencil,
  MoreHorizontal,
  ShieldCheck,
  UserX,
  UserCheck,
  AlertCircle,
  Activity,
  Loader2,
  X,
  LogOut,
} from 'lucide-react';
import type { User, Transaction, EgyptTransferTransaction } from '@/lib/types';
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
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

const statusColors: Record<User['status'], string> = {
  "active": "bg-green-100 text-green-800",
  "banned": "bg-red-100 text-red-800",
};

const verificationColors: Record<User['verification'], string> = {
    "verified": "bg-blue-100 text-blue-800",
    "pending": "bg-yellow-100 text-yellow-800",
    "unverified": "bg-gray-100 text-gray-800",
};

/**
 * UserDetailsContent - واجهة عرض التفاصيل الكاملة للمستخدم
 */
function UserDetailsContent({ 
    user, 
    onClose, 
    onUserUpdate, 
    onDeleteSession, 
    onLogoutAllSessions, 
    allTransactions 
}: { 
    user: User, 
    onClose: () => void, 
    onUserUpdate: (userId: string, updates: Partial<User>) => void, 
    onDeleteSession: (userId: string, sessionId: string) => void, 
    onLogoutAllSessions: (userId: string) => void, 
    allTransactions: Transaction[] 
}) {
    const { toast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user.name || "");

    const idCardPlaceholder = PlaceHolderImages.find(p => p.id === 'id-card-placeholder');

    const getImageUrl = (urlOrPlaceholder: string | null | undefined): string | null => {
        if (!urlOrPlaceholder) return null;
        try { new URL(urlOrPlaceholder); return urlOrPlaceholder; } catch (_) {
            if (urlOrPlaceholder === 'id-card-placeholder' && idCardPlaceholder) return idCardPlaceholder.imageUrl;
        }
        return null;
    }

    const frontImageUrl = getImageUrl(user.idImageUrl);

    const userFinancialTransactions = useMemo(() => {
        return allTransactions.filter(t => 
            (t.type === 'account_transfer' && ((t as any).senderId === user.id || (t as any).recipientId === user.id)) || 
            (t.type === 'egypt_transfer' && (t as any).userId === user.id)
        );
    }, [user, allTransactions]);
    
    const userEgyptianTransactions = useMemo(() => {
        return allTransactions.filter((t): t is EgyptTransferTransaction => t.type === 'egypt_transfer' && t.userId === user.id);
    }, [user, allTransactions]);

    const sessions = useMemo(() => {
        if (!user.sessions) return [];
        return Object.entries(user.sessions).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.lastUpdate - a.lastUpdate);
    }, [user]);

    useEffect(() => { if (user) setName(user.name); }, [user]);

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in-0 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b bg-white/80 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-[250px] font-bold text-lg"/>
                                <Button onClick={() => { onUserUpdate(user.id, { name }); setIsEditingName(false); toast({ title: "تم تحديث الاسم بنجاح" }); }}>حفظ</Button>
                                <Button variant="ghost" onClick={() => setIsEditingName(false)}>إلغاء</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-[#1A4B84]">{user.name}</h1>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 hover:opacity-100" onClick={() => setIsEditingName(true)}><Pencil className="h-4 w-4" /></Button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> {user.phone}</span>
                            <Badge className={cn(statusColors[user.status], "font-bold")}>{statusMap[user.status]}</Badge>
                            <Badge variant="outline" className={cn(verificationColors[user.verification], "font-bold")}>{verificationMap[user.verification]}</Badge>
                        </div>
                    </div>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-12 w-12 hover:bg-red-50 hover:text-red-600 transition-colors" 
                    onClick={onClose}
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10">
                <div className="max-w-7xl mx-auto space-y-8 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-8">
                            <Card className="floating-card overflow-hidden">
                                <CardHeader className="bg-[#E3F2FD]/30 border-b">
                                    <CardTitle className="text-lg flex items-center gap-2 text-[#1A4B84] font-black">
                                        <Wallet className="h-5 w-5" /> المحفظة والأرصدة
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center p-4 rounded-[1.5rem] bg-green-50 border border-green-100">
                                        <span className="text-sm font-bold text-slate-600">رصيد ليبي (LYD)</span>
                                        <span className="text-2xl font-black text-green-700 tabular-nums">{(user.balanceLYD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 rounded-[1.5rem] bg-blue-50 border border-blue-100">
                                        <span className="text-sm font-bold text-slate-600">رصيد مصري (EGP)</span>
                                        <span className="text-2xl font-black text-blue-700 tabular-nums">{(user.balanceEGP || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {user.balanceEgyptianPending > 0 && (
                                        <div className="flex justify-between items-center p-4 rounded-[1.5rem] bg-yellow-50 border border-yellow-100">
                                            <span className="text-sm font-bold text-slate-600">معلق مصري</span>
                                            <span className="text-2xl font-black text-yellow-700 tabular-nums">{(user.balanceEgyptianPending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="floating-card overflow-hidden">
                                <CardHeader className="bg-[#E3F2FD]/30 border-b">
                                    <CardTitle className="text-lg flex items-center gap-2 text-[#1A4B84] font-black">
                                        <FileText className="h-5 w-5" /> إثبات الهوية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="relative aspect-[3/2] w-full rounded-[1.5rem] overflow-hidden border-2 border-dashed border-slate-200 bg-white shadow-inner">
                                        {frontImageUrl ? (
                                            <a href={frontImageUrl} target="_blank" rel="noopener noreferrer">
                                                <Image src={frontImageUrl} alt="ID Front" fill className="object-contain p-2" />
                                            </a>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                                <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                                                <span className="text-xs font-bold uppercase tracking-widest">لم يتم رفع صورة الهوية</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                variant="outline" 
                                                className="w-full h-12 rounded-xl text-blue-600 border-blue-200 hover:bg-blue-50 font-black" 
                                                onClick={() => onUserUpdate(user.id, { verification: 'verified' })}
                                            >
                                                <UserCheck className="ml-2 h-5 w-5" /> توثيق
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-full h-12 rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-black" 
                                                onClick={() => onUserUpdate(user.id, { verification: 'unverified' })}
                                            >
                                                <UserX className="ml-2 h-5 w-5" /> إلغاء
                                            </Button>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="w-full h-12 rounded-xl text-purple-600 border-purple-200 hover:bg-purple-50 font-black" 
                                            onClick={() => {
                                                if(window.confirm('هل تريد حقاً تحويل هذا المستخدم إلى تاجر؟')) {
                                                    onUserUpdate(user.id, { role: 'merchant' });
                                                    toast({ title: "تم تحويل الرتبة إلى تاجر" });
                                                }
                                            }}
                                        >
                                            <ShieldCheck className="ml-2 h-5 w-5" /> تحويل إلى تاجر
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <Card className="floating-card overflow-hidden">
                                <CardHeader className="bg-[#E3F2FD]/30 border-b flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2 text-[#1A4B84] font-black">
                                            <Smartphone className="h-5 w-5" /> الأجهزة والجلسات
                                        </CardTitle>
                                        <CardDescription className="text-xs font-bold text-slate-400">إدارة جلسات الدخول النشطة للمستخدم</CardDescription>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-10 rounded-xl font-black shadow-lg shadow-destructive/20"
                                        onClick={() => {
                                            if(window.confirm('هل أنت متأكد من تسجيل خروج المستخدم من جميع الأجهزة؟')) {
                                                onLogoutAllSessions(user.id);
                                                toast({ title: "تم إرسال طلب تسجيل الخروج من جميع الأجهزة" });
                                            }
                                        }}
                                    >
                                        <LogOut className="ml-2 h-4 w-4" /> خروج من الكل
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">الجهاز / النظام</TableHead>
                                                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">IP / الموقع</TableHead>
                                                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">الحالة</TableHead>
                                                <TableHead className="text-left text-xs font-black uppercase tracking-widest text-slate-400">إجراء</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-bold italic">لا توجد جلسات نشطة حالياً</TableCell>
                                                </TableRow>
                                            ) : sessions.map(s => (
                                                <TableRow key={s.id} className="hover:bg-slate-50/50">
                                                    <TableCell>
                                                        <div className="font-black text-[#1A4B84]">{s.activeDevice || 'جهاز غير معروف'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">{s.phoneOS}</div>
                                                    </TableCell>
                                                    <TableCell className="tabular-nums font-bold">
                                                        <div>{s.ipAddress || '---'}</div>
                                                        <div className="text-[10px] text-slate-400">تحديث: {new Date(s.lastUpdate).toLocaleTimeString('ar-EG')}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn("text-[10px] px-2 py-0.5 font-bold", connectionStatusColors[s.connectionStatus])}>
                                                            {s.connectionStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-9 w-9 p-0 text-destructive hover:bg-red-50 hover:text-red-600 rounded-xl"
                                                            onClick={() => {
                                                                if(window.confirm('إنهاء هذه الجلسة؟')) {
                                                                    onDeleteSession(user.id, s.id);
                                                                    toast({ title: "تم إنهاء الجلسة" });
                                                                }
                                                            }}
                                                        >
                                                            <UserX className="h-5 w-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Tabs defaultValue="libyan" dir="rtl" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-14 bg-[#E3F2FD]/20 p-1.5 rounded-2xl border">
                                    <TabsTrigger value="libyan" className="rounded-xl font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-[#1A4B84]">
                                        <Wallet className="ml-2 h-5 w-5" /> سجل المعاملات (د.ل)
                                    </TabsTrigger>
                                    <TabsTrigger value="egyptian" className="rounded-xl font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-[#1A4B84]">
                                        <Activity className="ml-2 h-5 w-5" /> التحويلات المصرية (ج.م)
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="libyan" className="mt-6 animate-in fade-in-0 duration-500">
                                    <div className="bg-white rounded-3xl border shadow-sm p-4">
                                        {userFinancialTransactions.length > 0 ? (
                                            <LibyanTransactionsDataTable initialData={userFinancialTransactions} showExchangeRate={false} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl opacity-30">
                                                <AlertCircle className="h-12 w-12 mb-3" />
                                                <p className="font-bold text-lg">لا يوجد سجل معاملات مالية لهذا المستخدم</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="egyptian" className="mt-6 animate-in fade-in-0 duration-500">
                                    <div className="bg-white rounded-3xl border shadow-sm p-4">
                                        {userEgyptianTransactions.length > 0 ? (
                                            <EgyptianTransfersDataTable initialData={userEgyptianTransactions} />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl opacity-30">
                                                <Activity className="h-12 w-12 mb-3" />
                                                <p className="font-bold text-lg">لا توجد طلبات تحويل مصرية مسجلة</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function UsersDataTable({ initialData, allTransactions }: { initialData: User[], allTransactions: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToToggleBan, setUserToToggleBan] = useState<User | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  
  const { database } = useDatabase();
  const tableRef = useRef<HTMLTableElement>(null);
  const { toast } = useToast();
  const functions = useFunctions();
  
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
    if (!tableRef.current) return;
    
    // Check if DataTables is already initialized
    // @ts-ignore
    if ($.fn.DataTable && $.fn.DataTable.isDataTable(tableRef.current)) {
        // @ts-ignore
        $(tableRef.current).DataTable().destroy();
    }
    
    const timer = setTimeout(() => {
        if (!tableRef.current) return;
        // @ts-ignore
        if ($.fn.DataTable) {
            // @ts-ignore
            $(tableRef.current).DataTable({
                responsive: true,
                dom: "<'flex items-center justify-between gap-4 mb-4'B>rt<'flex items-center justify-between mt-4'ip>",
                buttons: [
                    { extend: 'copy', text: 'نسخ', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' },
                    { extend: 'csv', text: 'CSV', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' },
                    { extend: 'excel', text: 'Excel', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' },
                    { extend: 'print', text: 'طباعة', className: 'px-3 py-1.5 text-xs bg-muted hover:bg-accent rounded-md' }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
                pageLength: 10,
                searching: false,
            });
        }
    }, 100);

    return () => {
        clearTimeout(timer);
        // @ts-ignore
        if (tableRef.current && $.fn.DataTable && $.fn.DataTable.isDataTable(tableRef.current)) {
            // @ts-ignore
            $(tableRef.current).DataTable().destroy();
        }
    };
  }, [filteredData]);

  const confirmToggleBan = async () => {
      if (!userToToggleBan) return;
      setIsToggling(true);
      const newStatus = userToToggleBan.status === 'active' ? 'banned' : 'active';
      const action = newStatus === 'active' ? 'تنشيط' : 'تجميد';
      
      try {
          await updateRtdb(database, `/users/${userToToggleBan.id}`, { status: newStatus });
          toast({ title: `تم ${action} الحساب بنجاح` });
      } catch(e: any) {
          toast({ title: "فشل تحديث الحالة", description: e.message, variant: 'destructive' });
      } finally {
          setIsToggling(false);
          setUserToToggleBan(null);
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
                            {roleMap[u.role] || u.role}
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[10px] px-2", verificationColors[u.verification])}>
                                {verificationMap[u.verification] || u.verification}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge className={cn("text-[10px] px-2", statusColors[u.status])}>
                                {statusMap[u.status] || u.status}
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
                                    <DropdownMenuItem onClick={() => setSelectedUser(u)}>
                                        <Eye className="ml-2 h-4 w-4" /> عرض التفاصيل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setUserToToggleBan(u)} className={cn(u.status === 'active' ? "text-destructive" : "text-green-600")}>
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

      {/* واجهة تفاصيل المستخدم بـ div ثابت لتجنب تجميد الصفحة */}
      {selectedUser && (
          <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
              <UserDetailsContent 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
                onUserUpdate={(id, up) => updateRtdb(database, `/users/${id}`, up)} 
                onDeleteSession={(uid, sid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, sessionId: sid })} 
                onLogoutAllSessions={(uid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, action: 'deleteAll' })} 
                allTransactions={allTransactions} 
              />
          </div>
      )}

      <AlertDialog open={!!userToToggleBan} onOpenChange={(open) => !open && setUserToToggleBan(null)}>
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-black text-[#1A4B84]">
                      {userToToggleBan?.status === 'active' ? 'تجميد حساب المستخدم' : 'إلغاء تجميد الحساب'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-bold text-sm">
                      {userToToggleBan?.status === 'active' 
                        ? `هل أنت متأكد من رغبتك في تجميد حساب "${userToToggleBan?.name}"؟ لن يتمكن من إجراء أي عمليات حتى إلغاء التجميد.`
                        : `هل تريد إعادة تفعيل حساب "${userToToggleBan?.name}" وإلغاء التجميد؟`
                      }
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 pt-4">
                  <AlertDialogCancel className="rounded-xl font-bold border-slate-200">إلغاء</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmToggleBan} 
                    className={cn(
                        "rounded-xl font-black text-sm shadow-lg",
                        userToToggleBan?.status === 'active' ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"
                    )}
                    disabled={isToggling}
                  >
                      {isToggling && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      تأكيد العملية
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}