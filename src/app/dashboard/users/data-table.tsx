
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Search,
  CalendarDays,
  FilterX,
  ArrowRightLeft,
} from 'lucide-react';
import type { User, Transaction } from '@/lib/types';
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

// Datatables imports
import $ from 'jquery';
import 'datatables.net-responsive-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.colVis.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-buttons/js/buttons.print.js';
import 'jszip';

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

const formatDateParts = (timestamp: number | undefined) => {
    if (!timestamp) return { day: '--', month: '--', year: '----', time: '--:--', period: '' };
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0];
    const period = date.getHours() >= 12 ? 'م' : 'ص';
    
    return {
        day,
        month,
        year,
        time: timePart,
        period: period
    };
};

const typeLabelMap: Record<string, string> = {
    'account_transfer': 'تحويل داخلي',
    'recharge_purchase': 'شراء كروت',
    'egypt_transfer': 'تحويل للجنيه',
    'egypt_home': 'وصلي للبيت',
    'egypt_wallets': 'محفظة كاش',
    'egypt_instapay': 'انستاباي',
};

const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#001F3D]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
);

const DateTimeDisplay = ({ timestamp, className }: { timestamp: number | undefined, className?: string }) => {
    const parts = formatDateParts(timestamp);
    if (!timestamp) return <span className="text-slate-300">---</span>;
    return (
        <div className={cn("flex flex-col items-start gap-0.5 tabular-nums", className)} dir="rtl">
            <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">{parts.time}</span>
                <span className="text-[10px] font-black text-slate-400">{parts.period}</span>
            </div>
            <div className="flex items-center text-[10px] text-slate-400 font-medium">
                <span>{parts.day}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{parts.month}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{parts.year}</span>
            </div>
        </div>
    );
};

function SimpleTransactionTable({ data }: { data: any[] }) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl opacity-30">
                <AlertCircle className="h-12 w-12 mb-3" />
                <p className="font-bold text-lg">لا توجد عمليات تطابق البحث</p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border overflow-hidden bg-white shadow-sm">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar relative">
                <Table>
                    <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                        <TableRow>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">رقم العملية</TableHead>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">التاريخ والوقت</TableHead>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المبلغ</TableHead>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">النوع</TableHead>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                            <TableHead className="font-black text-[#1B69FF] text-[10px] uppercase tracking-widest text-right h-12">المستلم/التفاصيل</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((tx, idx) => {
                            const isLibyan = tx.type === 'account_transfer' || tx.type === 'recharge_purchase';
                            const currency = isLibyan ? 'د.ل' : 'ج.م';
                            const amount = tx.amount || tx.amountEGP || tx.amountLYD || 0;
                            
                            return (
                                <TableRow key={tx.id || idx} className="hover:bg-slate-50/50 border-b last:border-0">
                                    <TableCell className="font-mono text-[10px] text-slate-500">{tx.id}</TableCell>
                                    <TableCell className="text-[11px] whitespace-nowrap">
                                        <DateTimeDisplay timestamp={tx.timestamp} />
                                    </TableCell>
                                    <TableCell className="text-sm font-bold">
                                        <CurrencyDisplay amount={amount} currency={currency} />
                                    </TableCell>
                                    <TableCell className="text-[11px] font-bold">
                                        {tx.methodDisplayName || tx.transferType || typeLabelMap[tx.type] || tx.type}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={cn("text-[10px] font-bold border-none", 
                                            tx.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                            tx.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                                        )}>
                                            {tx.status === 'completed' ? 'ناجح' : tx.status === 'pending' ? 'معلق' : 'مرفوض'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[11px]">
                                        {tx.recipientName ? (
                                            <>
                                                <div className="font-bold">{tx.recipientName}</div>
                                                <div className="text-slate-400 tabular-nums">{tx.recipientNumber || tx.recipientPhone}</div>
                                            </>
                                        ) : tx.cardType ? (
                                            <div className="font-bold">{tx.cardType}</div>
                                        ) : '---'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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

    const [txSearch, setTxSearch] = useState("");
    const [txType, setTxType] = useState("all");
    const [txStatus, setTxStatus] = useState("all");
    const [txMonth, setTxMonth] = useState("all");

    const idCardPlaceholder = PlaceHolderImages.find(p => p.id === 'id-card-placeholder');

    const getImageUrl = (urlOrPlaceholder: string | null | undefined): string | null => {
        if (!urlOrPlaceholder) return null;
        try { new URL(urlOrPlaceholder); return urlOrPlaceholder; } catch (_) {
            if (urlOrPlaceholder === 'id-card-placeholder' && idCardPlaceholder) return idCardPlaceholder.imageUrl;
        }
        return null;
    }

    const frontImageUrl = getImageUrl(user.idImageUrl);

    const filteredUserTransactions = useMemo(() => {
        return allTransactions.filter(t => {
            const isRelated = t.userId === user.id || (t as any).senderId === user.id || (t as any).recipientId === user.id;
            if (!isRelated) return false;

            const matchesSearch = txSearch === "" || 
                t.id.toLowerCase().includes(txSearch.toLowerCase()) ||
                ((t as any).recipientName?.toLowerCase().includes(txSearch.toLowerCase())) ||
                ((t as any).recipientNumber?.includes(txSearch)) ||
                ((t as any).recipientPhone?.includes(txSearch));

            const matchesType = txType === "all" || t.type === txType;
            const matchesStatus = txStatus === "all" || t.status === txStatus;
            const matchesMonth = txMonth === "all" || (new Date(t.timestamp).getMonth() + 1).toString() === txMonth;

            return matchesSearch && matchesType && matchesStatus && matchesMonth;
        }).sort((a, b) => b.timestamp - a.timestamp);
    }, [user.id, allTransactions, txSearch, txType, txStatus, txMonth]);

    const sessions = useMemo(() => {
        if (!user.sessions) return [];
        return Object.entries(user.sessions).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.lastUpdate - a.lastUpdate);
    }, [user.sessions]);

    useEffect(() => { if (user) setName(user.name); }, [user]);

    const months = [
        { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
        { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
        { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
        { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col overflow-hidden animate-in fade-in-0 duration-300" dir="rtl">
            <div className="flex items-center justify-between p-4 md:px-10 border-b bg-white sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-2xl">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-right">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-[200px] font-bold rounded-xl"/>
                                <Button size="sm" onClick={() => { onUserUpdate(user.id, { name }); setIsEditingName(false); toast({ title: "تم التحديث" }); }}>حفظ</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-[#001F3D]">{user.name}</h1>
                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40 hover:opacity-100" onClick={() => setIsEditingName(true)}><Pencil className="h-3.5 w-3.5" /></Button>
                            </div>
                        )}
                        <div className="flex items-center gap-3 justify-start">
                            <Badge className={cn(statusColors[user.status], "text-[9px] font-black h-5 border-none shadow-none")}>{statusMap[user.status]}</Badge>
                            <span className="text-xs font-bold text-slate-400 tabular-nums">{user.phone}</span>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        <Card className="rounded-[2.5rem] border shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4 flex flex-row items-center justify-start gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base text-[#001F3D] font-black">الأرصدة والمحفظة</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6 text-right">
                                <div className="flex flex-col items-start w-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد الليبي</span>
                                    <CurrencyDisplay amount={user.balanceLYD} currency="د.ل" colorClass="text-green-600 text-3xl" />
                                </div>
                                <div className="flex flex-col items-start w-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الرصيد المصري</span>
                                    <CurrencyDisplay amount={user.balanceEGP} currency="ج.م" colorClass="text-[#1B69FF] text-3xl" />
                                </div>
                                <div className="flex flex-col items-start w-full">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المصري المعلق</span>
                                    <CurrencyDisplay amount={user.balanceEgyptianPending} currency="ج.م" colorClass="text-slate-400 text-3xl" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border shadow-sm bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b py-4 flex flex-row items-center justify-start gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base text-[#001F3D] font-black">معلومات الحساب</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                    <span className="text-sm font-bold text-slate-500">تاريخ فتح الحساب</span>
                                    <DateTimeDisplay timestamp={user.createdAt} className="text-sm font-bold text-[#1B69FF]" />
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                    <span className="text-sm font-bold text-slate-500">آخر تغيير لكلمة المرور</span>
                                    <DateTimeDisplay timestamp={user.lastPasswordChange} className="text-sm font-bold text-[#1B69FF]" />
                                </div>
                                <div className="flex items-center justify-between pb-2">
                                    <span className="text-sm font-bold text-slate-500">آخر تغيير للرقم السري</span>
                                    <DateTimeDisplay timestamp={user.lastPinChange} className="text-sm font-bold text-[#1B69FF]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        <Card className="rounded-[2.5rem] border shadow-sm bg-white overflow-hidden flex flex-col h-full">
                            <CardHeader className="bg-slate-50/50 border-b py-4 flex flex-row items-center justify-start gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base text-[#001F3D] font-black">إثبات الهوية</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6 text-right flex-1 flex flex-col justify-between">
                                <div className="space-y-2 flex-1">
                                    <span className="text-[10px] font-black text-slate-400 block mb-2 uppercase">صورة الهوية الرسمية</span>
                                    <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-100 bg-slate-50 flex items-center justify-center">
                                        {frontImageUrl ? (
                                            <a href={frontImageUrl} target="_blank" rel="noopener noreferrer" className="relative w-full h-full block">
                                                <Image src={frontImageUrl} alt="Identity Front" fill className="object-contain p-1 rounded-2xl" />
                                            </a>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="h-8 w-8 text-slate-200" />
                                                <span className="text-xs font-bold text-slate-300 italic">الصورة غير متوفرة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                    <Button 
                                        variant="outline" 
                                        className={cn(
                                            "flex-1 h-12 rounded-2xl font-black text-xs border-2 shadow-sm transition-all",
                                            user.verification === 'verified' ? "text-red-600 border-red-50 hover:bg-red-50" : "text-blue-600 border-blue-50 hover:bg-blue-50"
                                        )}
                                        onClick={() => onUserUpdate(user.id, { verification: user.verification === 'verified' ? 'unverified' : 'verified' })}
                                    >
                                        {user.verification === 'verified' ? "إلغاء التوثيق" : "توثيق الحساب"}
                                    </Button>
                                    <Button 
                                        className="flex-1 h-12 rounded-2xl font-black text-xs bg-primary text-white shadow-xl shadow-primary/20 gap-2"
                                        onClick={() => toast({ title: "خاصية قيد التطوير", description: "سيتم إضافة ميزة التحويل المباشر قريباً." })}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                        تحويل لتاجر أو مستخدم
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border shadow-sm bg-white overflow-hidden flex flex-col h-full">
                            <CardHeader className="bg-slate-50/50 border-b py-4 flex flex-row items-center justify-start gap-2">
                                <Smartphone className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base text-[#001F3D] font-black">الجلسات والأجهزة النشطة</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ maxHeight: '320px' }}>
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white z-10">
                                            <TableRow className="border-none hover:bg-transparent text-right">
                                                <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase">الجهاز</TableHead>
                                                <TableHead className="text-center font-black text-slate-400 text-[10px] uppercase">الحالة</TableHead>
                                                <TableHead className="text-left font-black text-slate-400 text-[10px] uppercase">إجراء</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessions.length === 0 ? (
                                                <TableRow><TableCell colSpan={3} className="h-32 text-center text-slate-300 font-bold italic text-sm">لا توجد أجهزة نشطة حالياً</TableCell></TableRow>
                                            ) : sessions.map(s => (
                                                <TableRow key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                    <TableCell className="text-right py-4">
                                                        <div className="font-black text-xs text-[#001F3D]">{s.activeDevice}</div>
                                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.phoneOS}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={cn("text-[9px] font-black h-6 border-none px-2.5", connectionStatusColors[s.connectionStatus])}>
                                                            {s.connectionStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-600 gap-1.5" onClick={() => onDeleteSession(user.id, s.id)}>
                                                            <LogOut className="h-3.5 w-3.5" /> <span className="text-[10px] font-black uppercase">إنهاء</span>
                                                        </Button>
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

                    <Card className="rounded-[2.5rem] border shadow-sm bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <Activity className="h-6 w-6 text-primary" />
                                <div className="text-right">
                                    <CardTitle className="text-xl font-black text-[#001F3D]">سجل عمليات المستخدم</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-400 mt-1">إدارة وبحث وتصفية كافة العمليات المالية</CardDescription>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 min-w-[200px] md:max-w-xs">
                                    <Search className="absolute right-3 top-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="بحث برقم العملية أو المستلم..." 
                                        value={txSearch} 
                                        onChange={(e) => setTxSearch(e.target.value)} 
                                        className="pr-10 h-10 rounded-xl bg-white border-slate-200 text-xs text-right" 
                                    />
                                </div>
                                <Select value={txType} onValueChange={setTxType}>
                                    <SelectTrigger className="w-[130px] h-10 rounded-xl bg-white text-xs"><SelectValue placeholder="نوع العملية" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                        <SelectItem value="all">كل الأنواع</SelectItem>
                                        <SelectItem value="account_transfer">تحويل داخلي</SelectItem>
                                        <SelectItem value="recharge_purchase">شراء كروت</SelectItem>
                                        <SelectItem value="egypt_transfer">تحويل للجنيه</SelectItem>
                                        <SelectItem value="egypt_wallets">محفظة كاش</SelectItem>
                                        <SelectItem value="egypt_instapay">انستاباي</SelectItem>
                                        <SelectItem value="egypt_home">وصلي للبيت</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={txStatus} onValueChange={setTxStatus}>
                                    <SelectTrigger className="w-[110px] h-10 rounded-xl bg-white text-xs"><SelectValue placeholder="الحالة" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                        <SelectItem value="all">كل الحالات</SelectItem>
                                        <SelectItem value="completed">ناجحة</SelectItem>
                                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                                        <SelectItem value="failed">مرفوضة</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={txMonth} onValueChange={setTxMonth}>
                                    <SelectTrigger className="w-[110px] h-10 rounded-xl bg-white text-xs"><SelectValue placeholder="الشهر" /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl z-[200]">
                                        <SelectItem value="all">كل الأشهر</SelectItem>
                                        {months.map(m => (
                                            <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-primary" onClick={() => { setTxSearch(""); setTxType("all"); setTxStatus("all"); setTxMonth("all"); }}>
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <SimpleTransactionTable data={filteredUserTransactions} />
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
  const [tableKey, setTableKey] = useState(0);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const { database } = useDatabase();
  const { toast } = useToast();
  const functions = useFunctions();

  const filteredData = useMemo(() => {
    return (initialData || []).filter(u => 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone?.includes(searchTerm)) && 
        (roleFilter === 'all' || u.role === roleFilter) &&
        (statusFilter === 'all' || u.status === statusFilter) &&
        (verificationFilter === 'all' || u.verification === verificationFilter)
    );
  }, [initialData, searchTerm, roleFilter, statusFilter, verificationFilter]);

  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [filteredData]);

  useEffect(() => {
    if (!tableRef.current || !document.body.contains(tableRef.current)) return;
    
    const timer = setTimeout(() => {
        if (!tableRef.current || !document.body.contains(tableRef.current)) return;
        $(tableRef.current).DataTable({
          responsive: true,
          dom: "<'flex items-center justify-end px-4 py-2 gap-2'B>t<'border-t mt-4 flex items-center justify-between px-4 py-2'i p>",
          buttons: [
              { extend: 'copy', text: 'نسخ', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'csv', text: 'CSV', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' },
              { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-bold' }
          ],
          language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
          pageLength: 100,
          lengthMenu: [10, 25, 50, 100],
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
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-sm:w-full">
                <Search className="absolute right-3 top-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="بحث بالاسم أو الهاتف..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pr-10 h-11 rounded-xl bg-white border-slate-200 text-right" 
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
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar relative">
            <Table key={tableKey} ref={tableRef}>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-right h-12">المستخدم</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-right h-12">نوع الحساب</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-center h-12">التوثيق</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-right h-12">الاتصال</TableHead>
                        <TableHead className="font-black text-[#001F3D] text-xs uppercase tracking-widest text-right h-12">آخر ظهور</TableHead>
                        <TableHead className="text-left font-black text-[#001F3D] text-xs uppercase tracking-widest h-12">إجراءات</TableHead>
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
                                <TableCell className="text-right">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700">{u.name || 'مستخدم بدون اسم'}</span>
                                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">{u.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm font-black text-[#001F3D] text-right">
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
                                <TableCell className="text-right">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span className={cn("h-2 w-2 rounded-full shadow-sm", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                        <span className={cn("text-[11px] font-bold", isOnline ? "text-green-600" : "text-slate-400")}>{u.connectionStatus || 'غير متصل'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-slate-500 font-medium tabular-nums whitespace-nowrap">
                                    <DateTimeDisplay timestamp={u.lastSeen ? new Date(u.lastSeen).getTime() : undefined} />
                                </TableCell>
                                <TableCell className="text-left">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-none shadow-2xl p-2">
                                            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm" onClick={() => setSelectedUser(u)}>
                                                <Eye className="ml-2 h-4 w-4 text-[#1B69FF]" /> عرض الملف الشخصي
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
          <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md" dir="rtl">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black text-[#001F3D] text-center">
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
