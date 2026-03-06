"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, Phone, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Agent, Region, AppSettings } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRtdbObject, useDatabase, updateRtdb, useStorage } from "@/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const floatingCardClass = "bg-card shadow-xl border-none hover:shadow-2xl transition-all duration-300 rounded-2xl";
const innerCardClass = "bg-[#dbe3ea] dark:bg-slate-900/50 shadow-sm rounded-xl border border-black/5 dark:border-white/5";
const deepInnerCardClass = "bg-card border border-black/10 dark:border-white/10 rounded-lg p-3";
const inputLevel4Class = "bg-background border-black/5 dark:border-white/10 focus:bg-card transition-colors font-mono";

function BannerContent({ url }: { url: string }) {
    const isVideo = ['.mp4', '.webm', '.ogg'].some(ext => url.toLowerCase().includes(ext));

    if (isVideo) {
        return (
            <video
                src={url}
                controls
                className="w-full h-full object-cover"
            >
                متصفحك لا يدعم عرض الفيديو.
            </video>
        );
    }
    return <Image src={url} alt="Banner" layout="fill" objectFit="cover" />;
}


export function AppSettingsCard() {
    const { data: settings, isLoading } = useRtdbObject<AppSettings>('/settings/app');
    const { database } = useDatabase();
    const storage = useStorage();
    const { toast } = useToast();

    const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({ banners: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (settings) {
            const validBanners = (Array.isArray(settings.banners) ? settings.banners : Object.values(settings.banners || {})).filter(Boolean);
            setLocalSettings({...settings, banners: validBanners});
        }
    }, [settings]);

    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setLocalSettings(prev => ({...prev, [key]: value}));
    };
    
    const handleRegionChange = (regions: {[key: string]: Region}) => {
        handleSettingChange('regions', regions);
    }

    const handleAddRegion = () => {
        const newId = `region_${Date.now()}`;
        const newRegion: Region = { name: "منطقة جديدة", agents: {} };
        const updatedRegions = {...localSettings.regions, [newId]: newRegion};
        handleRegionChange(updatedRegions);
    };
    
    const handleDeleteRegion = (regionId: string) => {
        const updatedRegions = {...localSettings.regions};
        delete (updatedRegions as any)[regionId];
        handleRegionChange(updatedRegions);
        toast({ title: "تم حذف المنطقة", variant: "destructive" });
    };

    const handleRegionNameChange = (regionId: string, newName: string) => {
        const updatedRegions = {...localSettings.regions};
        (updatedRegions as any)[regionId].name = newName;
        handleRegionChange(updatedRegions);
    };

    const handleAddAgent = (regionId: string) => {
        const newAgentId = `agent_${Date.now()}`;
        const newAgent: Agent = { name: "", phone: "", address: "" };

        const updatedRegions = JSON.parse(JSON.stringify(localSettings.regions || {}));
        if (!updatedRegions[regionId].agents) {
            updatedRegions[regionId].agents = {};
        }
        updatedRegions[regionId].agents[newAgentId] = newAgent;
        handleRegionChange(updatedRegions);
    };

    const handleDeleteAgent = (regionId: string, agentId: string) => {
        const updatedRegions = JSON.parse(JSON.stringify(localSettings.regions || {}));
        if (updatedRegions[regionId] && updatedRegions[regionId].agents) {
            delete updatedRegions[regionId].agents[agentId];
            handleRegionChange(updatedRegions);
            toast({ title: "تم حذف الوكيل", variant: "destructive" });
        }
    };
    
    const handleAgentChange = (regionId: string, agentId: string, field: keyof Agent, value: string) => {
        const updatedRegions = JSON.parse(JSON.stringify(localSettings.regions || {}));
        if (updatedRegions[regionId] && updatedRegions[regionId].agents && updatedRegions[regionId].agents[agentId]) {
            updatedRegions[regionId].agents[agentId][field] = value;
            handleRegionChange(updatedRegions);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const settingsToSave = {
                ...localSettings,
                banners: (localSettings.banners || []).filter(Boolean)
            };
            await updateRtdb(database, '/settings/app', settingsToSave);
            toast({ title: "تم حفظ إعدادات التطبيق" });
        } catch (error: any) {
             toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        toast({
            title: "جاري رفع الملف...",
            description: "قد يستغرق هذا بعض الوقت حسب حجم الملف."
        });

        try {
            const fileRef = storageRef(storage, `banners/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const newBanners = [...(localSettings.banners || []), downloadURL];
            await updateRtdb(database, '/settings/app', { banners: newBanners });

            toast({
                title: "تم رفع وإضافة البانر بنجاح!",
                description: "تم تحديث قاعدة البيانات تلقائياً.",
            });
        } catch (error: any) {
            console.error("Upload/DB error:", error);
            toast({
                title: "فشل رفع الملف أو تحديث القاعدة",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleDeleteBanner = async (index: number) => {
        setDeletingIndex(index);

        const banners = localSettings.banners || [];
        const bannerUrlToDelete = banners[index];
        
        if (!bannerUrlToDelete) {
            toast({ title: "خطأ", description: "لم يتم العثور على رابط البانر.", variant: "destructive" });
            setDeletingIndex(null);
            return;
        }

        try {
            const fileRef = storageRef(storage, bannerUrlToDelete);
            await deleteObject(fileRef);
            
            const newBanners = banners.filter((_, i) => i !== index);
            await updateRtdb(database, '/settings/app', { banners: newBanners });

            toast({
                title: "تم حذف البانر بنجاح",
                description: "تم حذف الملف من الخادم وقاعدة البيانات.",
                variant: "destructive"
            });

        } catch (error: any) {
            console.error("Error deleting banner:", error);
            if (error.code === 'storage/object-not-found') {
                toast({
                    title: "الملف غير موجود بالتخزين",
                    description: "سيتم حذفه من قاعدة البيانات فقط.",
                    variant: "destructive"
                });
                try {
                    const newBanners = banners.filter((_, i) => i !== index);
                    await updateRtdb(database, '/settings/app', { banners: newBanners });
                } catch (dbError: any) {
                    toast({ title: "خطأ بحذف البيانات", description: dbError.message, variant: "destructive" });
                }
            } else {
                toast({
                    title: "فشل حذف البانر",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setDeletingIndex(null);
        }
    };


    if (isLoading) {
        return <Skeleton className="h-[600px] w-full" />;
    }

    return (
        <Card className={cn(floatingCardClass, "w-full")} dir="rtl">
            <CardHeader className="text-right">
                <CardTitle>إعدادات التطبيق</CardTitle>
                <CardDescription>إدارة الإعدادات العامة واللوحة الدعائية وبيانات الدعم.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                    disabled={isUploading}
                />
                
                <div className={cn("space-y-4 p-4 text-right", innerCardClass)}>
                    <div className="flex items-center justify-between flex-row-reverse">
                         <h3 className="font-semibold text-lg">اللوحة الدعائية للتطبيق</h3>
                         <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-card border-black/10 dark:border-white/10">
                            {isUploading ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="ml-2 h-4 w-4" />
                            )}
                            إضافة بانر
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        يمكنك إضافة صور أو مقاطع فيديو. بعد الإضافة، يتم الحفظ في قاعدة البيانات تلقائياً.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(localSettings.banners || []).map((bannerUrl, index) => (
                            <div key={index} className="relative group aspect-video rounded-md border border-black/10 dark:border-white/10 bg-card overflow-hidden">
                                <BannerContent url={bannerUrl} />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteBanner(index)} disabled={isUploading || deletingIndex !== null}>
                                        {deletingIndex === index ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {isUploading && (
                             <div className="relative aspect-video rounded-md border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center bg-card overflow-hidden">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <span className="text-sm">جاري الرفع...</span>
                                </div>
                             </div>
                         )}
                    </div>
                     {(!localSettings.banners || localSettings.banners?.length === 0) && !isUploading && (
                        <div className="text-center py-8 text-muted-foreground">
                            لا توجد بانرات إعلانية حالياً.
                        </div>
                     )}
                </div>
                
                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={cn("space-y-4 p-4 text-right", innerCardClass)}>
                        <div className="flex items-center justify-between flex-row-reverse">
                            <h3 className="font-semibold text-lg">صفحة شحن المحفظة (الوكلاء)</h3>
                             <Button variant="outline" size="sm" onClick={handleAddRegion} className="bg-card border-black/10 dark:border-white/10">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إضافة منطقة
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                             {!localSettings.regions || Object.keys(localSettings.regions).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">لا توجد مناطق حالياً.</p> :
                             <Accordion type="multiple" className="w-full">
                                {Object.entries(localSettings.regions).map(([regionId, region]) => (
                                    <AccordionItem value={regionId} key={regionId} className="border-b-0 mb-2">
                                        <div className="flex items-center gap-2 flex-row-reverse">
                                            <AccordionTrigger className="border border-black/10 dark:border-white/10 rounded-md px-3 hover:no-underline flex-1 bg-card">
                                                <Input
                                                    value={region.name}
                                                    onChange={e => handleRegionNameChange(regionId, e.target.value)}
                                                    placeholder="اسم المنطقة"
                                                    className={cn("font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent text-right", inputLevel4Class.split(' ')[0])}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </AccordionTrigger>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => handleDeleteRegion(regionId)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <AccordionContent className="pt-2">
                                          <div className="space-y-3 border-l border-black/5 dark:border-white/5 pl-4 ml-4">
                                            {!region.agents || Object.keys(region.agents).length === 0 ? <p className="text-sm text-muted-foreground text-center py-2">لا يوجد وكلاء في هذه المنطقة.</p> :
                                            Object.entries(region.agents).map(([agentId, agent]) => (
                                                 <div key={agentId} className={cn("flex flex-col gap-2", deepInnerCardClass)}>
                                                     <div className="flex items-center justify-between flex-row-reverse">
                                                        <Input
                                                            value={agent.name}
                                                            onChange={e => handleAgentChange(regionId, agentId, 'name', e.target.value)}
                                                            placeholder="اسم الوكيل"
                                                            className="font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent text-right"
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeleteAgent(regionId, agentId)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                     </div>
                                                      <div className="space-y-2">
                                                        <div className="relative">
                                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                             <Input value={agent.phone} onChange={e => handleAgentChange(regionId, agentId, 'phone', e.target.value)} placeholder="رقم الهاتف" className={cn("pr-10 h-9 text-right", inputLevel4Class)} />
                                                        </div>
                                                         <div className="relative">
                                                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input value={agent.address} onChange={e => handleAgentChange(regionId, agentId, 'address', e.target.value)} placeholder="العنوان" className={cn("pr-10 h-9 text-right", inputLevel4Class)} />
                                                        </div>
                                                      </div>
                                                 </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => handleAddAgent(regionId)} className="mt-2 bg-card border-black/10 dark:border-white/10 w-full">
                                                <PlusCircle className="ml-2 h-4 w-4" />
                                                إضافة وكيل
                                            </Button>
                                          </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                             </Accordion>
                            }
                        </div>
                    </div>

                     <div className={cn("space-y-4 p-4 text-right", innerCardClass)}>
                        <h3 className="font-semibold text-lg">صفحة الدعم الفني</h3>
                        <div className="space-y-4">
                            <div className={cn("space-y-2", deepInnerCardClass)}>
                                <Label htmlFor="support-ly" className="font-bold">رقم الهاتف الليبي</Label>
                                <Input id="support-ly" name="libyan" value={localSettings.supportNumbers?.libyan || ''} onChange={(e) => handleSettingChange('supportNumbers', {...localSettings.supportNumbers, libyan: e.target.value})} className={cn("text-right", inputLevel4Class)} />
                            </div>
                            <div className={cn("space-y-2", deepInnerCardClass)}>
                                <Label htmlFor="support-eg" className="font-bold">رقم الهاتف المصري</Label>
                                <Input id="support-eg" name="egyptian" value={localSettings.supportNumbers?.egyptian || ''} onChange={(e) => handleSettingChange('supportNumbers', {...localSettings.supportNumbers, egyptian: e.target.value})} className={cn("text-right", inputLevel4Class)} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button onClick={handleSave} className="w-full" disabled={isSaving || isUploading}>
                    {isSaving ? "جاري الحفظ..." : "حفظ إعدادات التطبيق"}
                </Button>
            </CardFooter>
        </Card>
    );
}
