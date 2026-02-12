"use client";

import React, { useMemo, useState } from "react";
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
import { Eye, UserCheck, UserX } from "lucide-react";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const verificationStatusColors: Record<User["verificationStatus"], string> = {
  "موثق": "bg-green-100 text-green-800",
  "غير موثق": "bg-red-100 text-red-800",
  "قيد المراجعة": "bg-yellow-100 text-yellow-800",
};

const connectionStatusColors: Record<User["connectionStatus"], string> = {
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

function UserDetailsDialog({ user, open, onOpenChange }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!user) return null;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user.name}</DialogTitle>
                    <DialogDescription>تفاصيل المستخدم الكاملة</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 text-sm">
                    <p><strong>رقم الهاتف:</strong> {user.phone}</p>
                    <p><strong>النوع:</strong> {user.type}</p>
                    <p><strong>حالة الاتصال:</strong> {user.connectionStatus}</p>
                    <p><strong>آخر ظهور:</strong> {new Date(user.lastSeen).toLocaleString('ar-EG-u-nu-latn')}</p>
                    <p><strong>حالة التوثيق:</strong> {user.verificationStatus}</p>
                    <p><strong>حالة الحساب:</strong> <span className={cn('font-bold', user.status === 'محظور' ? 'text-destructive' : 'text-green-600')}>{user.status}</span></p>
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
       <UserDetailsDialog user={selectedUser} open={isDetailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  );
}
