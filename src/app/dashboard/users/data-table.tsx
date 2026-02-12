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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

function UserForm({
  user,
  onSave,
}: {
  user?: User;
  onSave: (u: User) => void;
}) {
  const [formData, setFormData] = useState<Partial<User>>(
    user || {
      createdAt: new Date().toISOString(),
      status: 'نشط',
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as User);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">الاسم</label>
        <Input
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">البريد الإلكتروني</label>
        <Input
          name="email"
          type="email"
          value={formData.email || ""}
          onChange={handleChange}
          required
        />
      </div>
       <div>
        <label className="text-sm font-medium">الهاتف</label>
        <Input
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">الحالة</label>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
            <option>نشط</option>
            <option>محظور</option>
        </select>
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="secondary">إلغاء</Button>
        </DialogClose>
        <Button type="submit">حفظ</Button>
      </DialogFooter>
    </form>
  );
}

export function UsersDataTable({ initialData }: { initialData: User[] }) {
  const [data, setData] = useState<User[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  
  const handleSave = (user: User) => {
    if(editingUser) {
        // Edit
        setData(data.map(d => d.id === editingUser.id ? {...d, ...user} : d));
        toast({ title: "تم التحديث بنجاح" });
    } else {
        // Add
        const newUser = {...user, id: `usr_${Date.now()}`, createdAt: new Date().toISOString()};
        setData([newUser, ...data]);
        toast({ title: "تمت الإضافة بنجاح" });
    }
    setDialogOpen(false);
    setEditingUser(undefined);
  };
  
  const handleDelete = (id: string) => {
      setData(data.filter(d => d.id !== id));
      toast({ title: "تم الحذف بنجاح", variant: 'destructive' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث بالاسم أو البريد..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingUser(undefined)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة مستخدم
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                </DialogHeader>
                <UserForm onSave={handleSave} user={editingUser} />
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'نشط' ? 'default' : 'destructive'} className={`${user.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:${user.status === 'نشط' ? 'bg-green-200' : 'bg-red-200'}`}>
                      {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingUser(user); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
