
"use client";

import { useUser, useRtdbObject, useDatabase, updateRtdb, useAuth } from "@/firebase";
import type { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, Wallet, CalendarDays, FileText, ArrowRight, 
    User as UserIcon, Smartphone, AlertCircle, Lock, KeyRound, 
    Pencil, Save, Loader2 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from "@/lib/utils";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const roleMap: Record<string, string> = {
    "user": "مستخدم",
    "merchant": "تاجر",
    "admin": "مسؤول",
    "superadmin": "مسؤول خارق",
};

const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#001F3D]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
);

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
                <span className="font-bold text-slate-700 dark:text-slate-300">{timePart}</span>
                <span className="text-[10px] font-black text-slate-400">{period}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
                <span>{day}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{month}</span>
                <span className="mx-0.5 opacity-40">/</span>
                <span>{year}</span>
            </div>
        </div>
    );
};

export default function ProfilePage() {
    const auth = useAuth();
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const { database } = useDatabase();
    const { data: user, isLoading: isUserLoading } = useRtdbObject<User>(authUser ? `/users/${authUser.uid}` : null);
    const { toast } = useToast();

    // Edit Name States
    const [newName, setNewName] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

    // Change Password States
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);

    // Change PIN States
    const [newPin, setNewPin] = useState("");
    const [isUpdatingPin, setIsUpdatingPin] = useState(false);
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);

    useEffect(() => {
        if (user) setNewName(user.name || "");
    }, [user]);

    const handleUpdateName = async () => {
        if (!authUser || !newName.trim()) return;
        setIsUpdatingName(true);
        try {
            await updateRtdb(database, `/users/${authUser.uid}`, { 
                name: newName.trim(), 
                lastUpdate: Date.now() 
            });
            toast({ title: "تم تحديث الاسم بنجاح" });
            setIsNameDialogOpen(false);
        } catch (e: any) {
            toast({ title: "خطأ", description: e.message, variant: "destructive" });
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleChangePassword = async () => {
        if (!auth.currentUser || !authUser?.email) return;
        if (passwords.new !== passwords.confirm) {
            toast({ title: "خطأ", description: "كلمات المرور الجديدة غير متطابقة", variant: "destructive" });
            return;
        }
        
        setIsUpdatingPassword(true);
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(authUser.email, passwords.current);
            await reauthenticateWithCredential(auth.currentUser, credential);
            
            // Update password
            await updatePassword(auth.currentUser, passwords.new);
            
            // Log timestamp in RTDB
            await updateRtdb(database, `/users/${authUser.uid}`, { 
                lastPasswordChange: Date.now(),
                lastUpdate: Date.now()
            });

            toast({ title: "تم تغيير كلمة المرور بنجاح" });
            setIsPassDialogOpen(false);
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (e: any) {
            let msg = "فشل تغيير كلمة المرور.";
            if (e.code === 'auth/wrong-password') msg = "كلمة المرور الحالية غير صحيحة.";
            toast({ title: "خطأ", description: msg, variant: "destructive" });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleChangePin = async () => {
        if (!authUser || newPin.length !== 6) {
            toast({ title: "خطأ", description: "الرقم السري يجب أن يتكون من 6 أرقام", variant: "destructive" });
            return;
        }
        setIsUpdatingPin(true);
        try {
            await updateRtdb(database, `/users/${authUser.uid}`, { 
                pin: newPin,
                lastPinChange: Date.now(),
                lastUpdate: Date.now()
            });
            toast({ title: "تم تحديث الرقم السري (PIN) بنجاح" });
            setIsPinDialogOpen(false);
            setNewPin("");
        } catch (e: any) {
            toast({ title: "خطأ", description: e.message, variant: "destructive" });
        } finally {
            setIsUpdatingPin(false);
        }
    };

    const isLoading = isAuthLoading || isUserLoading;
    const idCardPlaceholder = PlaceHolderImages.find(p => p.id === 'id-card-placeholder');

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse" dir="rtl">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-[2.5rem]" />
                    <Skeleton className="h-64 rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" dir="rtl">
                <AlertCircle className="h-16 w-16 text-slate-200 mb-4" />
                <h2 className="text-xl font-black text-slate-400">عذراً، لم يتم العثور على بيانات الملف الشخصي.</h2>
                <Link href="/dashboard" className="mt-6 text-primary font-bold flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> العودة للرئيسية
                </Link>
            </div>
        );
    }

    const frontImageUrl = user.idImageUrl === 'id-card-placeholder' ? idCardPlaceholder?.imageUrl : user.idImageUrl;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-10" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card p-8 rounded-[2.5rem] shadow-sm border border-border/10">
                <div className="flex items-center gap-6 text-right w-full">
                    <div className="p-4 bg-primary/10 rounded-[2rem]">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-[#001F3D] dark:text-foreground">{user.name}</h1>
                        <div className="flex items-center gap-3 mt-2 justify-start">
                            <Badge className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-black text-[10px] px-3 py-0.5 border-none">
                                {roleMap[user.role] || user.role}
                            </Badge>
                            <span className="text-sm font-bold text-slate-400 tabular-nums">{user.phone}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold gap-2 bg-card border-primary/10 hover:bg-primary/5">
                                <Pencil className="h-4 w-4" /> تعديل الاسم
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 bg-card">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground text-right">تعديل الاسم المستعار</DialogTitle>
                                <DialogDescription className="text-right font-bold">سيظهر هذا الاسم في كافة سجلات العمليات والتقارير.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="edit-name" className="font-bold text-slate-500">الاسم الجديد</Label>
                                    <Input 
                                        id="edit-name" 
                                        value={newName} 
                                        onChange={e => setNewName(e.target.value)} 
                                        placeholder="أدخل اسمك الكامل"
                                        className="h-12 rounded-xl text-right font-bold bg-background dark:bg-slate-900 border-primary/10"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="mt-6 gap-3 flex-row-reverse">
                                <Button 
                                    onClick={handleUpdateName} 
                                    disabled={isUpdatingName}
                                    className="rounded-xl h-12 px-8 font-black bg-primary shadow-lg shadow-primary/20"
                                >
                                    {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                                    حفظ التغييرات
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold">إلغاء</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    <Button asChild variant="ghost" className="rounded-2xl h-12 px-6 font-bold gap-2 text-slate-400 hover:text-primary">
                        <Link href="/dashboard">
                            <ArrowRight className="h-4 w-4" /> العودة للرئيسية
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Financial & Security */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-3">
                                <Wallet className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base font-black">المحفظة المالية</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الرصيد الليبي</span>
                                    <CurrencyDisplay amount={user.balanceLYD} currency="د.ل" colorClass="text-green-600 text-3xl" />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الرصيد المصري</span>
                                    <CurrencyDisplay amount={user.balanceEGP} currency="ج.م" colorClass="text-[#1B69FF] text-3xl" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-3 text-red-600">
                                <Lock className="h-5 w-5 text-inherit" />
                                <CardTitle className="text-base font-black">إعدادات الأمان</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                <Dialog open={isPassDialogOpen} onOpenChange={setIsPassDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold justify-start gap-3 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900">
                                            <KeyRound className="h-4 w-4 text-primary" /> تغيير كلمة المرور
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground text-right">تحديث كلمة المرور</DialogTitle>
                                            <DialogDescription className="text-right font-bold">يرجى إدخال كلمة المرور الحالية لتأكيد الهوية.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4 text-right">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-slate-500">كلمة المرور الحالية</Label>
                                                <Input 
                                                    type="password" 
                                                    value={passwords.current} 
                                                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                                                    className="h-12 rounded-xl text-right bg-background dark:bg-slate-900"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold text-slate-500">كلمة المرور الجديدة</Label>
                                                <Input 
                                                    type="password" 
                                                    value={passwords.new} 
                                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                                    className="h-12 rounded-xl text-right bg-background dark:bg-slate-900"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold text-slate-500">تأكيد كلمة المرور</Label>
                                                <Input 
                                                    type="password" 
                                                    value={passwords.confirm} 
                                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                                    className="h-12 rounded-xl text-right bg-background dark:bg-slate-900"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-6 flex-row-reverse gap-2">
                                            <Button onClick={handleChangePassword} disabled={isUpdatingPassword} className="rounded-xl h-12 px-8 font-black bg-primary">
                                                {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحديث كلمة المرور"}
                                            </Button>
                                            <DialogClose asChild><Button variant="ghost" className="rounded-xl h-12">إلغاء</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold justify-start gap-3 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900">
                                            <ShieldCheck className="h-4 w-4 text-green-600" /> تغيير الرقم السري (PIN)
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground text-right">تغيير الرقم السري (PIN)</DialogTitle>
                                            <DialogDescription className="text-right font-bold">يستخدم هذا الرقم المكون من 6 خانات لتأكيد التحويلات المالية.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4 text-right">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-slate-500">الرقم السري الجديد</Label>
                                                <Input 
                                                    type="text" 
                                                    maxLength={6}
                                                    value={newPin} 
                                                    onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                                                    placeholder="مثال: 123456"
                                                    className="h-12 rounded-xl text-center font-black text-2xl tracking-[0.5em] bg-background dark:bg-slate-900 tabular-nums"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-6 flex-row-reverse gap-2">
                                            <Button onClick={handleChangePin} disabled={isUpdatingPin} className="rounded-xl h-12 px-8 font-black bg-primary">
                                                {isUpdatingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الرقم الجديد"}
                                            </Button>
                                            <DialogClose asChild><Button variant="ghost" className="rounded-xl h-12">إلغاء</Button></DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-3">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-black">الجلسات النشطة</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {user.sessions ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(user.sessions).map(([id, session]) => (
                                        <div key={id} className="flex items-center justify-between p-4 rounded-2xl border dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <div className="flex items-center gap-4 text-right">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                    <Smartphone className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-[#001F3D] dark:text-foreground">{session.activeDevice}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{session.phoneOS} • {session.ipAddress}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[9px] font-black border-none px-3",
                                                session.connectionStatus === 'متصل' ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                                            )}>
                                                {session.connectionStatus}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-slate-400 font-bold italic py-10">لا توجد سجلات جلسات حالية.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: ID & Verification */}
                <div className="space-y-8">
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-black">إثبات الهوية</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border-2 border-dashed dark:border-white/10 border-slate-100 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                {frontImageUrl ? (
                                    <Image 
                                        src={frontImageUrl} 
                                        alt="Identity Front" 
                                        fill 
                                        className="object-contain p-2 rounded-2xl"
                                        data-ai-hint="ID card"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <UserIcon className="h-12 w-12" />
                                        <span className="text-xs font-bold">الصورة غير متوفرة</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-primary/10 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">حالة التوثيق</p>
                                <p className="text-lg font-black text-[#001F3D] dark:text-foreground">
                                    {user.verification === 'verified' ? "حساب موثق وآمن" : "قيد انتظار التوثيق"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-6 flex flex-row items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-black">تواريخ هامة</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-50 dark:border-white/5 pb-4">
                                <span className="text-sm font-bold text-slate-500">تاريخ الانضمام</span>
                                <DateTimeDisplay timestamp={user.createdAt} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">آخر تحديث للملف</span>
                                <DateTimeDisplay timestamp={user.lastUpdate} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
