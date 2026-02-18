"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import type { User, Transaction, EgyptTransferTransaction, AccountTransferTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatabase, updateRtdb, useRtdbList } from "@/firebase";
import { LibyanTransactionsDataTable } from "../libyan-transactions/data-table";
import { EgyptianTransfersDataTable } from "../egyptian-transactions/data-table";

const verificationStatusColors: Record<User["verification"], string> = {
  "verified": "bg-green-100 text-green-800",
  "unverified": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const verificationStatusMap: Record<User["verification"], string> = {
  "verified": "موثق",
  "unverified": "غير موثق",
  "pending": "قيد المراجعة",
};

const statusColors: Record<User["status"], string> = {
    "active": "bg-green-100 text-green-800",
    "inactive": "bg-stone-100 text-stone-800",
    "banned": "bg-red-100 text-red-800",
};

const statusMap: Record<User["status"], string> = {
    "active": "نشط",
    "inactive": "غير نشط",
    "banned": "محظور",
};

const connectionStatusColors: Record<User["connectionStatus"], string> = {
    "متصل": "bg-green-100 text-green-800",
    "غير متصل": "bg-stone-100 text-stone-800",
};


function UserDetailsDialog({ user, open, onOpenChange, onUserUpdate }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: (userId: string, updates: Partial<User>) => void }) {
    if (!user) return null;
    const { toast } = useToast();
    const { database } = useDatabase();
    
    const idPlaceholderImage = PlaceHolderImages.find(p => p.id === "id-card-placeholder");

    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user.name);
    
    const { data: allTransactions, isLoading: transactionsLoading } = useRtdbList<Transaction>('/transactions');

    const userFinancialTransactions = useMemo(() => {
        if (!user || !allTransactions) return [];
        return allTransactions.filter(t => 
            (t.type === 'account_transfer' && (t.senderId === user.id || t.recipientId === user.id)) ||
            (t.type === 'egypt_transfer' && t.userId === user.id)
        ).filter(t => t.type !== 'recharge_purchase');
    }, [user, allTransactions]);
    
    const userEgyptianTransactions = useMemo(() => {
        if (!user || !allTransactions) return [];
        return allTransactions.filter((t): t is EgyptTransferTransaction => 
            t.type === 'egypt_transfer' && t.userId === user.id
        );
    }, [user, allTransactions]);


    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleUpdate = async (updates: Partial<User>) => {
        try {
            await updateRtdb(database, `/users/${user.id}`, updates);
            onUserUpdate(user.id, updates);
            return true;
        } catch(e: any) {
            toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
            return false;
        }
    }

    const handleVerification = async (newStatus: User['verification']) => {
        const success = await handleUpdate({ verification: newStatus });
        if(success) toast({ title: "حالة التوثيق تم تحديثها" });
    }

    const handleTypeChange = async (newType: User['role']) => {
        const success = await handleUpdate({ role: newType });
        if(success) toast({ title: "نوع المستخدم تم تحديثه" });
    }

    const handleNameSave = async () => {
        if (name.trim() === '') {
            toast({
                title: "خطأ",
                description: "اسم المستخدم لا يمكن أن يكون فارغاً.",
                variant: "destructive"
            });
            return;
        }
        const success = await handleUpdate({ name });
        if(success) {
            toast({ title: "تم تحديث اسم المستخدم بنجاح" });
            setIsEditingName(false);
        }
    }

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setName(user.name);
    }
    
    const handleLogoutAll = () => {
        // This is a placeholder for the actual implementation which would involve server-side logic
        toast({title: "تم إرسال طلب تسجيل الخروج من جميع الأجهزة."}) 
    }

    return (
        <Dialog open={open} onOpenChange={(o) => {
            if (!o) {
                setIsEditingName(false);
            }
            onOpenChange(o);
        }}>
            <DialogContent className="max-w-4xl">
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
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingName(true)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">تعديل الاسم</span>
                            </Button>
                        </div>
                    )}
                    <DialogDescription>تفاصيل المستخدم الكاملة وسجل معاملاته</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Column 1: Balances & Personal Info */}
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><Wallet /> الأرصدة</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>الرصيد الليبي:</span> <span className="font-semibold">{user.balanceLYD.toFixed(2)} د.ل</span></div>
                                <div className="flex justify-between"><span>الرصيد المصري:</span> <span className="font-semibold">{user.balanceEGP.toFixed(2)} ج.م</span></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><FileText /> التوثيق</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {idPlaceholderImage && <Image src={idPlaceholderImage.imageUrl} alt="ID Card" width={600} height={400} className="rounded-md mb-4" data-ai-hint={idPlaceholderImage.imageHint} />}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleVerification('verified')}><CheckCircle className="ml-2" /> توثيق</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleVerification('unverified')}><XCircle className="ml-2" /> إلغاء التوثيق</Button>
                                    <Button size="sm" variant="secondary" className="col-span-2" onClick={() => handleTypeChange(user.role === 'user' ? 'merchant' : 'user')}>
                                        <UserCog className="ml-2" /> تحويل إلى {user.role === 'user' ? 'تاجر' : 'مستخدم'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: History & Security */}
                    <div className="md:col-span-2 space-y-4">
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck /> معلومات الحساب والأمان</CardTitle>
                            </CardHeader>
                             <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>تاريخ الإنشاء:</span> <span>{new Date(user.createdAt).toLocaleDateString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تحديث:</span> <span>{new Date(user.lastUpdate).toLocaleString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تسجيل دخول:</span> <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-EG-u-nu-latn') : 'غير معروف'}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between"><span>الجهاز النشط:</span> <span className="flex items-center gap-2"><Smartphone size={16} />{user.activeDevice}</span></div>
                                <div className="flex justify-between"><span>نظام التشغيل:</span> <span>{user.phoneOS}</span></div>
                                <div className="flex justify-between"><span>عنوان IP:</span> <span>{user.ipAddress}</span></div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="destructive" className="w-full" onClick={handleLogoutAll}><LogOut className="ml-2"/> تسجيل الخروج من جميع الأجهزة</Button>
                            </CardFooter>
                        </Card>
                         <Tabs defaultValue="libyan">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="libyan">سجل المعاملات (د.ل)</TabsTrigger>
                                <TabsTrigger value="egyptian">سجل التحويلات (ج.م)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="libyan">
                                <Card>
                                    <CardContent className="pt-6">
                                       {transactionsLoading ? <p>جاري تحميل العمليات...</p> : 
                                            userFinancialTransactions.length > 0 ?
                                            <LibyanTransactionsDataTable initialData={userFinancialTransactions} /> :
                                            <p className="text-center text-muted-foreground text-sm">لا توجد معاملات ليبية لهذا المستخدم.</p>
                                        }
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="egyptian">
                                <Card>
                                    <CardContent className="pt-6">
                                        {transactionsLoading ? <p>جاري تحميل العمليات...</p> : 
                                            userEgyptianTransactions.length > 0 ?
                                            <EgyptianTransfersDataTable initialData={userEgyptianTransactions} /> :
                                            <p className="text-center text-muted-foreground text-sm">لا توجد تحويلات مصرية لهذا المستخدم.</p>
                                        }
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export function UsersDataTable({ initialData }: { initialData: User[] }) {
  const [data, setData] = useState<User[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { database } = useDatabase();
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [connectionStatusFilter, setConnectionStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (user) =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)) &&
        (roleFilter === 'all' || user.role === roleFilter) &&
        (connectionStatusFilter === 'all' || user.connectionStatus === connectionStatusFilter) &&
        (verificationFilter === 'all' || user.verification === verificationFilter) &&
        (statusFilter === 'all' || user.status === statusFilter)
    );
  }, [data, searchTerm, roleFilter, verificationFilter, statusFilter, connectionStatusFilter]);
  
  const handleToggleBan = async (userId: string, currentStatus: User['status']) => {
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      const userName = data.find(u => u.id === userId)?.name || '';
      
      if (!window.confirm(`هل أنت متأكد من ${newStatus === 'banned' ? 'حظر' : 'رفع الحظر عن'} ${userName}؟`)) return;

      try {
          await updateRtdb(database, `/users/${userId}`, { status: newStatus });
          toast({ 
              title: newStatus === 'banned' ? "تم حظر المستخدم" : "تم رفع الحظر عن المستخدم",
              description: `حالة ${userName} الآن: ${statusMap[newStatus]}`,
              variant: newStatus === 'banned' ? 'destructive' : 'default',
          });
          // The useRtdbList hook will automatically update the UI
      } catch (e: any) {
          toast({ title: "حدث خطأ", description: e.message, variant: 'destructive' });
      }
  }
    
  const handleVerification = async (userId: string, newStatus: User['verification']) => {
    try {
        await updateRtdb(database, `/users/${userId}`, { verification: newStatus });
        toast({ title: "حالة التوثيق تم تحديثها" });
    } catch(e: any) {
        toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    }
  }
  
  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    // This function is called from the dialog to reflect changes immediately in the main table UI if needed,
    // though the RTDB hook should handle it.
    setData(prevData =>
      prevData.map(user => (user.id === userId ? { ...user, ...updates } : user))
    );
    setSelectedUser(prevUser =>
      prevUser && prevUser.id === userId ? { ...prevUser, ...updates } : prevUser
    );
  };

  const handleShowDetails = (user: User) => {
      setSelectedUser(user);
      setDetailsOpen(true);
  }

  const handleClearFilters = () => {
    setRoleFilter("all");
    setConnectionStatusFilter("all");
    setVerificationFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-sm">
            <Input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
                <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="merchant">تاجر</SelectItem>
            </SelectContent>
        </Select>

        <Select value={connectionStatusFilter} onValueChange={setConnectionStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
                <SelectValue placeholder="حالة الاتصال" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">كل حالات الاتصال</SelectItem>
                <SelectItem value="متصل">متصل</SelectItem>
                <SelectItem value="غير متصل">غير متصل</SelectItem>
            </SelectContent>
        </Select>

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
                <SelectValue placeholder="التوثيق" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">كل حالات التوثيق</SelectItem>
                <SelectItem value="verified">موثق</SelectItem>
                <SelectItem value="unverified">غير موثق</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
            </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto md:w-[150px]">
                <SelectValue placeholder="حالة الحساب" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="banned">محظور</SelectItem>
            </SelectContent>
        </Select>
        <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto">
            <FilterX className="ml-2 h-4 w-4" />
            مسح الفلاتر
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden sm:table-cell">رقم الهاتف</TableHead>
              <TableHead className="hidden md:table-cell">النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="hidden lg:table-cell">اخر ظهور</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => (
              <TableRow key={user.id} className={cn(user.status === 'banned' && 'bg-red-50/50 opacity-60')}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden sm:table-cell">{user.phone}</TableCell>
                <TableCell className="hidden md:table-cell">{user.role}</TableCell>
                <TableCell>
                  <Badge className={cn('flex items-center gap-1.5 w-fit', connectionStatusColors[user.connectionStatus], `hover:${connectionStatusColors[user.connectionStatus]}`)}>
                    <span className={cn('h-2 w-2 rounded-full', user.connectionStatus === 'متصل' ? 'bg-green-600' : 'bg-stone-500')}></span>
                    {user.connectionStatus}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{new Date(user.lastUpdate).toLocaleString('ar-EG-u-nu-latn')}</TableCell>
                <TableCell>
                  <Badge className={cn(verificationStatusColors[user.verification], `hover:${verificationStatusColors[user.verification]}`)}>
                      {verificationStatusMap[user.verification] || user.verification}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShowDetails(user)}>
                        <Eye className="ml-2 h-4 w-4" />
                        <span>تفاصيل</span>
                      </DropdownMenuItem>
                       {user.verification === 'pending' && (
                        <DropdownMenuItem onClick={() => handleVerification(user.id, 'verified')} className="text-blue-600 focus:text-blue-600">
                            <ShieldCheck className="ml-2 h-4 w-4" />
                            <span>توثيق الحساب</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleBan(user.id, user.status)} className={cn(user.status === 'banned' ? 'text-green-600 focus:text-green-600' : 'text-destructive focus:text-destructive')}>
                        {user.status === 'banned' ? <UserCheck className="ml-2 h-4 w-4" /> : <UserX className="ml-2 h-4 w-4" />}
                        <span>{user.status === 'banned' ? 'رفع الحظر' : 'حظر'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setDetailsOpen} onUserUpdate={handleUserUpdate} />
    </div>
  );
}
