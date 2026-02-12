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
import type { PointOfSale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

function PosForm({
  pos,
  onSave,
}: {
  pos?: PointOfSale;
  onSave: (p: PointOfSale) => void;
}) {
  const [formData, setFormData] = useState<Partial<PointOfSale>>(
    pos || {
      createdAt: new Date().toISOString(),
      status: 'نشط',
      balance: 0,
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
    onSave(formData as PointOfSale);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">اسم النقطة</label>
        <Input
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">الرصيد</label>
        <Input
          name="balance"
          type="number"
          step="0.01"
          value={formData.balance || ""}
          onChange={handleChange}
          required
        />
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

export function PosDataTable({ initialData }: { initialData: PointOfSale[] }) {
  const [data, setData] = useState<PointOfSale[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PointOfSale | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  
  const handleSave = (pos: PointOfSale) => {
    if(editingPos) {
        // Edit
        setData(data.map(d => d.id === editingPos.id ? {...d, ...pos} : d));
        toast({ title: "تم التحديث بنجاح" });
    } else {
        // Add
        const newPos = {...pos, id: `pos_${Date.now()}`, createdAt: new Date().toISOString()};
        setData([newPos, ...data]);
        toast({ title: "تمت الإضافة بنجاح" });
    }
    setDialogOpen(false);
    setEditingPos(undefined);
  };
  
  const handleDelete = (id: string) => {
      setData(data.filter(d => d.id !== id));
      toast({ title: "تم الحذف بنجاح", variant: 'destructive' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث باسم النقطة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingPos(undefined)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة نقطة بيع
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingPos ? 'تعديل نقطة البيع' : 'إضافة نقطة بيع جديدة'}</DialogTitle>
                </DialogHeader>
                <PosForm onSave={handleSave} pos={editingPos} />
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم النقطة</TableHead>
              <TableHead>الرصيد</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((pos) => (
              <TableRow key={pos.id}>
                <TableCell className="font-medium">{pos.name}</TableCell>
                <TableCell>د.ل {Number(pos.balance).toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  <Badge variant={pos.status === 'نشط' ? 'default' : 'destructive'} className={`${pos.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:${pos.status === 'نشط' ? 'bg-green-200' : 'bg-red-200'}`}>
                      {pos.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(pos.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingPos(pos); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(pos.id)}>حذف</DropdownMenuItem>
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
