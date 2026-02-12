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
import type { Supervisor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

function SupervisorForm({
  supervisor,
  onSave,
}: {
  supervisor?: Supervisor;
  onSave: (s: Supervisor) => void;
}) {
  const [formData, setFormData] = useState<Partial<Supervisor>>(
    supervisor || {
      lastLogin: new Date().toISOString(),
      role: 'مندوب',
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
    onSave(formData as Supervisor);
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
        <label className="text-sm font-medium">الدور</label>
        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded-md">
            <option>مشرف</option>
            <option>مندوب</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">الحالة</label>
        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
            <option>نشط</option>
            <option>غير نشط</option>
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

export function SupervisorsDataTable({ initialData }: { initialData: Supervisor[] }) {
  const [data, setData] = useState<Supervisor[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  
  const handleSave = (supervisor: Supervisor) => {
    const finalSupervisor = { ...supervisor, lastLogin: new Date().toISOString() };
    if(editingSupervisor) {
        // Edit
        setData(data.map(d => d.id === editingSupervisor.id ? {...d, ...finalSupervisor} : d));
        toast({ title: "تم التحديث بنجاح" });
    } else {
        // Add
        const newSupervisor = {...finalSupervisor, id: `sup_${Date.now()}`};
        setData([newSupervisor, ...data]);
        toast({ title: "تمت الإضافة بنجاح" });
    }
    setDialogOpen(false);
    setEditingSupervisor(undefined);
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
                <Button onClick={() => setEditingSupervisor(undefined)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة مشرف
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingSupervisor ? 'تعديل مشرف' : 'إضافة مشرف جديد'}</DialogTitle>
                </DialogHeader>
                <SupervisorForm onSave={handleSave} supervisor={editingSupervisor} />
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>آخر تسجيل دخول</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((supervisor) => (
              <TableRow key={supervisor.id}>
                <TableCell className="font-medium">{supervisor.name}</TableCell>
                <TableCell>{supervisor.email}</TableCell>
                <TableCell>{supervisor.role}</TableCell>
                <TableCell>
                  <Badge variant={supervisor.status === 'نشط' ? 'default' : 'destructive'} className={`${supervisor.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:${supervisor.status === 'نشط' ? 'bg-green-200' : 'bg-red-200'}`}>
                      {supervisor.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(supervisor.lastLogin).toLocaleString('ar-EG')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingSupervisor(supervisor); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(supervisor.id)}>حذف</DropdownMenuItem>
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
