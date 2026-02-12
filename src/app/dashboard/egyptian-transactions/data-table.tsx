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
import type { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const categoryColors: Record<string, string> = {
  "إلكترونيات": "bg-blue-100 text-blue-800",
  "ملابس": "bg-purple-100 text-purple-800",
  "طعام": "bg-green-100 text-green-800",
  "أثاث": "bg-yellow-100 text-yellow-800",
  "كتب": "bg-indigo-100 text-indigo-800",
  "خدمات": "bg-pink-100 text-pink-800",
  "صحة": "bg-red-100 text-red-800",
};

function TransactionForm({
  transaction,
  onSave,
}: {
  transaction?: Transaction;
  onSave: (t: Transaction) => void;
}) {
  const [formData, setFormData] = useState<Partial<Transaction>>(
    transaction || {
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "بطاقة ائتمان",
      category: "طعام",
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
    onSave(formData as Transaction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">المنتج</label>
        <Input
          name="product"
          value={formData.product || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">المبلغ</label>
        <Input
          name="amount"
          type="number"
          value={formData.amount || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">الفئة</label>
        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md">
            {Object.keys(categoryColors).map(cat => <option key={cat}>{cat}</option>)}
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

export function EgyptianTransactionsDataTable({ initialData }: { initialData: Transaction[] }) {
  const [data, setData] = useState<Transaction[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount.toString().includes(searchTerm)
    );
  }, [data, searchTerm]);
  
  const handleSave = (transaction: Transaction) => {
    if(editingTransaction) {
        // Edit
        setData(data.map(d => d.id === editingTransaction.id ? {...d, ...transaction} : d));
        toast({ title: "تم التحديث بنجاح", description: `تم تحديث المعاملة ${transaction.product}.` });
    } else {
        // Add
        const newTransaction = {...transaction, id: `txn_eg_${Date.now()}`};
        setData([newTransaction, ...data]);
        toast({ title: "تمت الإضافة بنجاح", description: `تمت إضافة المعاملة ${transaction.product}.` });
    }
    setDialogOpen(false);
    setEditingTransaction(undefined);
  };
  
  const handleDelete = (id: string) => {
      setData(data.filter(d => d.id !== id));
      toast({ title: "تم الحذف بنجاح", variant: 'destructive' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث في المعاملات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingTransaction(undefined)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة سجل
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingTransaction ? 'تعديل السجل' : 'إضافة سجل جديد'}</DialogTitle>
                </DialogHeader>
                <TransactionForm onSave={handleSave} transaction={editingTransaction} />
            </DialogContent>
        </Dialog>
      </div>
      <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المنتج</TableHead>
            <TableHead>الفئة</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>طريقة الدفع</TableHead>
            <TableHead>
              <span className="sr-only">الإجراءات</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.product}</TableCell>
              <TableCell><Badge className={`${categoryColors[transaction.category]} hover:${categoryColors[transaction.category]}`}>{transaction.category}</Badge></TableCell>
              <TableCell>ج.م {transaction.amount.toLocaleString()}</TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.paymentMethod}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">فتح القائمة</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingTransaction(transaction); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(transaction.id)}>حذف</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
    </div>
  );
}
