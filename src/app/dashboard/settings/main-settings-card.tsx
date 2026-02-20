"use client";

import { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ShieldOff, Smartphone, UserPlus, Wrench, PlusCircle, MoreHorizontal, Trash2, UploadCloud, Package, Apple, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRtdbObject, useRtdbList, useDatabase, updateRtdb, removeRtdb, setRtdb, useStorage } from "@/firebase";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import type { MainSettings, AppVersion } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

function VersionForm({ version, onSave, isSaving }: { version?: AppVersion; onSave: (data: Partial<AppVersion>, file: File | null, packageName: string) => void; isSaving: boolean; }) {
  const [formData, setFormData] = useState<Partial<AppVersion>>({});
  const [downloadType, setDownloadType] = useState<'none' | 'direct' | 'google'>('none');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [packageName, setPackageName] = useState('');

  useEffect(() => {
    if (version) {
        setFormData(version);
        if (version.directDownloadUrl) {
            setDownloadType('direct');
        } else if (version.googlePlayUrl) {
            setDownloadType('google');
            const id = version.googlePlayUrl.split('id=')[1];
            setPackageName(id || '');
        } else {
            setDownloadType('none');
        }
    } else {
        // Reset for new form
        setFormData({ versionName: "", versionCode: undefined, description: "", changelog: "" });
        setDownloadType('none');
        setFileToUpload(null);
        setPackageName('');
    }
  }, [version]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({...prev, [name]: type === 'number' ? parseInt(value, 10) : value}));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setFileToUpload(e.target.files[0]);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.versionName || !formData.versionCode) return;
    
    const finalData = {...formData};
    if (downloadType !== 'direct') finalData.directDownloadUrl = null;
    if (downloadType !== 'google') finalData.googlePlayUrl = null;

    onSave(finalData, fileToUpload, packageName);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="versionName">اسم الإصدار (e.g., 1.0.0)</Label>
                <Input id="versionName" name="versionName" value={formData.versionName || ''} onChange={handleChange} required disabled={isSaving} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="versionCode">كود الإصدار (e.g., 100)</Label>
                <Input id="versionCode" name="versionCode" type="number" value={formData.versionCode || ''} onChange={handleChange} required disabled={isSaving} />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="description">وصف الإصدار</Label>
            <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} required disabled={isSaving} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="changelog">سجل التغييرات (كل تغيير في سطر)</Label>
            <Textarea id="changelog" name="changelog" value={formData.changelog || ''} onChange={handleChange} required rows={5} disabled={isSaving} />
        </div>
        
        <Separator />
        
        <div className="space-y-4">
            <Label className="font-semibold">خيارات التحميل</Label>
             <RadioGroup value={downloadType} onValueChange={(v: any) => setDownloadType(v)} className="grid grid-cols-2 gap-4">
                 <div>
                    <RadioGroupItem value="direct" id="r-direct" className="peer sr-only" />
                    <Label htmlFor="r-direct" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <UploadCloud className="mr-2 h-4 w-4"/>
                        تحميل مباشر
                    </Label>
                 </div>
                 <div>
                    <RadioGroupItem value="google" id="r-google" className="peer sr-only" />
                     <Label htmlFor="r-google" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4 fill-current"><path d="M22.47 12.015c0-.81-.07-1.55-.19-2.25H12v4.26h5.88c-.26 1.37-1.04 2.53-2.19 3.32v2.79h3.57c2.08-1.92 3.28-4.74 3.28-8.12z" fill="#4285F4"/><path d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.57-2.79c-1.08.73-2.45 1.16-4.36 1.16-3.32 0-6.14-2.24-7.14-5.22H1.29v2.87C3.26 20.31 7.31 23 12 23z" fill="#34A853"/><path d="M4.86 13.77c-.18-.54-.29-1.12-.29-1.73s.11-1.19.29-1.73V7.45H1.29c-.65 1.32-1.04 2.79-1.04 4.38s.39 3.06 1.04 4.38l3.57-2.84z" fill="#FBBC05"/><path d="M12 4.54c1.75 0 3.33.61 4.58 1.8l3.16-3.16C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.27l3.57 2.87c1-2.98 3.82-5.22 7.14-5.22z" fill="#EA4335"/></svg>
                        متجر Google Play
                    </Label>
                 </div>
            </RadioGroup>
            
            {downloadType === 'direct' && (
                <div className="space-y-2 animate-in fade-in-0 duration-300">
                    <Label htmlFor="apkFile">ملف التطبيق (APK/AAB)</Label>
                    <Input id="apkFile" type="file" onChange={handleFileChange} accept=".apk,.aab" disabled={isSaving} />
                    {version?.directDownloadUrl && !fileToUpload && <p className="text-xs text-muted-foreground">تم رفع ملف مسبقاً. لست بحاجة لرفعه مرة أخرى إلا إذا أردت تغييره.</p>}
                </div>
            )}
            
            {downloadType === 'google' && (
                <div className="space-y-2 animate-in fade-in-0 duration-300">
                    <Label htmlFor="packageName">اسم حزمة التطبيق</Label>
                    <div className="relative">
                        <Input id="packageName" value={packageName} onChange={e => setPackageName(e.target.value)} placeholder="com.example.app" disabled={isSaving} className="pl-10"/>
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            )}
        </div>
        
        <div className="space-y-4 opacity-50">
            <Label className="font-semibold">المتاجر الأخرى (قيد التطوير)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="appleUrl">رابط متجر Apple</Label>
                    <Input id="appleUrl" disabled placeholder="https://apps.apple.com/..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="huaweiUrl">رابط متجر Huawei</Label>
                    <Input id="huaweiUrl" disabled placeholder="https://appgallery.huawei.com/..." />
                </div>
            </div>
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
  const storage = useStorage();
  const { toast } = useToast();
  
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingVersion, setEditingVersion] = useState<AppVersion | undefined>(undefined);

  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => b.versionCode - a.versionCode);
  }, [versions]);

  const handleSave = async (data: Partial<AppVersion>, file: File | null, packageName: string) => {
    setIsSaving(true);
    setUploadProgress(null);
    
    const dataToSave: Partial<AppVersion> = {...data};

    try {
        if (file) {
            const fileRef = storageRef(storage, `app_updates/${data.versionCode}_${file.name}`);
            const uploadTask = uploadBytesResumable(fileRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }
            );

            await uploadTask;
            dataToSave.directDownloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            toast({ title: "تم رفع الملف بنجاح" });
        }

        if (packageName) {
            dataToSave.googlePlayUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
        }

        if (editingVersion) {
            const path = `/appVersions/${editingVersion.id}`;
            await updateRtdb(database, path, dataToSave);
            toast({ title: "تم تحديث الإصدار بنجاح" });
        } else {
            const id = `v${data.versionCode}`;
            const path = `/appVersions/${id}`;
            const newVersion = { ...dataToSave, createdAt: Date.now(), id: id };
            await setRtdb(database, path, newVersion);
            toast({ title: "تمت إضافة الإصدار بنجاح" });
        }
        setDialogOpen(false);
    } catch (error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
        setUploadProgress(null);
        setEditingVersion(undefined);
    }
  };

  const handleDelete = async (version: AppVersion) => {
    if (!window.confirm(`هل أنت متأكد من حذف الإصدار "${version.versionName}"؟ سيتم حذف الملف المرتبط به من الخادم.`)) return;
    try {
        // Delete file from storage if URL exists
        if (version.directDownloadUrl) {
            try {
                const fileRef = storageRef(storage, version.directDownloadUrl);
                await deleteObject(fileRef);
                toast({
                    title: "تم حذف الملف من التخزين",
                    description: "تم حذف ملف التطبيق المرتبط بهذا الإصدار.",
                });
            } catch (storageError: any) {
                if (storageError.code === 'storage/object-not-found') {
                     toast({
                        variant: 'default',
                        title: "ملاحظة",
                        description: "لم يتم العثور على الملف في التخزين، سيتم حذفه من قاعدة البيانات فقط.",
                    });
                } else {
                    // For other errors, re-throw to be caught by the outer catch block
                    throw storageError;
                }
            }
        }
        // Delete the version entry from Realtime Database
        await removeRtdb(database, `/appVersions/${version.id}`);
        toast({ title: "تم حذف الإصدار بنجاح", variant: "destructive"});
    } catch (error: any) {
        toast({ title: "حدث خطأ أثناء الحذف", description: error.message, variant: "destructive"});
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
                            <TableHead>روابط التحميل</TableHead>
                            <TableHead>تاريخ الإضافة</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedVersions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">لا توجد إصدارات حالياً.</TableCell>
                            </TableRow>
                        ) : sortedVersions.map(version => (
                            <TableRow key={version.id}>
                                <TableCell>
                                    <div className="font-bold">{version.versionName}</div>
                                    <div className="text-xs text-muted-foreground">({version.versionCode})</div>
                                </TableCell>
                                <TableCell>{version.description}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {version.directDownloadUrl && <a href={version.directDownloadUrl} target="_blank" title="رابط مباشر"><LinkIcon className="h-4 w-4 text-primary" /></a>}
                                        {version.googlePlayUrl && <a href={version.googlePlayUrl} target="_blank" title="متجر جوجل بلاي"><svg role="img" viewBox="0 0 512 512" className="h-4 w-4"><path fill="#4184f3" d="M343 241v-30l-91-53-91 53v30z"/><path fill="#3165c4" d="M161 211l91 53 91-53-45-26-92 53z"/><path fill="#f3ba03" d="M31 168v176l130 76V92z"/><path fill="#f2c80c" d="M161 92v258l-130-76z"/><path fill="#e53935" d="M161 211v139l137 78V166z"/><path fill="#b92d2b" d="M161 350V211l137-45v184z"/><path fill="#0f9d58" d="M343 241l138-80v161l-138 80z"/><path fill="#12b264" d="M481 161l-138 80v-45l92-53z"/></svg></a>}
                                        {version.appleStoreUrl && <a href={version.appleStoreUrl} target="_blank" title="متجر آبل"><Apple className="h-4 w-4" /></a>}
                                    </div>
                                </TableCell>
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
                                            <DropdownMenuItem onClick={() => handleDelete(version)} className="text-destructive focus:text-destructive">حذف</DropdownMenuItem>
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingVersion ? "تعديل الإصدار" : "إضافة إصدار جديد"}</DialogTitle>
                </DialogHeader>
                {isSaving && uploadProgress !== null && (
                    <div className="space-y-2">
                        <Label>جاري رفع الملف...</Label>
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                    </div>
                )}
                 {isSaving && uploadProgress === null && (
                     <div className="flex items-center justify-center gap-2 py-4">
                         <Loader2 className="h-5 w-5 animate-spin" />
                         <span>جاري الحفظ والمعالجة...</span>
                     </div>
                 )}
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
