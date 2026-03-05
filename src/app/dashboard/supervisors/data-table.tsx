
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  PlusCircle, FileClock, KeyRound, FilterX, MoreHorizontal, Trash2,
  Search, FileDown, ShieldCheck, Phone, Pencil, LogOut,
  Activity, Truck
} from 'lucide-react';
import type { Supervisor, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn, exportToCsv } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRtdbList, useDatabase, setRtdb, updateRtdb, useAuth, useFunctions } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

const statusColors: Record<string, string> = {
  'نشط': 'bg-green-100 text-green-800',
  'غير نشط': 'bg-red-100 text-red-800',
};

const months = [
    { val: "1", label: "يناير" }, { val: "2", label: "فبراير" }, { val: "3", label: "مارس" },
    { val: "4", label: "أبريل" }, { val: "5", label: "مايو" }, { val: "6", label: "يونيو" },
    { val: "7", label: "يوليو" }, { val: "8", label: "أغسطس" }, { val: "9", label: "سبتمبر" },
    { val: "10", label: "أكتوبر" }, { val: "11", label: "نوفمبر" }, { val: "12", label: "ديسمبر" },
];

// مكون لعرض المبالغ مع العملة جهة اليسار
const CurrencyDisplay = ({ amount, currency, colorClass = "text-[#1A4B84]" }: { amount: number, currency: string, colorClass?: string }) => (
    <div className={cn("flex items-baseline gap-1 justify-start font-black", colorClass)} dir="ltr">
        <span className="text-[0.7em] opacity-70 font-bold">{currency}</span>
        <span className="tabular-nums">{(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
);

/**
 * تنسيق التاريخ: يوم شهر سنة من اليمين لليسار، ص/م يسار الوقت
 */
const formatDateParts = (timestamp: number | string | undefined) => {
    if (!timestamp) return { day: '--', month: '--', year: '----', time: '--:--', period: '' };
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0];
    const period = date.getHours() >= 12 ? 'م' : 'ص';
    
    return { day, month, year, time: timePart, period };
};

const DateTimeDisplay = ({ timestamp, className }: { timestamp: string | undefined, className?: string }) => {
    const parts = formatDateParts(timestamp);
    return (
        <div className={cn("flex items-center justify-start gap-1 tabular-nums", className)} dir="rtl">
            <div className="flex items-center gap-0.5">
                <span>{parts.day}</span>
                <span className="opacity-30">/</span>
                <span>{parts.month}</span>
                <span className="opacity-30">/</span>
                <span>{parts.year}</span>
            </div>
            <span className="mx-2 opacity-20">|</span>
            <div className="flex items-center">
                <span className="text-[10px] font-black ml-1">{parts.period}</span>
                <span className="font-bold">{parts.time}</span>
            </div>
        </div>
    );
};

function SupervisorForm({ supervisor, onSave, isSaving }: { supervisor?: Supervisor | null; onSave: (s: Partial<Supervisor>) => void; isSaving: boolean; }) {
  const [formData, setFormData] = useState<Partial<Supervisor>>(
    supervisor || {
      name: '',
      phone: '',
      canEditExchangeRate: false,
      specialization: [],
      status: 'نشط',
      password: ''
    }
  );

  const specializations: Supervisor['specialization'] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, canEditExchangeRate: checked }));
  }

  const handleSpecializationChange = (spec: string, checked: boolean) => {
    setFormData(prev => {
        const prevSpecs = prev.specialization || [];
        if (checked) {
            return { ...prev, specialization: [...prevSpecs, spec] as Supervisor['specialization'] };
        } else {
            return { ...prev, specialization: prevSpecs.filter(s => s !== spec) as Supervisor['specialization'] };
        }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">اسم المشرف</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required disabled={isSaving} className="rounded-xl h-11" />
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone" className="font-bold">رقم الهاتف</Label>
            <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} required disabled={isSaving} className="rounded-xl h-11" />
        </div>
      </div>
       <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
                <Input id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} required={!supervisor} placeholder={supervisor ? 'اتركه فارغاً لعدم التغيير' : '••••••••'} disabled={isSaving} className="rounded-xl h-11 pl-10" />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
            <Label className="font-bold">تخصص المندوب</Label>
            <div className="space-y-2 rounded-2xl border p-4 bg-slate-50/50">
                {specializations.map(spec => (
                    <div key={spec} className="flex items-center gap-3">
                        <Checkbox id={`spec-${spec}`} checked={formData.specialization?.includes(spec)} onCheckedChange={(checked) => handleSpecializationChange(spec, !!checked)} disabled={isSaving}/>
                        <Label htmlFor={`spec-${spec}`} className="font-medium cursor-pointer">{spec}</Label>
                    </div>
                ))}
            </div>
        </div>
        <div className="space-y-3">
            <Label htmlFor="status" className="font-bold text-slate-500">حالة الحساب</Label>
            <Select name="status" value={formData.status} onValueChange={(v) => setFormData(p => ({...p, status: v as any}))} disabled={isSaving}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="نشط">نشط (فعال)</SelectItem>
                    <SelectItem value="غير نشط">غير نشط (معطل)</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center justify-between rounded-2xl border p-4 bg-white shadow-sm mt-4">
                <Label htmlFor="canEditExchangeRate" className="font-bold text-slate-600">تعديل سعر الصرف</Label>
                <Switch id="canEditExchangeRate" checked={formData.canEditExchangeRate} onCheckedChange={handleSwitchChange} disabled={isSaving} />
            </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <DialogClose asChild><Button type="button" variant="ghost" className="rounded-xl" disabled={isSaving}>إلغاء</Button></DialogClose>
        <Button type="submit" disabled={isSaving} className="rounded-xl px-8 bg-[#1A4B84] hover:bg-[#1A4B84]/90 text-white">
            {isSaving ? 'جاري الحفظ...' : 'حفظ بيانات المشرف'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SupervisorsDataTable({ initialData, allTransactions }: { initialData: Supervisor[], allTransactions: Transaction[] }) {
  const { database } = useDatabase();
  const auth = useAuth();
  const functions = useFunctions();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // حساب الإحصائيات المالية لكل مشرف بناءً على الشهر المختار
  const supervisorStats = useMemo(() => {
    if (!allTransactions || !initialData) return {};
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthIdx = parseInt(selectedMonth) - 1;
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfSelectedMonth = new Date(currentYear, monthIdx, 1).getTime();
    const endOfSelectedMonth = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999).getTime();

    const statsMap: Record<string, { daily: number, monthly: number, fees: number }> = {};
    const nameToIdMap: Record<string, string> = {};

    initialData.forEach(s => { 
        statsMap[s.id] = { daily: 0, monthly: 0, fees: 0 }; 
        nameToIdMap[s.name] = s.id;
    });

    allTransactions.forEach(t => {
        if (t.status !== 'completed') return;
        
        const delegateName = (t as any).delegateName || (t as any).agentInfo;
        if (!delegateName) return;

        const sId = nameToIdMap[delegateName];
        if (!sId) return;

        const ts = t.timestamp;
        const amount = (t as any).amountEGP || 0;
        const fee = (t as any).serviceFee || 0;

        if (ts >= startOfToday) {
            statsMap[sId].daily += amount;
        }
        if (ts >= startOfSelectedMonth && ts <= endOfSelectedMonth) {
            statsMap[sId].monthly += amount;
            statsMap[sId].fees += fee;
        }
    });

    return statsMap;
  }, [allTransactions, initialData, selectedMonth]);

  const filteredData = useMemo(() => {
    return (initialData || []).filter(s => 
        (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone?.includes(searchTerm)) && 
        (specializationFilter === 'all' || s.specialization?.includes(specializationFilter as any)) &&
        (statusFilter === 'all' || s.status === statusFilter)
    );
  }, [initialData, searchTerm, specializationFilter, statusFilter]);

  const handleCsvExport = () => {
    const monthName = months.find(m => m.val === selectedMonth)?.label || "";
    exportToCsv(`supervisors_finance_${monthName}.csv`, filteredData.map(s => {
        const stats = supervisorStats[s.id] || { daily: 0, monthly: 0, fees: 0 };
        return {
            'الاسم': s.name,
            'الهاتف': s.phone,
            'التخصص': s.specialization?.join(' - ') || 'غير محدد',
            'اجمالي اليوم (ج.م)': stats.daily.toFixed(2),
            [`اجمالي شهر ${monthName} (ج.م)`]: stats.monthly.toFixed(2),
            [`رسوم شهر ${monthName} (ج.م)`]: stats.fees.toFixed(2),
            'الحالة': s.status
        };
    }));
  };

  const handleSave = async (supervisorData: Partial<Supervisor>) => {
    setIsSaving(true);
    try {
        if (editingSupervisor) {
            const path = `/supervisors/${editingSupervisor.id}`;
            const dataToUpdate = { ...supervisorData };
            delete dataToUpdate.password;
            await updateRtdb(database, path, dataToUpdate);
            toast({ title: 'تم تحديث بيانات المشرف بنجاح' });
        } else {
            if (!supervisorData.phone || !supervisorData.password) throw new Error("الهاتف وكلمة المرور مطلوبان.");
            const email = `${supervisorData.phone.replace(/\s+/g, '')}@hawelly.app`;
            const userCredential = await createUserWithEmailAndPassword(auth, email, supervisorData.password);
            const path = `/supervisors/${userCredential.user.uid}`;
            const newSupervisorData = {
                name: supervisorData.name || '',
                phone: supervisorData.phone || '',
                canEditExchangeRate: supervisorData.canEditExchangeRate || false,
                specialization: supervisorData.specialization || [],
                status: supervisorData.status || 'نشط',
                connectionStatus: 'غير متصل',
                lastSeen: new Date().toISOString(),
            };
            await setRtdb(database, path, newSupervisorData);
            toast({ title: 'تمت إضافة المشرف الجديد بنجاح' });
        }
        setDialogOpen(false);
        setEditingSupervisor(null);
    } catch(error: any) {
        toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
      if (!window.confirm(`حذف المشرف '${name}' نهائياً؟`)) return;
      const deleteSupervisorFn = httpsCallable(functions, 'deleteSupervisor');
      try {
          await deleteSupervisorFn({ uid: id });
          toast({ title: 'تم الحذف بنجاح' });
      } catch (error: any) {
          toast({ title: 'فشل الحذف', description: error.message, variant: 'destructive' });
      }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-sm:w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="بحث باسم المشرف أو رقم هاتفه..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pr-10 h-11 rounded-xl bg-white border-slate-200 text-right" 
                />
            </div>
            <div className="flex gap-2">
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                    <SelectTrigger className="w-[140px] h-11 rounded-xl bg-white"><SelectValue placeholder="التخصص" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل التخصصات</SelectItem>
                        <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
                        <SelectItem value="انستاباي">انستاباي</SelectItem>
                        <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[130px] h-11 rounded-xl bg-white"><SelectValue placeholder="الشهر" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl max-h-[300px]">
                        {months.map(m => (
                            <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] h-11 rounded-xl bg-white"><SelectValue placeholder="الحالة" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="نشط">نشط</SelectItem>
                        <SelectItem value="غير نشط">غير نشط</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-slate-400 hover:text-primary" onClick={() => { setSearchTerm(""); setSpecializationFilter("all"); setStatusFilter("all"); setSelectedMonth((new Date().getMonth() + 1).toString()); }}>
                    <FilterX className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleCsvExport} className="h-11 rounded-xl bg-white border-slate-200 px-4">
                <FileDown className="ml-2 h-4 w-4 text-slate-400" /> تصدير مالي
            </Button>
            <Button 
                onClick={() => { setEditingSupervisor(null); setDialogOpen(true); }}
                className="h-11 rounded-xl bg-[#1A4B84] hover:bg-[#1A4B84]/90 px-6 text-white"
            >
                <PlusCircle className="ml-2 h-4 w-4" /> إضافة مشرف
            </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar relative">
            <Table>
                <TableHeader className="sticky top-0 z-20 bg-slate-50 border-b shadow-sm">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">المشرف / المندوب</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">اجمالي اليوم</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">اجمالي الشهر</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">رسوم الشهر</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">التخصصات</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-right h-12">الاتصال</TableHead>
                        <TableHead className="font-black text-[#1A4B84] text-[10px] uppercase tracking-widest text-center h-12">الحالة</TableHead>
                        <TableHead className="text-left font-black text-[#1A4B84] text-[10px] uppercase tracking-widest h-12">إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-40 text-center text-muted-foreground font-bold italic">لا توجد نتائج مطابقة</TableCell>
                        </TableRow>
                    ) : filteredData.map(s => {
                        const isOnline = s.connectionStatus === 'متصل';
                        const stats = supervisorStats[s.id] || { daily: 0, monthly: 0, fees: 0 };
                        return (
                            <TableRow key={s.id} className={cn("hover:bg-slate-50/50 transition-colors border-b last:border-0", s.status === 'غير نشط' && "bg-red-50/20")}>
                                <TableCell className="text-right py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-700">{s.name}</span>
                                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">{s.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <CurrencyDisplay amount={stats.daily} currency="ج.م" colorClass="text-slate-600 text-xs" />
                                </TableCell>
                                <TableCell>
                                    <CurrencyDisplay amount={stats.monthly} currency="ج.م" colorClass="text-[#1A4B84] text-xs" />
                                </TableCell>
                                <TableCell>
                                    <CurrencyDisplay amount={stats.fees} currency="ج.م" colorClass="text-orange-600 text-xs" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-wrap gap-1">
                                        {s.specialization?.map(spec => (
                                            <Badge key={spec} variant="outline" className="text-[9px] font-bold bg-slate-50 border-slate-200">{spec}</Badge>
                                        )) || <span className="text-[10px] text-slate-300 italic">غير محدد</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center gap-1.5 justify-start">
                                        <span className={cn("h-2 w-2 rounded-full shadow-sm", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                        <span className={cn("text-[11px] font-bold", isOnline ? "text-green-600" : "text-slate-400")}>{s.connectionStatus || 'غير متصل'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("text-[10px] font-bold border-none shadow-none", statusColors[s.status])}>{s.status}</Badge>
                                </TableCell>
                                <TableCell className="text-left">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-none shadow-2xl p-2">
                                            <DropdownMenuItem 
                                                className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm" 
                                                onSelect={() => {
                                                    setEditingSupervisor(s);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="ml-2 h-4 w-4 text-[#1A4B84]" /> تعديل البيانات
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm">
                                                <Link href={`/dashboard/supervisors/${s.id}/log`}><FileClock className="ml-2 h-4 w-4 text-blue-500" /> سجل العمليات</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-100" />
                                            <DropdownMenuItem 
                                                className="rounded-xl px-3 py-2 cursor-pointer font-bold text-sm text-destructive focus:text-destructive"
                                                onClick={() => handleDelete(s.id, s.name)}
                                            >
                                                <Trash2 className="ml-2 h-4 w-4" /> حذف الحساب
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
      </div>

      {/* النافذة المنبثقة خارج الجدول تماماً لمنع التجميد */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-8">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#1A4B84]">
                      {editingSupervisor ? 'تعديل بيانات المشرف' : 'إضافة مشرف نظام جديد'}
                  </DialogTitle>
              </DialogHeader>
              <SupervisorForm 
                  key={editingSupervisor ? `edit-${editingSupervisor.id}` : 'new'} 
                  onSave={handleSave} 
                  supervisor={editingSupervisor} 
                  isSaving={isSaving} 
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}
