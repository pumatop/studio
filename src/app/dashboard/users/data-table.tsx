
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  UserCheck,
  UserX,
  Wallet,
  FileText,
  CheckCircle,
  XCircle,
  UserCog,
  ShieldCheck,
  Smartphone,
  LogOut,
  FilterX,
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

// استيراد ديناميكي مع تعطيل SSR لتجنب مشاكل jQuery على السيرفر
const LibyanTransactionsDataTable = dynamic(
  () => import('../libyan-transactions/data-table').then(m => m.LibyanTransactionsDataTable),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

const EgyptianTransfersDataTable = dynamic(
  () => import('../egyptian-transactions/data-table').then(m => m.EgyptianTransfersDataTable),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

// Maps for UI display
const verificationMap: Record<User["verification"], string> = {
  "verified": "موثق",
  "unverified": "غير موثق",
  "pending": "قيد المراجعة",
};

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

const verificationStatusColors: Record<User["verification"], string> = {
  "verified": "bg-green-100 text-green-800",
  "unverified": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const connectionStatusColors: Record<UserSession["connectionStatus"], string> = {
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

const statusColors: Record<User['status'], string> = {
  "active": "bg-green-100 text-green-800",
  "banned": "bg-red-100 text-red-800",
};

function UserDetailsDialog({ user, open, onOpenChange, onUserUpdate, onDeleteSession, onLogoutAllSessions, allTransactions, transactionsLoading }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: (userId: string, updates: Partial<User>) => void, onDeleteSession: (userId: string, sessionId: string) => void, onLogoutAllSessions: (userId: string) => void, allTransactions: Transaction[], transactionsLoading: boolean }) {
    const { toast } = useToast();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [confirmation, setConfirmation] = useState<{ action: 'delete-session', sessionId: string } | { action: 'logout-all' } | null>(null);

    const dateTimeFormat: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true };

    const idCardPlaceholder = PlaceHolderImages.find(p => p.id === 'id-card-placeholder');

    const getImageUrl = (urlOrPlaceholder: string | null | undefined): string | null => {
        if (!urlOrPlaceholder) return null;
        try {
            new URL(urlOrPlaceholder);
            return urlOrPlaceholder;
        } catch (_) {
            if (urlOrPlaceholder === 'id-card-placeholder' && idCardPlaceholder) {
                return idCardPlaceholder.imageUrl;
            }
        }
        return null;
    }

    const frontImageUrl = getImageUrl(user?.idImageUrl);
    const backImageUrl = getImageUrl(user?.idImageBackUrl);
    const otherImageUrl = getImageUrl(user?.idImageOtherUrl);

    const userFinancialTransactions = useMemo(() => {
        if (!user || !allTransactions) return [];
        return allTransactions.filter(t => 
            (t.type === 'account_transfer' && (t.senderId === user.id || t.recipientId === user.id)) ||
            (t.type === 'egypt_transfer' && t.userId === user.id)
        );
    }, [user, allTransactions]);
    
    const userEgyptianTransactions = useMemo(() => {
        if (!user || !allTransactions) return [];
        return allTransactions.filter((t): t is EgyptTransferTransaction => 
            t.type === 'egypt_transfer' && t.userId === user.id
        );
    }, [user, allTransactions]);

    const sessions: (UserSession & { id: string })[] = useMemo(() => {
        if (!user) return [];
        if (user.sessions) {
            return Object.entries(user.sessions)
                .map(([id, sessionData]) => ({ id, ...sessionData }))
                .sort((a, b) => b.lastUpdate - a.lastUpdate);
        }
        return [];
    }, [user]);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);
    
    const handleLogoutSession = (sessionId: string) => {
        if (!user) return;
        onDeleteSession(user.id, sessionId);
    };

    if (!user) {
        return null;
    }
    
    const handleVerification = async (newStatus: User['verification']) => {
        if (!user) return;
        const updates: Partial<User> = { verification: newStatus };
        if (newStatus === 'verified') {
            updates.idImageBackUrl = null;
            updates.idImageOtherUrl = null;
            await onUserUpdate(user.id, updates);
            toast({ 
                title: "تم توثيق الحساب بنجاح",
                description: "تم تحديث الحالة بنجاح.",
            });
        } else if (newStatus === 'unverified') {
            updates.idImageUrl = null;
            updates.idImageBackUrl = null;
            updates.idImageOtherUrl = null;
            await onUserUpdate(user.id, updates);
            toast({ 
                title: "تم إلغاء توثيق الحساب", 
                variant: "destructive",
            });
        } else {
            await onUserUpdate(user.id, { verification: newStatus });
            toast({ title: "حالة التوثيق تم تحديثها" });
        }
    }

    const handleTypeChange = async (newType: User['role']) => {
        await onUserUpdate(user.id, { role: newType });
        toast({ title: "نوع المستخدم تم تحديثه" });
    }

    const handleNameSave = async () => {
        if (name.trim() === '') {
            toast({ title: "خطأ", description: "اسم المستخدم لا يمكن أن يكون فارغاً.", variant: "destructive" });
            return;
        }
        await onUserUpdate(user.id, { name });
        toast({ title: "تم تحديث اسم المستخدم بنجاح" });
        setIsEditingName(false);
    }

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setName(user.name);
    }
    
    const handleLogoutAll = () => {
        if (!user) return;
        onLogoutAllSessions(user.id);
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) { setIsEditingName(false); } onOpenChange(o); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="تعديل اسم المستخدم" className="h-9"/>
                        <Button size="sm" onClick={handleNameSave}>حفظ</Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>إلغاء</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <DialogTitle>{user.name}</DialogTitle>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingName(true)}><Pencil className="h-4 w-4" /><span className="sr-only">تعديل الاسم</span></Button>
                        </div>
                    )}
                    <DialogDescription>تفاصيل المستخدم الكاملة ({user.phone})</DialogDescription>
                </DialogHeader>
                 <AlertDialog open={!!confirmation} onOpenChange={(open) => !open && setConfirmation(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle><AlertDialogDescription>{confirmation?.action === 'delete-session' ? 'سيتم إنهاء هذه الجلسة وتسجيل خروج المستخدم من هذا الجهاز.' : 'سيتم تسجيل خروج المستخدم من جميع الأجهزة النشطة.'}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel onClick={() => setConfirmation(null)}>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirmation?.action === 'delete-session' && confirmation.sessionId) { handleLogoutSession(confirmation.sessionId); } else if (confirmation?.action === 'logout-all') { handleLogoutAll(); } setConfirmation(null); }}>نعم، متابعة</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Wallet /> الأرصدة</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>الرصيد الليبي:</span> <span className="font-semibold">{(user.balanceLYD || 0).toFixed(2)} د.ل</span></div>
                                <div className="flex justify-between"><span>الرصيد المصري:</span> <span className="font-semibold">{(user.balanceEGP || 0).toFixed(2)} ج.م</span></div>
                                <div className="flex justify-between text-muted-foreground"><span>المصري المعلق:</span> <span className="font-semibold">{(user.balanceEgyptianPending || 0).toFixed(2)} ج.م</span></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText /> التوثيق</CardTitle></CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">صورة الهوية (الأمامية)</h4>
                                    {frontImageUrl ? (
                                        <a href={frontImageUrl} target="_blank" rel="noopener noreferrer"><Image src={frontImageUrl} alt="صورة الهوية" width={600} height={400} className="rounded-md object-contain border bg-muted/20" /></a>
                                    ) : (
                                        <div className="aspect-video rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50"><p className="text-sm text-muted-foreground">غير متوفرة</p></div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => handleVerification('verified')}><CheckCircle className="ml-2" /> توثيق</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleVerification('unverified')}><XCircle className="ml-2" /> إلغاء</Button>
                                    <Button size="sm" variant="secondary" className="col-span-2" onClick={() => handleTypeChange(user.role === 'user' ? 'merchant' : 'user')}><UserCog className="ml-2" /> تحويل إلى {user.role === 'user' ? 'تاجر' : 'مستخدم'}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Smartphone /> الجلسات</CardTitle></CardHeader>
                            <CardContent>
                                {sessions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader><TableRow><TableHead>الجهاز</TableHead><TableHead>آخر ظهور</TableHead><TableHead>الحالة</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {sessions.map((session) => (
                                                    <TableRow key={session.id} className="even:bg-muted/20"><TableCell><div className="font-medium">{session.activeDevice}</div></TableCell><TableCell className="text-xs">{new Date(session.lastUpdate).toLocaleString('ar-EG-u-nu-latn', dateTimeFormat)}</TableCell><TableCell><Badge className={cn(connectionStatusColors[session.connectionStatus])}>{session.connectionStatus}</Badge></TableCell><TableCell className="text-left"><Button variant="ghost" size="sm" onClick={() => setConfirmation({ action: 'delete-session', sessionId: session.id })}>إنهاء</Button></TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (<p className="text-sm text-muted-foreground text-center py-4">لا توجد جلسات.</p>)}
                            </CardContent>
                        </Card>
                        <Tabs defaultValue="libyan">
                            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="libyan">سجل المعاملات (د.ل)</TabsTrigger><TabsTrigger value="egyptian">سجل التحويلات (ج.م)</TabsTrigger></TabsList>
                            <TabsContent value="libyan"><Card><CardContent className="pt-6">{userFinancialTransactions.length > 0 ? <LibyanTransactionsDataTable initialData={userFinancialTransactions} showExchangeRate={false} /> : <p className="text-center text-sm">لا يوجد سجل.</p>}</CardContent></Card></TabsContent>
                            <TabsContent value="egyptian"><Card><CardContent className="pt-6">{userEgyptianTransactions.length > 0 ? <EgyptianTransfersDataTable initialData={userEgyptianTransactions} /> : <p className="text-center text-sm">لا يوجد سجل.</p>}</CardContent></Card></TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function UsersDataTable({ initialData, allTransactions, transactionsLoading }: { initialData: User[], allTransactions: Transaction[], transactionsLoading: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { database } = useDatabase();
  const functions = useFunctions();
  const tableRef = useRef<HTMLTableElement>(null);
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [connectionStatusFilter, setConnectionStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getLatestSessionInfo = (user: User) => {
    if (user.sessions) {
      const sessions = Object.values(user.sessions);
      if (sessions.length > 0) {
        return sessions.sort((a, b) => b.lastUpdate - a.lastUpdate)[0];
      }
    }
    return {
      connectionStatus: user.connectionStatus || 'غير متصل',
      lastUpdate: user.lastUpdate || user.createdAt,
    };
  };

  const filteredData = useMemo(() => {
    if (!initialData) return [];
    return initialData.filter(
      (user) => {
        const latestSession = getLatestSessionInfo(user);
        return ((user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone || '').includes(searchTerm)) &&
        (roleFilter === 'all' || user.role === roleFilter) &&
        (connectionStatusFilter === 'all' || latestSession.connectionStatus === connectionStatusFilter) &&
        (verificationFilter === 'all' || user.verification === verificationFilter) &&
        (statusFilter === 'all' || user.status === statusFilter)
      }
    );
  }, [initialData, searchTerm, roleFilter, connectionStatusFilter, verificationFilter, statusFilter]);

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
          { extend: 'excel', text: 'Excel', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' },
          { extend: 'print', text: 'طباعة', className: 'border bg-card hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm' }
        ],
        language: { url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Arabic.json' },
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
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
  
  const handleToggleBan = async (userId: string, currentStatus: User['status']) => {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      if (!window.confirm(`هل أنت متأكد من تغيير الحالة؟`)) return;
      try {
          await updateRtdb(database, `/users/${userId}`, { status: newStatus });
          toast({ title: "تم التحديث بنجاح" });
      } catch (e: any) {
          toast({ title: "حدث خطأ", variant: 'destructive' });
      }
  }
  
  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    try {
        await updateRtdb(database, `/users/${userId}`, updates);
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => prev ? {...prev, ...updates} : null);
        }
    } catch(e: any) {
        toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const handleDeleteSession = async (userId: string, sessionId: string) => {
    try {
      const manageUserSessions = httpsCallable(functions, 'manageUserSessions');
      await manageUserSessions({ userId, sessionId });
      toast({ title: "تم إنهاء الجلسة بنجاح" });
    } catch (e: any) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleLogoutAllSessions = async (userId: string) => {
    try {
      const manageUserSessions = httpsCallable(functions, 'manageUserSessions');
      await manageUserSessions({ userId, action: 'deleteAll' });
      toast({ title: "تم تسجيل الخروج من جميع الأجهزة" });
    } catch (e: any) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  };

  const handleClearFilters = () => {
    setRoleFilter("all");
    setConnectionStatusFilter("all");
    setVerificationFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            <Input placeholder="ابحث بالاسم أو الرقم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-sm" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-[150px]"><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="merchant">تاجر</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}><FilterX className="ml-2 h-4 w-4" />مسح</Button>
          </div>
      </div>
      <div className="rounded-lg border">
        <Table ref={tableRef} className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => {
              const latestSession = getLatestSessionInfo(user);
              return (
                <TableRow key={user.id} className={cn('even:bg-muted/20', user.status === 'banned' && 'bg-red-50/50 opacity-60')}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{roleMap[user.role]}</TableCell>
                  <TableCell><Badge className={cn(statusColors[user.status])}>{statusMap[user.status]}</Badge></TableCell>
                  <TableCell><Badge className={cn(verificationStatusColors[user.verification])}>{verificationMap[user.verification]}</Badge></TableCell>
                  <TableCell className="text-left">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailsOpen(true); }}><Eye className="ml-2 h-4 w-4" /><span>تفاصيل</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleBan(user.id, user.status)} className="text-destructive">{user.status === 'banned' ? 'رفع الحظر' : 'حظر'}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
       <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setDetailsOpen} onUserUpdate={handleUserUpdate} onDeleteSession={handleDeleteSession} onLogoutAllSessions={handleLogoutAllSessions} allTransactions={allTransactions} transactionsLoading={transactionsLoading} />
    </div>
  );
}
