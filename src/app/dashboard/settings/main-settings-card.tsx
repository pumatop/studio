"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ShieldOff, Smartphone, UserPlus, Wrench, PlusCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRtdbObject, useRtdbList, useDatabase, updateRtdb, removeRtdb, setRtdb } from "@/firebase";
import type { MainSettings, AppVersion } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

function VersionForm({ version, onSave, isSaving }: { version?: AppVersion; onSave: (data: Omit<AppVersion, 'id' | 'createdAt'>) => void; isSaving: boolean; }) {
  const [formData, setFormData] = useState<Partial<Omit<AppVersion, 'id' | 'createdAt'>>>(
    version ? {
        versionName: version.versionName,
        versionCode: version.versionCode,
        description: version.description,
        changelog: version.changelog,
    } : {
      versionName: "",
      versionCode: undefined,
      description: "",
      changelog: "",
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({...prev, [name]: type === 'number' ? parseInt(value, 10) : value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.versionName || !formData.versionCode || !formData.description || !formData.changelog) {
      return;
    }
    onSave(formData as Omit<AppVersion, 'id' | 'createdAt'>);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="versionName">اسم الإصدار (e.g., 1.0.0)</Label>
                <Input id="versionName" name="versionName" value={formData.versionName} onChange={handleChange} required disabled={isSaving} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="versionCode">كود الإصدار (e.g., 100)</Label>
                <Input id="versionCode" name="versionCode" type="number" value={formData.versionCode || ''} onChange={handleChange} required disabled={isSaving} />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="description">وصف الإصدار</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} required disabled={isSaving} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="changelog">سجل التغييرات (كل تغيير في سطر)</Label>
            <Textarea id="changelog" name="changelog" value={formData.changelog} onChange={handleChange} required rows={5} disabled={isSaving} />
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSaving}>إلغاء</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? "جاري الحفظ..." : "حفظ الإصدار"}
            </Button>
        </DialogFooter>
    </form>
  )
}


function AppVersionManager() {
  const { data: versions, isLoading } = useRtdbList<AppVersion>('/appVersions');
  const { database } = useDatabase();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | undefined>(undefined);

  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => b.createdAt - a.createdAt);
  }, [versions]);

  const handleSave = async (data: Omit<AppVersion, 'id' | 'createdAt'>) => {
    setIsSaving(true);
    try {
        if (editingVersion) {
            const path = `/appVersions/${editingVersion.id}`;
            await updateRtdb(database, path, data);
            toast({ title: "تم تحديث الإصدار بنجاح" });
        } else {
            const id = `v${data.versionCode}`;
            const path = `/appVersions/${id}`;
            const newVersion = { ...data, createdAt: Date.now() };
            await setRtdb(database, path, newVersion);
            toast({ title: "تمت إضافة الإصدار بنجاح" });
        }
        setDialogOpen(false);
    } catch (error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
        setEditingVersion(undefined);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإصدار؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
        await removeRtdb(database, `/appVersions/${versionId}`);
        toast({ title: "تم حذف الإصدار بنجاح", variant: "destructive"});
    } catch (error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive"});
    }
  };

  const openDialogForEdit = (version: AppVersion) => {
    setEditingVersion(version);
    setDialogOpen(true);
  };
  
  const openDialogForNew = () => {
    setEditingVersion(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">إدارة إصدارات التطبيق</h3>
            <Button variant="outline" size="sm" onClick={openDialogForNew}>
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة إصدار
            </Button>
        </div>
        {isLoading ? (
            <div className="border rounded-lg p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>الإصدار</TableHead>
                            <TableHead>الوصف</TableHead>
                            <TableHead>تاريخ الإضافة</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedVersions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">لا توجد إصدارات حالياً.</TableCell>
                            </TableRow>
                        ) : sortedVersions.map(version => (
                            <TableRow key={version.id}>
                                <TableCell>
                                    <div className="font-bold">{version.versionName}</div>
                                    <div className="text-xs text-muted-foreground">({version.versionCode})</div>
                                </TableCell>
                                <TableCell>{version.description}</TableCell>
                                <TableCell className="text-xs">{new Date(version.createdAt).toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric'})}</TableCell>
                                <TableCell className="text-left">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">فتح القائمة</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openDialogForEdit(version)}>تعديل</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(version.id)} className="text-destructive focus:text-destructive">حذف</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
         <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingVersion(undefined);
            setDialogOpen(open);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingVersion ? "تعديل الإصدار" : "إضافة إصدار جديد"}</DialogTitle>
                </DialogHeader>
                <VersionForm onSave={handleSave} isSaving={isSaving} version={editingVersion} />
            </DialogContent>
        </Dialog>
    </div>
  );
}

export function MainSettingsCard() {
  const { data: settings, isLoading } = useRtdbObject<MainSettings>('/settings/main');
  const { database } = useDatabase();
  const { toast } = useToast();
  
  const handleSettingChange = async (settingName: keyof MainSettings, value: boolean, label: string) => {
    try {
        await updateRtdb(database, '/settings/main', { [settingName]: value });
        toast({
          title: "تم تحديث الإعدادات",
          description: `${label} الآن في وضع ${value ? "التفعيل" : "الإيقاف"}.`,
        });
    } catch(error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <Card className="w-full">
        <CardHeader>
          <CardTitle>الإعدادات الرئيسية للنظام</CardTitle>
          <CardDescription>
            إدارة إعدادات الصيانة والتحديثات الإجبارية والتسجيل.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                    <Label htmlFor="maintenance-mode" className="flex items-center gap-2 font-semibold">
                        <Wrench className="h-5 w-5 text-destructive" />
                        وضع الصيانة
                    </Label>
                    <p className="text-xs text-muted-foreground pt-1">
                        سيتم تعطيل التطبيق بالكامل لجميع المستخدمين.
                    </p>
                    </div>
                    <Switch
                    id="maintenance-mode"
                    checked={settings?.isMaintenance || false}
                    onCheckedChange={(checked) => {
                        handleSettingChange("isMaintenance", checked, "وضع الصيانة");
                    }}
                    className="data-[state=checked]:bg-destructive"
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                    <Label htmlFor="otp-verification" className="flex items-center gap-2 font-semibold">
                        <ShieldOff className="h-5 w-5 text-orange-500" />
                        إيقاف التحقق (OTP)
                    </Label>
                    <p className="text-xs text-muted-foreground pt-1">
                        عند التفعيل، لن يتم إرسال أكواد التحقق للمستخدمين.
                    </p>
                    </div>
                    <Switch
                    id="otp-verification"
                    checked={settings?.isOtpDisabled || false}
                    onCheckedChange={(checked) => {
                        handleSettingChange("isOtpDisabled", checked, "إيقاف التحقق (OTP)");
                    }}
                    className="data-[state=checked]:bg-orange-500"
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                    <Label htmlFor="disable-registration" className="flex items-center gap-2 font-semibold">
                        <UserPlus className="h-5 w-5 text-destructive" />
                        تعطيل التسجيل
                    </Label>
                    <p className="text-xs text-muted-foreground pt-1">
                        منع المستخدمين الجدد من إنشاء حسابات.
                    </p>
                    </div>
                    <Switch
                    id="disable-registration"
                    checked={settings?.isRegistrationDisabled || false}
                    onCheckedChange={(checked) => {
                        handleSettingChange("isRegistrationDisabled", checked, "تعطيل التسجيل");
                    }}
                    className="data-[state=checked]:bg-destructive"
                    />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                    <Label htmlFor="force-update" className="flex items-center gap-2 font-semibold">
                        <Smartphone className="h-5 w-5 text-primary" />
                        تحديث إجباري
                    </Label>
                    <p className="text-xs text-muted-foreground pt-1">
                        إجبار المستخدمين على التحديث إلى آخر إصدار.
                    </p>
                    </div>
                    <Switch
                    id="force-update"
                    checked={settings?.forceUpdate || false}
                    onCheckedChange={(checked) => {
                        handleSettingChange("forceUpdate", checked, "التحديث الإجباري");
                    }}
                    />
                </div>
            </div>
            
            {settings?.forceUpdate && (
                <>
                    <Separator className="my-6" />
                    <AppVersionManager />
                </>
            )}
        </CardContent>
    </Card>
  );
}
