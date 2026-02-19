"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
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
  DropdownMenuSeparator,
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
import { PlusCircle, UserX, FileClock, CheckCircle, XCircle, KeyRound, FilterX, MoreHorizontal, Trash2, FileDown, Printer } from "lucide-react";
import type { Supervisor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn, exportToCsv } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRtdbList, useDatabase, setRtdb, updateRtdb, removeRtdb } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";


const connectionStatusColors: Record<Supervisor["connectionStatus"], string> = {
  "متصل": "bg-green-100 text-green-800",
  "غير متصل": "bg-stone-100 text-stone-800",
};

const statusColors: Record<Supervisor["status"], string> = {
  "نشط": "bg-green-100 text-green-800",
  "غير نشط": "bg-red-100 text-red-800",
};


function SupervisorForm({
  supervisor,
  onSave,
  isSaving,
}: {
  supervisor?: Supervisor;
  onSave: (s: Partial<Supervisor>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Supervisor>>(
    supervisor || {
      name: "",
      phone: "",
      canEditExchangeRate: false,
      specialization: [],
      status: 'نشط',
      password: ""
    }
  );

  const specializations: Supervisor['specialization'] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} required disabled={isSaving} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} required disabled={isSaving}/>
        </div>
      </div>
       <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
                <Input id="password" name="password" type="password" value={formData.password || ""} onChange={handleChange} required={!supervisor} placeholder={supervisor ? 'اتركه فارغاً لعدم التغيير' : "••••••••"} disabled={isSaving} />
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>التخصص</Label>
            <div className="space-y-2 rounded-lg border p-3">
                {specializations.map(spec => (
                    <div key={spec} className="flex items-center gap-2">
                        <Checkbox
                            id={`spec-${spec}`}
                            checked={formData.specialization?.includes(spec)}
                            onCheckedChange={(checked) => handleSpecializationChange(spec, !!checked)}
                             disabled={isSaving}
                        />
                        <Label htmlFor={`spec-${spec}`} className="font-normal">{spec}</Label>
                    </div>
                ))}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="status">حالة الحساب</Label>
            <Select name="status" value={formData.status} onValueChange={(v) => setFormData(p => ({...p, status: v as any}))} disabled={isSaving}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="غير نشط">غير نشط</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
              <Label htmlFor="canEditExchangeRate">السماح بتعديل سعر الصرف</Label>
          </div>
          <Switch id="canEditExchangeRate" checked={formData.canEditExchangeRate} onCheckedChange={handleSwitchChange} disabled={isSaving} />
      </div>

      <DialogFooter>
        <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={isSaving}>{isSaving ? "جاري الحفظ..." : "حفظ"}</Button>
      </DialogFooter>
    </form>
  );
}

export function SupervisorsDataTable({ initialData }: { initialData: Supervisor[] }) {
  const { data: supervisors, isLoading } = useRtdbList<Supervisor>("/supervisors");
  const { database } = useDatabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | undefined>(undefined);
  const { toast } = useToast();

  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");


  const filteredData = useMemo(() => {
    if (!initialData) return [];
    return initialData.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (specializationFilter === "all" || item.specialization?.includes(specializationFilter as any)) &&
        (statusFilter === "all" || item.status === statusFilter)
    );
  }, [initialData, searchTerm, specializationFilter, statusFilter]);
  
  const handleSave = async (supervisorData: Partial<Supervisor>) => {
    setIsSaving(true);
    try {
        if (editingSupervisor) {
            const path = `/supervisors/${editingSupervisor.id}`;
            await updateRtdb(database, path, supervisorData);
            toast({ title: "تم تحديث البيانات بنجاح" });
        } else {
            const newId = `sup_${Date.now()}`;
            const path = `/supervisors/${newId}`;
            const newSupervisorData = {
                ...supervisorData,
                connectionStatus: 'غير متصل',
                lastSeen: new Date().toISOString(),
            };
            await setRtdb(database, path, newSupervisorData);
            toast({ title: "تمت إضافة مستخدم بنجاح" });
        }
        setDialogOpen(false);
        setEditingSupervisor(undefined);
    } catch(error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleKick = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من تعطيل هذا الحساب؟")) return;
      try {
        await updateRtdb(database, `/supervisors/${id}`, { status: 'غير نشط' });
        toast({ title: "تم تعطيل حساب المستخدم" });
      } catch(e: any) {
        toast({ title: "حدث خطأ", description: e.message, variant: 'destructive' });
      }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المشرف "${name}" بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
      try {
          await removeRtdb(database, `/supervisors/${id}`);
          toast({ title: "تم حذف المشرف بنجاح", variant: 'destructive' });
      } catch (error: any) {
          toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
      }
  }

  const handleClearFilters = () => {
    setSearchTerm("");
    setSpecializationFilter("all");
    setStatusFilter("all");
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
      if (format === 'csv') {
        exportToCsv('supervisors.csv', filteredData);
      } else {
        toast({
            title: "خاصية قيد التطوير",
            description: `سيتم إضافة تصدير الملفات بصيغة ${format.toUpperCase()} قريباً.`,
        });
      }
  };

  const handlePrint = () => {
      window.print();
  };
  
  if (!supervisors && isLoading) {
    return (
       <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-grow">
            <Input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-[150px]"><SelectValue placeholder="التخصص" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل التخصصات</SelectItem>
                    <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
                    <SelectItem value="انستاباي">انستاباي</SelectItem>
                    <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-[150px]"><SelectValue placeholder="حالة الحساب" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="نشط">نشط</SelectItem>
                    <SelectItem value="غير نشط">غير نشط</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}>
              <FilterX className="ml-2 h-4 w-4" />
              مسح
            </Button>
        </div>
        <div className="flex items-center gap-2 self-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="ml-2 h-4 w-4" />
                طباعة
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if(!open) setEditingSupervisor(undefined);
                setDialogOpen(open);
            }}>
                <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة مستخدم
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingSupervisor ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                    </DialogHeader>
                    <SupervisorForm onSave={handleSave} supervisor={editingSupervisor} isSaving={isSaving} />
                </DialogContent>
            </Dialog>
        </div>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead className="hidden lg:table-cell">التخصص</TableHead>
              <TableHead className="hidden md:table-cell">تعديل السعر</TableHead>
              <TableHead className="hidden md:table-cell">حالة الاتصال</TableHead>
              <TableHead className="hidden lg:table-cell">آخر ظهور</TableHead>
              <TableHead>حالة الحساب</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((supervisor) => (
              <TableRow key={supervisor.id} className={cn(supervisor.status === 'غير نشط' && 'bg-red-50/50 opacity-60')}>
                <TableCell>
                    <div className="font-medium">{supervisor.name}</div>
                    <div className="text-muted-foreground text-xs">{supervisor.phone}</div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{supervisor.specialization?.join(', ') || 'غير محدد'}</TableCell>
                 <TableCell className="hidden md:table-cell text-center">
                    {supervisor.canEditExchangeRate ? <CheckCircle className="text-green-500 mx-auto"/> : <XCircle className="text-red-500 mx-auto"/>}
                 </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={cn('flex items-center gap-1.5 w-fit', connectionStatusColors[supervisor.connectionStatus], `hover:${connectionStatusColors[supervisor.connectionStatus]}`)}>
                    <span className={cn('h-2 w-2 rounded-full', supervisor.connectionStatus === 'متصل' ? 'bg-green-600' : 'bg-stone-500')}></span>
                    {supervisor.connectionStatus}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs">{new Date(supervisor.lastSeen).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</TableCell>
                <TableCell>
                  <Badge className={cn(statusColors[supervisor.status], `hover:${statusColors[supervisor.status]}`)}>
                      {supervisor.status}
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
                      <DropdownMenuItem onClick={() => { setEditingSupervisor(supervisor); setDialogOpen(true); }}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/supervisors/${supervisor.id}/log`}>
                            <FileClock className="ml-2 h-4 w-4" />
                            <span>السجل</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleKick(supervisor.id)} disabled={supervisor.status === 'غير نشط'} className="text-destructive">
                        <UserX className="ml-2 h-4 w-4"/>
                        <span>تعطيل</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(supervisor.id, supervisor.name)} className="text-destructive focus:text-destructive">
                        <Trash2 className="ml-2 h-4 w-4"/>
                        <span>حذف نهائي</span>
                      </DropdownMenuItem>
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
