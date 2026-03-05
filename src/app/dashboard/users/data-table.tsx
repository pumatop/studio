
'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  FileDown,
  Printer,
  Search,
  Info,
  CalendarDays,
  Hash,
  ArrowRightLeft,
  Banknote,
  ChevronLeft,
} from 'lucide-react';
import type { User, Transaction, EgyptTransferTransaction, AccountTransferTransaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn, exportToCsv } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';

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

const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return '---';
    return new Date(timestamp).toLocaleString('ar-EG-u-nu-latn', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

function SimpleTransactionTable({ data, type }: { data: any[], type: 'libyan' | 'egyptian' }) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl opacity-30">
                <AlertCircle className="h-12 w-12 mb-3" />
                <p className="font-bold text-lg">لا يوجد سجل معاملات لهذا المستخدم</p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border overflow-hidden bg-white shadow-sm">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar relative">
                <Table>
                    <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                        <TableRow>
                            <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">المعرف</TableHead>
                            <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">التاريخ والوقت</TableHead>
                            <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">{type === 'libyan' ? 'المبلغ (د.ل)' : 'المبلغ (ج.م)'}</TableHead>
                            <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">النوع</TableHead>
                            <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                            {type === 'egyptian' && <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">المستلم</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((tx, idx) => (
                            <TableRow key={tx.id || idx} className="hover:bg-slate-50/50 border-b last:border-0">
                                <TableCell className="font-mono text-[10px] text-slate-500">{tx.id}</TableCell>
                                <TableCell className="text-[11px] tabular-nums">{formatDate(tx.timestamp)}</TableCell>
                                <TableCell className="text-sm font-bold">
                                    {type === 'libyan' 
                                        ? (tx.amount || tx.amountLYD || 0).toLocaleString('en-US')
                                        : (tx.amountEGP || 0).toLocaleString('en-US')}
                                </TableCell>
                                <TableCell className="text-[11px] font-bold">
                                    {tx.methodDisplayName || tx.transferType || tx.type}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("text-[10px] font-bold border-none", 
                                        tx.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                        tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                    )}>
                                        {tx.status === 'completed' ? 'ناجح' : tx.status === 'pending' ? 'معلق' : 'مرفوض'}
                                    </Badge>
                                </TableCell>
                                {type === 'egyptian' && (
                                    <TableCell className="text-[11px]">
                                        <div className="font-bold">{tx.recipientName || '---'}</div>
                                        <div className="text-slate-400 tabular-nums">{tx.recipientNumber}</div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

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

    const userLibyanTransactions = useMemo(() => {
        return allTransactions.filter(t => 
            (t.userId === user.id || (t as any).senderId === user.id || (t as any).recipientId === user.id) &&
            (t.type === 'account_transfer' || t.type === 'recharge_purchase' || t.type === 'egypt_transfer')
        ).sort((a, b) => b.timestamp - a.timestamp);
    }, [user, allTransactions]);
    
    const userEgyptianTransactions = useMemo(() => {
        return allTransactions.filter(t => 
            t.userId === user.id && 
            ['egypt_transfer', 'egypt_home', 'egypt_wallets', 'egypt_instapay'].includes(t.type)
        ).sort((a, b) => b.timestamp - a.timestamp);
    }, [user, allTransactions]);

    const sessions = useMemo(() => {
        if (!user.sessions) return [];
        return Object.entries(user.sessions).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.lastUpdate - a.lastUpdate);
    }, [user]);

    useEffect(() => { if (user) setName(user.name); }, [user]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden animate-in fade-in-0 duration-300">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 md:px-10 border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-2xl">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-[200px] font-bold rounded-xl"/>
                                <Button size="sm" onClick={() => { onUserUpdate(user.id, { name }); setIsEditingName(false); toast({ title: "تم التحديث" }); }}>حفظ</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-[#1A4B84]">{user.name}</h1>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100" onClick={() => setIsEditingName(true)}><Pencil className="h-3.5 w-3.5" /></Button>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 tabular-nums">{user.phone}</span>
                            <Badge className={cn(statusColors[user.status], "text-[9px] font-black h-5 border-none shadow-none")}>{statusMap[user.status]}</Badge>
                        </div>
                    </div>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-10 w-10 hover:bg-red-50 hover:text-red-600 transition-colors" 
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    
                    {/* Row 1: Balances (Right) & Account Information (Left) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Balances (Right Side) */}
                        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4 text-right">
                                <CardTitle className="text-base flex items-center justify-end gap-2 text-[#1A4B84] font-black">
                                    الأرصدة <Wallet className="h-5 w-5 text-primary" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد الليبي</span>
                                    <div className="flex items-baseline gap-1.5" dir="ltr">
                                        <span className="text-2xl font-black text-[#1A4B84] tabular-nums">{(user.balanceLYD || 0).toFixed(2)}</span>
                                        <span className="text-sm font-bold text-[#1A4B84]">د.ل</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد المصري</span>
                                    <div className="flex items-baseline gap-1.5" dir="ltr">
                                        <span className="text-2xl font-black text-[#1A4B84] tabular-nums">{(user.balanceEGP || 0).toFixed(2)}</span>
                                        <span className="text-sm font-bold text-[#1A4B84]">ج.م</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المصري المعلق</span>
                                    <div className="flex items-baseline gap-1.5" dir="ltr">
                                        <span className="text-2xl font-black text-slate-300 tabular-nums">{(user.balanceEgyptianPending || 0).toFixed(2)}</span>
                                        <span className="text-sm font-bold text-slate-300">ج.م</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Information (Left Side - Larger) */}
                        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4 text-right">
                                <CardTitle className="text-base flex items-center justify-end gap-2 text-[#1A4B84] font-black">
                                    معلومات الحساب <ShieldCheck className="h-5 w-5 text-primary" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#1A4B84] tabular-nums" dir="ltr">{formatDate(user.createdAt)}</span>
                                    <span className="text-sm font-bold text-slate-500">:تاريخ فتح الحساب</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#1A4B84] tabular-nums" dir="ltr">{formatDate(user.lastPasswordChange)}</span>
                                    <span className="text-sm font-bold text-slate-500">:آخر تغيير لكلمة المرور</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-[#1A4B84] tabular-nums" dir="ltr">{formatDate(user.lastPinChange)}</span>
                                    <span className="text-sm font-bold text-slate-500">:آخر تغيير للرقم السري</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Row 2: Verification (Right) & Sessions (Left) - Equal Width */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Identity Verification (Right Side) */}
                        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4 text-right">
                                <CardTitle className="text-base flex items-center justify-end gap-2 text-[#1A4B84] font-black">
                                    التوثيق <FileText className="h-5 w-5 text-primary" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-slate-400 block text-right">صورة الهوية</span>
                                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center">
                                        {frontImageUrl ? (
                                            <a href={frontImageUrl} target="_blank" rel="noopener noreferrer" className="relative w-full h-full">
                                                <Image src={frontImageUrl} alt="Front" fill className="object-cover p-1 rounded-2xl" />
                                            </a>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-300">غير متوفرة</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-black text-xs border-2 shadow-sm transition-all",
                                            user.verification === 'verified' ? "text-red-600 border-red-50 hover:bg-red-50" : "text-blue-600 border-blue-50 hover:bg-blue-50"
                                        )}
                                        onClick={() => onUserUpdate(user.id, { verification: user.verification === 'verified' ? 'unverified' : 'verified' })}
                                    >
                                        {user.verification === 'verified' ? "إلغاء التوثيق" : "توثيق الحساب"}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "w-full h-12 rounded-2xl font-black text-xs border-2 shadow-sm transition-all",
                                            user.role === 'merchant' ? "text-slate-600 border-slate-50 hover:bg-slate-50" : "text-purple-600 border-purple-50 hover:bg-purple-50"
                                        )}
                                        onClick={() => {
                                            const newRole = user.role === 'merchant' ? 'user' : 'merchant';
                                            if(window.confirm(`هل تريد ${newRole === 'merchant' ? 'تحويله لتاجر' : 'إرجاعه لمستخدم'}؟`)) {
                                                onUserUpdate(user.id, { role: newRole });
                                            }
                                        }}
                                    >
                                        {user.role === 'merchant' ? "تحويل لمستخدم" : "تحويل لتاجر"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sessions & Devices (Left Side) */}
                        <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden flex flex-col">
                            <CardHeader className="bg-slate-50/50 border-b py-4 text-right">
                                <div className="flex flex-col items-end">
                                    <CardTitle className="text-base flex items-center gap-2 text-[#1A4B84] font-black">
                                        الجلسات والأجهزة <Smartphone className="h-5 w-5 text-primary" />
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-slate-400">عرض وإدارة الجلسات النشطة للمستخدم</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="overflow-x-auto p-4 flex-1">
                                    <Table className="min-w-[400px]">
                                        <TableHeader>
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="text-center font-black text-slate-400 text-[10px] uppercase">إجراء</TableHead>
                                                <TableHead className="text-center font-black text-slate-400 text-[10px] uppercase">الحالة</TableHead>
                                                <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase">الجهاز</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessions.length === 0 ? (
                                                <TableRow><TableCell colSpan={3} className="h-32 text-center text-slate-300 font-bold italic text-sm">لا توجد أجهزة نشطة حالياً</TableCell></TableRow>
                                            ) : sessions.map(s => (
                                                <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-600 gap-1.5" onClick={() => onDeleteSession(user.id, s.id)}>
                                                            <LogOut className="h-3.5 w-3.5" /> <span className="text-[10px] font-black uppercase">إنهاء</span>
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[9px] font-black h-6 border-none px-2.5", connectionStatusColors[s.connectionStatus])}>
                                                            {s.connectionStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4">
                                                        <div className="font-black text-xs text-[#1A4B84]">{s.activeDevice}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.phoneOS}</div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-6 border-t mt-auto">
                                    <Button 
                                        variant="destructive" 
                                        className="w-full h-12 rounded-[1.2rem] font-black text-xs shadow-xl shadow-red-500/20 gap-3"
                                        onClick={() => { if(window.confirm('إنهاء جميع الجلسات النشطة؟')) onLogoutAllSessions(user.id); }}
                                    >
                                        <LogOut className="h-4 w-4" /> تسجيل الخروج من كل الأجهزة
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Row 3: Transaction Log (Full Width) */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-8 text-right">
                            <div className="flex flex-col items-end">
                                <CardTitle className="text-xl font-black text-[#1A4B84] flex items-center gap-3">
                                    سجل عمليات المستخدم بالكامل <Activity className="h-6 w-6 text-primary" />
                                </CardTitle>
                                <CardDescription className="text-xs font-bold text-slate-400">تصفح كافة المعاملات المالية والحوالات المسجلة لهذا الحساب</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <Tabs defaultValue="libyan" dir="rtl" className="w-full">
                                <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-slate-100 p-1 rounded-2xl mb-8">
                                    <TabsTrigger value="libyan" className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">معاملات الدينار</TabsTrigger>
                                    <TabsTrigger value="egyptian" className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">الحوالات المصرية</TabsTrigger>
                                </TabsList>
                                <TabsContent value="libyan" className="m-0 animate-in fade-in-0 duration-500">
                                    <SimpleTransactionTable data={userLibyanTransactions} type="libyan" />
                                </TabsContent>
                                <TabsContent value="egyptian" className="m-0 animate-in fade-in-0 duration-500">
                                    <SimpleTransactionTable data={userEgyptianTransactions} type="egyptian" />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}

export function UsersDataTable({ initialData, allTransactions }: { initialData: User[], allTransactions: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToToggleBan, setUserToToggleBan] = useState<User | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  
  const { database } = useDatabase();
  const { toast } = useToast();
  const functions = useFunctions();

  const filteredData = useMemo(() => {
    return initialData.filter(u => 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm)) && 
        (roleFilter === 'all' || u.role === roleFilter) &&
        (statusFilter === 'all' || u.status === statusFilter) &&
        (verificationFilter === 'all' || u.verification === verificationFilter)
    );
  }, [initialData, searchTerm, roleFilter, statusFilter, verificationFilter]);

  const handleCsvExport = () => {
    exportToCsv('users_list.csv', filteredData.map(u => ({
        'الاسم': u.name,
        'الهاتف': u.phone,
        'النوع': roleMap[u.role],
        'الحالة': statusMap[u.status],
        'التوثيق': verificationMap[u.verification],
        'آخر ظهور': u.lastSeen ? new Date(u.lastSeen).toLocaleString() : 'غير معروف'
    })));
  };

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="بحث بالاسم أو الهاتف..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pr-10 h-11 rounded-xl bg-white border-slate-200" 
                />
            </div>
            <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px] h-11 rounded-xl bg-white"><SelectValue placeholder="كل الانواع" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الانواع</SelectItem>
                        <SelectItem value="user">مستخدم</SelectItem>
                        <SelectItem value="merchant">تاجر</SelectItem>
                        <SelectItem value="admin">مسؤول</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="w-[130px] h-11 rounded-xl bg-white"><SelectValue placeholder="التوثيق" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="verified">موثق</SelectItem>
                        <SelectItem value="pending">قيد المراجعة</SelectItem>
                        <SelectItem value="unverified">غير موثق</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-11 rounded-xl bg-white"><SelectValue placeholder="الحالة" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="banned">مجمد</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleCsvExport} className="h-10 rounded-xl bg-white border-slate-200">
                <FileDown className="ml-2 h-4 w-4 text-slate-400" /> تصدير
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 rounded-xl bg-white border-slate-200">
                <Printer className="ml-2 h-4 w-4 text-slate-400" /> طباعة
            </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar relative">
            <Table>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-right h-12">المستخدم</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-right h-12">نوع الحساب</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-center h-12">التوثيق</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-right h-12">الاتصال</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-xs uppercase tracking-widest text-right h-12">آخر ظهور</TableHead>
                        <TableHead className="text-left font-black text-[#1A4B84] text-xs uppercase tracking-widest h-12">إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-40 text-center text-muted-foreground font-bold italic">لا توجد نتائج مطابقة للبحث</TableCell>
                        </TableRow>
                    ) : filteredData.map(u => {
                        const isOnline = u.connectionStatus === 'متصل';
                        return (
                            <TableRow key={u.id} className={cn("hover:bg-slate-50/50 transition-colors border-b last:border-0", u.status === 'banned' && "bg-red-50/20")}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700">{u.name || 'مستخدم بدون اسم'}</span>
                                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">{u.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-black text-[#1A4B84]">
                                    {roleMap[u.role] || u.role}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0 font-bold border-none", verificationColors[u.verification])}>
                                        {verificationMap[u.verification] || u.verification}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("text-[10px] px-2 py-0 font-bold", statusColors[u.status], `hover:${statusColors[u.status]}`)}>
                                        {statusMap[u.status] || u.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("h-2 w-2 rounded-full shadow-sm", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                        <span className={cn("text-[11px] font-bold", isOnline ? "text-green-600" : "text-slate-400")}>{u.connectionStatus || 'غير متصل'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-slate-500 font-medium tabular-nums">
                                    {u.lastSeen ? new Date(u.lastSeen).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
                                </TableCell>
                                <TableCell className="text-left">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-none shadow-2xl p-2">
                                            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm" onClick={() => setSelectedUser(u)}>
                                                <Eye className="ml-2 h-4 w-4 text-[#1A4B84]" /> عرض الملف الشخصي
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className={cn("rounded-xl px-3 py-2 cursor-pointer font-bold text-sm", u.status === 'active' ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-600")}
                                                onClick={() => setUserToToggleBan(u)}
                                            >
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
      </div>

      {selectedUser && (
          <UserDetailsContent 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            onUserUpdate={(id, up) => updateRtdb(database, `/users/${id}`, up)} 
            onDeleteSession={(uid, sid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, sessionId: sid })} 
            onLogoutAllSessions={(uid) => httpsCallable(functions, 'manageUserSessions')({ userId: uid, action: 'deleteAll' })} 
            allTransactions={allTransactions} 
          />
      )}

      <AlertDialog open={!!userToToggleBan} onOpenChange={(open) => !open && setUserToToggleBan(null)}>
          <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-[#1A4B84] text-center">
                      {userToToggleBan?.status === 'active' ? 'تجميد الحساب' : 'إلغاء التجميد'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-bold text-slate-500 text-center mt-2 leading-relaxed">
                      {userToToggleBan?.status === 'active' 
                        ? `هل أنت متأكد من تجميد حساب "${userToToggleBan?.name}"؟ سيتم منعه من استخدام التطبيق فوراً.`
                        : `هل تريد إعادة تفعيل حساب "${userToToggleBan?.name}"؟ سيتمكن من الدخول واستئناف نشاطه.`
                      }
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 pt-6 flex flex-col sm:flex-row">
                  <AlertDialogCancel className="rounded-xl font-bold border-slate-200 flex-1 h-12">تراجع</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={confirmToggleBan} 
                    className={cn(
                        "rounded-xl font-black text-sm shadow-lg flex-1 h-12",
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
