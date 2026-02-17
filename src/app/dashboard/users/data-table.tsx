"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Eye,
  UserCheck,
  UserX,
  Wallet,
  ShieldCheck,
  FilterX,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import type { User, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatabase, updateRtdb, useRtdbList } from "@/firebase";
import { LibyanTransactionsDataTable } from "../libyan-transactions/data-table";


const verificationStatusMap: Record<User["verification"], string> = {
  "verified": "موثق",
  "pending": "قيد المراجعة",
  "unverified": "غير موثق",
};

const verificationStatusColors: Record<User["verification"], string> = {
  "verified": "bg-green-100 text-green-800",
  "unverified": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
};

const statusMap: Record<User["status"], string> = {
    "active": "نشط",
    "inactive": "غير نشط",
    "banned": "محظور",
};


function UserDetailsDialog({ user, open, onOpenChange, onUserUpdate }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: () => void }) {
    const { toast } = useToast();
    const { database } = useDatabase();
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const {data: allTransactions, isLoading} = useRtdbList<Transaction>('/transactions');

    const userTransactions = useMemo(() => {
        if (!user || !allTransactions) return [];
        return allTransactions.filter(t => {
            if (t.type === 'account_transfer') return t.senderId === user.id || t.recipientId === user.id;
            return t.userId === user.id;
        });
    }, [user, allTransactions]);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleNameSave = async () => {
        if (!user || name.trim() === '') {
            toast({
                title: "خطأ",
                description: "اسم المستخدم لا يمكن أن يكون فارغاً.",
                variant: "destructive"
            });
            return;
        }
        try {
            await updateRtdb(database, `/users/${user.id}`, { name: name });
            toast({ title: "تم تحديث اسم المستخدم بنجاح" });
            onUserUpdate(); // Callback to refetch or update parent state
        } catch (e: any) {
            toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
        } finally {
            setIsEditingName(false);
        }
    }

    const handleCancelEdit = () => {
        setIsEditingName(false);
        if (user) setName(user.name);
    }
    
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={(o) => {
            if (!o) setIsEditingName(false);
            onOpenChange(o);
        }}>
            <DialogContent className="max-w-5xl">
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
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between"><span>الرصيد الليبي:</span> <span className="font-semibold">{user.balanceLYD.toFixed(2)} د.ل</span></div>
                                <div className="flex justify-between"><span>الرصيد المصري:</span> <span className="font-semibold">{user.balanceEGP.toFixed(2)} ج.م</span></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck /> الحساب</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>تاريخ الإنشاء:</span> <span>{new Date(user.createdAt).toLocaleDateString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تحديث:</span> <span>{new Date(user.lastUpdate).toLocaleString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تسجيل دخول:</span> <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-EG-u-nu-latn') : 'غير معروف'}</span></div>
                                <div className="flex justify-between"><span>الدور:</span> <span className="font-semibold">{user.role}</span></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: History & Security */}
                    <div className="md:col-span-2 space-y-4">
                         <Card>
                            <CardHeader>
                                <CardTitle>سجل العمليات</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {isLoading ? <p>جاري تحميل العمليات...</p> : 
                                    userTransactions.length > 0 ?
                                    <LibyanTransactionsDataTable initialData={userTransactions} /> :
                                    <p className="text-center text-muted-foreground text-sm">لا توجد معاملات لهذا المستخدم.</p>
                                }
                            </CardContent>
                        </Card>
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
        (verificationFilter === 'all' || user.verification === verificationFilter) &&
        (statusFilter === 'all' || user.status === statusFilter)
    );
  }, [data, searchTerm, roleFilter, verificationFilter, statusFilter]);
  
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
          // Optimistic update
          setData(prev => prev.map(user => user.id === userId ? {...user, status: newStatus} : user));
      } catch (e: any) {
          toast({ title: "حدث خطأ", description: e.message, variant: 'destructive' });
      }
  }

  const handleVerify = async (userId: string, userName: string) => {
    if (!window.confirm(`هل أنت متأكد من توثيق حساب ${userName}؟`)) return;

    try {
        await updateRtdb(database, `/users/${userId}`, { verification: 'verified' });
        toast({ 
            title: "تم توثيق الحساب",
            description: `تم توثيق حساب ${userName} بنجاح.`,
            className: 'bg-green-100 text-green-800'
        });
        // Optimistic update
        setData(prev => prev.map(user => user.id === userId ? {...user, verification: 'verified'} : user));
    } catch (e: any) {
        toast({ title: "حدث خطأ", description: e.message, variant: 'destructive' });
    }
  }

  const handleShowDetails = (user: User) => {
      setSelectedUser(user);
      setDetailsOpen(true);
  }
  
  const handleUserUpdate = () => {
    // This could be a refetch, but for now we just close the dialog
    // A more robust solution might involve a global state management or context to trigger refetch
    setDetailsOpen(false); 
  }

  const handleClearFilters = () => {
    setRoleFilter("all");
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
                <SelectValue placeholder="الدور" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
              <TableHead className="hidden md:table-cell">الدور</TableHead>
              <TableHead className="hidden lg:table-cell">حالة الحساب</TableHead>
              <TableHead className="hidden xl:table-cell">آخر تحديث</TableHead>
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
                <TableCell className="hidden lg:table-cell">
                   <Badge className={cn(user.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                        {statusMap[user.status] || user.status}
                   </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{new Date(user.lastUpdate).toLocaleString('ar-EG-u-nu-latn')}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleVerify(user.id, user.name)} className="text-blue-600 focus:text-blue-600">
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
