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
import { PlusCircle, UserX, FileClock, CheckCircle, XCircle, KeyRound, FilterX, MoreHorizontal } from "lucide-react";
import type { Supervisor } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
}: {
  supervisor?: Supervisor;
  onSave: (s: Supervisor) => void;
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

  const specializations: string[] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

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
            return { ...prev, specialization: [...prevSpecs, spec] };
        } else {
            return { ...prev, specialization: prevSpecs.filter(s => s !== spec) };
        }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you wouldn't do this. Mocking derived data.
    const mockExtraData = {
        lastSeen: new Date().toISOString(),
        connectionStatus: 'متصل',
        dailyOperationCount: supervisor?.dailyOperationCount || 0,
        monthlyOperationCount: supervisor?.monthlyOperationCount || 0,
        dailyTransferValue: supervisor?.dailyTransferValue || 0,
        monthlyTransferValue: supervisor?.monthlyTransferValue || 0,
    }
    onSave({...mockExtraData, ...formData} as Supervisor);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} required />
        </div>
      </div>
       <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
                <Input id="password" name="password" type="password" value={formData.password || ""} onChange={handleChange} required={!supervisor} placeholder={supervisor ? 'اتركه فارغاً لعدم التغيير' : "••••••••"} />
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
                        />
                        <Label htmlFor={`spec-${spec}`} className="font-normal">{spec}</Label>
                    </div>
                ))}
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="status">حالة الحساب</Label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md bg-background h-10 text-sm">
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
            </select>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
              <Label htmlFor="canEditExchangeRate">السماح بتعديل سعر الصرف</Label>
          </div>
          <Switch id="canEditExchangeRate" checked={formData.canEditExchangeRate} onCheckedChange={handleSwitchChange} />
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

  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [canEditRateFilter, setCanEditRateFilter] = useState("all");
  const [connectionStatusFilter, setConnectionStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");


  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (specializationFilter === "all" || item.specialization.includes(specializationFilter)) &&
        (canEditRateFilter === 'all' || (canEditRateFilter === 'مسموح' && item.canEditExchangeRate) || (canEditRateFilter === 'ممنوع' && !item.canEditExchangeRate)) &&
        (connectionStatusFilter === "all" || item.connectionStatus === connectionStatusFilter) &&
        (statusFilter === "all" || item.status === statusFilter)
    );
  }, [data, searchTerm, specializationFilter, canEditRateFilter, connectionStatusFilter, statusFilter]);
  
  const handleSave = (supervisor: Supervisor) => {
    if(editingSupervisor) {
        // Edit
        setData(data.map(d => d.id === editingSupervisor.id ? {...d, ...supervisor} : d));
        toast({ title: "تم تحديث البيانات بنجاح" });
    } else {
        // Add
        const newSupervisor = {...supervisor, id: `sup_${Date.now()}`};
        setData([newSupervisor, ...data]);
        toast({ title: "تمت إضافة مستخدم بنجاح" });
    }
    setDialogOpen(false);
    setEditingSupervisor(undefined);
  };
  
  const handleKick = (id: string) => {
      setData(data.map(d => d.id === id ? {...d, status: 'غير نشط'} : d));
      toast({ title: "تم طرد المستخدم", variant: 'destructive' });
  }

  const handleClearFilters = () => {
    setSearchTerm("");
    setSpecializationFilter("all");
    setCanEditRateFilter("all");
    setConnectionStatusFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="التخصص" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">كل التخصصات</SelectItem>
                    <SelectItem value="محفظة كاش">محفظة كاش</SelectItem>
                    <SelectItem value="انستاباي">انستاباي</SelectItem>
                    <SelectItem value="وصلني البيت">وصلني البيت</SelectItem>
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="حالة الحساب" /></SelectTrigger>
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
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingSupervisor(undefined)} className="w-full sm:w-auto">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة مستخدم
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingSupervisor ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
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
                <TableCell className="hidden lg:table-cell">{supervisor.specialization.length === 3 ? 'الكل' : supervisor.specialization.join(', ')}</TableCell>
                 <TableCell className="hidden md:table-cell text-center">
                    {supervisor.canEditExchangeRate ? <CheckCircle className="text-green-500 mx-auto"/> : <XCircle className="text-red-500 mx-auto"/>}
                 </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={cn('flex items-center gap-1.5 w-fit', connectionStatusColors[supervisor.connectionStatus], `hover:${connectionStatusColors[supervisor.connectionStatus]}`)}>
                    <span className={cn('h-2 w-2 rounded-full', supervisor.connectionStatus === 'متصل' ? 'bg-green-600' : 'bg-stone-500')}></span>
                    {supervisor.connectionStatus}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs">{new Date(supervisor.lastSeen).toLocaleString('ar-EG-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
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
                        <span>طرد</span>
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
