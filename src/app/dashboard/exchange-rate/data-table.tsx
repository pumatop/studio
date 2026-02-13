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
import type { ExchangeRate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function ExchangeRateForm({
  rate,
  onSave,
}: {
  rate?: ExchangeRate;
  onSave: (r: ExchangeRate) => void;
}) {
  const [formData, setFormData] = useState<Partial<ExchangeRate>>(
    rate || {
      lastUpdated: new Date().toISOString(),
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as ExchangeRate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">زوج العملات</label>
        <Input
          name="currencyPair"
          value={formData.currencyPair || ""}
          onChange={handleChange}
          required
          placeholder="e.g. USD/LYD"
        />
      </div>
      <div>
        <label className="text-sm font-medium">السعر</label>
        <Input
          name="rate"
          type="number"
          step="0.0001"
          value={formData.rate || ""}
          onChange={handleChange}
          required
        />
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

export function ExchangeRateDataTable({ initialData }: { initialData: ExchangeRate[] }) {
  const [data, setData] = useState<ExchangeRate[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.currencyPair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);
  
  const handleSave = (rate: ExchangeRate) => {
    const finalRate = { ...rate, lastUpdated: new Date().toISOString() };
    if(editingRate) {
        // Edit
        setData(data.map(d => d.id === editingRate.id ? {...d, ...finalRate} : d));
        toast({ title: "تم التحديث بنجاح" });
    } else {
        // Add
        const newRate = {...finalRate, id: `rate_${Date.now()}`};
        setData([newRate, ...data]);
        toast({ title: "تمت الإضافة بنجاح" });
    }
    setDialogOpen(false);
    setEditingRate(undefined);
  };
  
  const handleDelete = (id: string) => {
      setData(data.filter(d => d.id !== id));
      toast({ title: "تم الحذف بنجاح", variant: 'destructive' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="ابحث..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingRate(undefined)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة سعر
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingRate ? 'تعديل السعر' : 'إضافة سعر جديد'}</DialogTitle>
                </DialogHeader>
                <ExchangeRateForm onSave={handleSave} rate={editingRate} />
            </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>زوج العملات</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>آخر تحديث</TableHead>
              <TableHead>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">{rate.currencyPair}</TableCell>
                <TableCell>{rate.rate}</TableCell>
                <TableCell>{new Date(rate.lastUpdated).toLocaleString('ar-EG-u-nu-latn')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingRate(rate); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(rate.id)}>حذف</DropdownMenuItem>
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
