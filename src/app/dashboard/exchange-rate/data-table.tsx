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
import { useRtdbList, setRtdb, updateRtdb, removeRtdb, pushRtdb, useDatabase, useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

function ExchangeRateForm({
  rate,
  onSave,
  isSaving,
}: {
  rate?: ExchangeRate;
  onSave: (r: Omit<ExchangeRate, 'id' | 'lastUpdated'>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<ExchangeRate>>(
    rate || {
      currencyPair: "",
      rate: 0,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';
    setFormData((prev) => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currencyPair || !formData.rate) {
      return;
    }
    onSave(formData as Omit<ExchangeRate, 'id' | 'lastUpdated'>);
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
          disabled={isSaving}
        />
      </div>
      <div>
        <label className="text-sm font-medium">السعر</label>
        <Input
          name="rate"
          type="number"
          step="0.01"
          value={formData.rate || ""}
          onChange={handleChange}
          required
          disabled={isSaving}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ExchangeRateDataTable() {
  const { data: rates, isLoading } = useRtdbList<ExchangeRate>('/exchangeRates');
  const { database } = useDatabase();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | undefined>(undefined);
  const { toast } = useToast();

  const filteredData = useMemo(() => {
    if (!rates) return [];
    return rates.filter(
      (item) =>
        item.currencyPair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rates, searchTerm]);
  
  const handleSave = async (rateData: Omit<ExchangeRate, 'id' | 'lastUpdated'>) => {
    setIsSaving(true);
    try {
        const rateId = editingRate ? editingRate.id : rateData.currencyPair.replace('/', '_');
        const path = `/exchangeRates/${rateId}`;
        const finalData = { 
            ...rateData, 
            lastUpdated: new Date().toISOString() 
        };

        if (editingRate) {
            // Log the change
            const logPath = '/exchangeRateLogs';
            const newLog = {
                date: new Date().toISOString(),
                modifiedBy: user?.displayName || 'المسؤول',
                oldRate: editingRate.rate,
                newRate: finalData.rate,
                currencyPair: finalData.currencyPair,
            };
            await pushRtdb(database, logPath, newLog);
            // Update the rate
            await setRtdb(database, path, finalData);
            toast({ title: "تم التحديث بنجاح" });
        } else {
            // Add new rate
            await setRtdb(database, path, finalData);
            toast({ title: "تمت الإضافة بنجاح" });
        }

        setDialogOpen(false);
        setEditingRate(undefined);
    } catch (error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
      if (!window.confirm("هل أنت متأكد من حذف سعر الصرف هذا؟")) return;
      try {
          await removeRtdb(database, `/exchangeRates/${id}`);
          toast({ title: "تم الحذف بنجاح", variant: 'destructive' });
      } catch (error: any) {
          toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
      }
  }

  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-28" />
            </div>
            <div className="rounded-lg border p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingRate(undefined);
            setDialogOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة سعر
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingRate ? 'تعديل السعر' : 'إضافة سعر جديد'}</DialogTitle>
                </DialogHeader>
                <ExchangeRateForm onSave={handleSave} rate={editingRate} isSaving={isSaving} />
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
                <TableCell>{rate.rate.toFixed(2)}</TableCell>
                <TableCell>{new Date(rate.lastUpdated).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
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
