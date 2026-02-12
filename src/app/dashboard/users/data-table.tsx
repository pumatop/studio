"use client";

import React, { useMemo, useState } from "react";
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
import { Eye, UserCheck, UserX, Wallet, FileText, CheckCircle, XCircle, UserCog, ShieldCheck, Smartphone, LogOut } from "lucide-react";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const verificationStatusColors: Record<User["verificationStatus"], string> = {
  "موثق": "bg-green-100 text-green-800",
  "غير موثق": "bg-red-100 text-red-800",
  "قيد المراجعة": "bg-yellow-100 text-yellow-800",
};

const connectionStatusColors: Record<User["connectionStatus"], string> = {
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

function UserDetailsDialog({ user, open, onOpenChange, onUserUpdate }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onUserUpdate: (userId: string, updates: Partial<User>) => void }) {
    if (!user) return null;
    const { toast } = useToast();
    const idImage = PlaceHolderImages.find(p => p.id === user.idImageUrl);

    const handleVerification = (newStatus: User['verificationStatus']) => {
        onUserUpdate(user.id, { verificationStatus: newStatus });
        toast({ title: "حالة التوثيق تم تحديثها" });
    }

    const handleTypeChange = (newType: User['type']) => {
        onUserUpdate(user.id, { type: newType });
        toast({ title: "نوع المستخدم تم تحديثه" });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{user.name}</DialogTitle>
                    <DialogDescription>تفاصيل المستخدم الكاملة</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Column 1: Balances & Personal Info */}
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><Wallet /> الأرصدة</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between"><span>الرصيد الليبي:</span> <span className="font-mono font-semibold">{user.balanceLibyan.toFixed(2)} د.ل</span></div>
                                <div className="flex justify-between"><span>الرصيد المصري:</span> <span className="font-mono font-semibold">{user.balanceEgyptian.toFixed(2)} ج.م</span></div>
                                <div className="flex justify-between text-muted-foreground"><span>المصري المعلق:</span> <span className="font-mono font-semibold">{user.balanceEgyptianPending.toFixed(2)} ج.م</span></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><FileText /> التوثيق</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {idImage && <Image src={idImage.imageUrl} alt="ID Card" width={600} height={400} className="rounded-md mb-4" data-ai-hint={idImage.imageHint} />}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleVerification('موثق')}><CheckCircle className="ml-2" /> توثيق</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleVerification('غير موثق')}><XCircle className="ml-2" /> إلغاء التوثيق</Button>
                                    <Button size="sm" variant="secondary" className="col-span-2" onClick={() => handleTypeChange(user.type === 'مستخدم' ? 'تاجر' : 'مستخدم')}>
                                        <UserCog className="ml-2" /> تحويل إلى {user.type === 'مستخدم' ? 'تاجر' : 'مستخدم'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: History & Security */}
                    <div className="md:col-span-2 space-y-4">
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck /> معلومات الأمان</CardTitle>
                            </CardHeader>
                             <CardContent className="text-sm space-y-2 pt-4">
                                <div className="flex justify-between"><span>تاريخ فتح الحساب:</span> <span>{new Date(user.accountOpenDate).toLocaleDateString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تغيير لكلمة المرور:</span> <span>{new Date(user.lastPasswordChange).toLocaleDateString('ar-EG-u-nu-latn')}</span></div>
                                <div className="flex justify-between"><span>آخر تغيير للرقم السري:</span> <span>{new Date(user.lastPinChange).toLocaleDateString('ar-EG-u-nu-latn')}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between"><span>الجهاز النشط:</span> <span className="flex items-center gap-2"><Smartphone size={16} />{user.activeDevice}</span></div>
                                <div className="flex justify-between"><span>نظام التشغيل:</span> <span>{user.phoneOS}</span></div>
                                <div className="flex justify-between"><span>عنوان IP:</span> <span className="font-mono">{user.ipAddress}</span></div>
                                
                            </CardContent>
                            <CardFooter>
                                <Button variant="destructive" className="w-full" onClick={() => toast({title: "تم تسجيل الخروج من جميع الأجهزة"}) }><LogOut className="ml-2"/> تسجيل الخروج من جميع الأجهزة</Button>
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
                                        <p className="text-center text-muted-foreground text-sm">لا يوجد سجل معاملات لعرضه.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="egyptian">
                                <Card>
                                    <CardContent className="pt-6">
                                         <p className="text-center text-muted-foreground text-sm">لا يوجد سجل تحويلات لعرضه.</p>
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

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm)
    );
  }, [data, searchTerm]);
  
  const handleToggleBan = (userId: string) => {
      setData(data.map(user => {
          if (user.id === userId) {
              const newStatus = user.status === 'نشط' ? 'محظور' : 'نشط';
              toast({ 
                  title: newStatus === 'محظور' ? "تم حظر المستخدم" : "تم رفع الحظر عن المستخدم",
                  description: `حالة ${user.name} الآن: ${newStatus}`,
                  variant: newStatus === 'محظور' ? 'destructive' : 'default',
              });
              return { ...user, status: newStatus };
          }
          return user;
      }));
  }
  
  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    setData(data.map(user => 
        user.id === userId ? { ...user, ...updates } : user
    ));
  }


  const handleShowDetails = (user: User) => {
      setSelectedUser(user);
      setDetailsOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>اخر ظهور</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => (
              <TableRow key={user.id} className={cn(user.status === 'محظور' && 'bg-red-50/50 opacity-60')}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  <Badge className={cn('flex items-center gap-1.5 w-fit', connectionStatusColors[user.connectionStatus], `hover:${connectionStatusColors[user.connectionStatus]}`)}>
                    <span className={cn('h-2 w-2 rounded-full', user.connectionStatus === 'متصل' ? 'bg-green-600' : 'bg-stone-500')}></span>
                    {user.connectionStatus}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.lastSeen).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</TableCell>
                <TableCell>
                  <Badge className={`${verificationStatusColors[user.verificationStatus]} hover:${verificationStatusColors[user.verificationStatus]}`}>
                      {user.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-1 text-left rtl:space-x-reverse">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleShowDetails(user)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">تفاصيل اضافية</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleToggleBan(user.id)} 
                    className={cn('h-8 w-8', user.status === 'محظور' ? 'text-green-600 hover:text-green-700 hover:bg-green-50/50' : 'text-destructive hover:text-destructive hover:bg-red-50/50')}>
                   {user.status === 'محظور' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                   <span className="sr-only">{user.status === 'محظور' ? 'رفع الحظر' : 'حظر المستخدم'}</span>
                  </Button>
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
