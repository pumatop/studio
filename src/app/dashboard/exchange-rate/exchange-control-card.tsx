
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { RateCondition, ExchangeControlSettings, User, Transaction } from "@/lib/types";
import { Clock, DollarSign, PlusCircle, Trash2, Activity, TrendingUp, Loader2, Info } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRtdbObject, useDatabase, updateRtdb, pushRtdb, useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const floatingCardClass = "bg-card shadow-xl border-none hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden";
const innerLevelCardClass = "bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border dark:border-white/5 p-6 space-y-4";
const deepInnerCardClass = "bg-white dark:bg-slate-950 border dark:border-white/5 rounded-2xl p-4 shadow-sm";
const inputLevel4Class = "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:border-primary transition-all rounded-xl h-12 font-bold tabular-nums text-right";

function NewConditionForm({ onSave }: { onSave: (condition: Omit<RateCondition, 'id' | 'createdBy'>) => void }) {
    const [type, setType] = useState<'amount' | 'time'>('amount');
    const [value, setValue] = useState<string>('');
    const [targetRate, setTargetRate] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value || !targetRate) return;
        onSave({
            type,
            value: type === 'amount' ? parseFloat(value) : value,
            targetRate: parseFloat(targetRate),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 text-right" dir="rtl">
             <div className="space-y-3">
                <Label className="font-black text-foreground text-xs uppercase tracking-widest block">نوع الشرط</Label>
                 <RadioGroup value={type} onValueChange={(v: 'amount' | 'time') => setType(v)} className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <RadioGroupItem value="amount" id="r-amount" className="peer sr-only" />
                        <Label htmlFor="r-amount" className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-card p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer font-bold text-sm text-center h-20">
                            عند الوصول لمبلغ
                        </Label>
                    </div>
                    <div className="relative">
                        <RadioGroupItem value="time" id="r-time" className="peer sr-only" />
                        <Label htmlFor="r-time" className="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-card p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer font-bold text-sm text-center h-20">
                            عند الوصول لوقت
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {type === 'amount' && (
                 <div className="space-y-2">
                    <Label htmlFor="cond-value-amount" className="font-bold text-slate-500">مبلغ التحويل المستهدف (ج.م)</Label>
                    <Input id="cond-value-amount" type="number" value={value} onChange={e => setValue(e.target.value)} required className={inputLevel4Class} />
                 </div>
            )}
            {type === 'time' && (
                 <div className="space-y-2">
                    <Label htmlFor="cond-value-time" className="font-bold text-slate-500">الوقت المحدد (24 ساعة)</Label>
                    <Input id="cond-value-time" type="time" value={value} onChange={e => setValue(e.target.value)} required className={inputLevel4Class} />
                 </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="cond-target-rate" className="font-bold text-slate-500">السعر الجديد المستهدف</Label>
                <Input id="cond-target-rate" type="number" value={targetRate} onChange={e => setTargetRate(e.target.value)} step="0.01" required className={inputLevel4Class} />
            </div>

            <DialogFooter className="gap-2 flex-row-reverse">
                <DialogClose asChild><Button type="button" variant="ghost" className="rounded-xl font-bold">إلغاء</Button></DialogClose>
                <Button type="submit" className="rounded-xl font-black bg-primary px-8">إضافة الشرط</Button>
            </DialogFooter>
        </form>
    );
}

export function ExchangeControlCard() {
  const { data: settings, isLoading: settingsLoading } = useRtdbObject<ExchangeControlSettings>('/settings/exchangeControl');
  
  const todayKey = useMemo(() => {
    const tz = settings?.timezone || "Africa/Cairo";
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: tz, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(new Date());
  }, [settings?.timezone]);

  // جلب البيانات التراكمية مباشرة من مسار الإحصائيات اليومية
  const { data: dayStats } = useRtdbObject<{totalEgpAmount: number}>(`/dailyAggregates/${todayKey}`);
  
  const { database } = useDatabase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState<Partial<ExchangeControlSettings>>({});
  const [isFormOpen, setFormOpen] = useState(false);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previousRateRef = useRef<number | undefined>();

  const actualDailyVolume = dayStats?.totalEgpAmount || 0;
  
  useEffect(() => {
    if (settings) {
      if (previousRateRef.current !== undefined && previousRateRef.current !== settings.currentRate) {
        toast({
            title: "تنبيه النظام",
            description: `تم تحديث سعر الصرف تلقائياً إلى: ${settings.currentRate.toFixed(2)}`,
        });
      }
      setLocalSettings(settings);
      previousRateRef.current = settings.currentRate;
    }
  }, [settings, toast]);

  useEffect(() => {
    setServerTime(new Date());
    const timerId = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleSettingChange = (key: keyof ExchangeControlSettings, value: any) => {
    setLocalSettings(prev => ({...prev, [key]: value}));
  };

  const handleAddCondition = (condition: Omit<RateCondition, 'id' | 'createdBy'>) => {
    const newCondition: RateCondition = {
        ...condition,
        id: `cond_${Date.now()}`,
        createdBy: currentUser?.displayName || 'Admin'
    };
    const currentConditions = localSettings.conditions ? Object.values(localSettings.conditions) : [];
    const newConditionsObject = [...currentConditions, newCondition].reduce((acc, cond) => {
        acc[cond.id] = cond;
        return acc;
    }, {} as {[key: string]: RateCondition});

    handleSettingChange('conditions', newConditionsObject);
    toast({ title: "تم تجهيز الشرط", description: "سيتم تفعيل الشرط عند الضغط على حفظ الإعدادات." });
    setFormOpen(false);
  };

  const handleDeleteCondition = (id: string) => {
    if (!localSettings.conditions) return;
    const newConditions = {...localSettings.conditions};
    delete newConditions[id];
    handleSettingChange('conditions', newConditions);
    toast({ title: "تم حذف الشرط مؤقتاً", variant: 'destructive' });
  }

  const handleSave = async () => {
    if (typeof localSettings.currentRate !== 'number') {
        toast({ title: "خطأ في البيانات", description: "الرجاء إدخال سعر صرف صحيح.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        if (settings && localSettings.currentRate !== settings.currentRate) {
            const logPath = '/exchangeRateLogs';
            await pushRtdb(database, logPath, {
                date: new Date().toISOString(),
                modifiedBy: currentUser?.displayName || 'المسؤول',
                oldRate: settings.currentRate,
                newRate: localSettings.currentRate,
                currencyPair: "LYD/EGP",
            });
        }
        await updateRtdb(database, '/settings/exchangeControl', localSettings);
        toast({ title: "تم حفظ الإعدادات بنجاح", description: "النظام والوظائف الخلفية تعمل الآن بالإعدادات الجديدة." });
    } catch (error: any) {
        toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  if (settingsLoading) return <Skeleton className="h-[800px] w-full rounded-[2.5rem]" />;

  return (
    <Card className={floatingCardClass} dir="rtl">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-white/5 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-right">
                <div className="p-4 bg-primary/10 rounded-2xl"><Activity className="h-7 w-7 text-primary" /></div>
                <div>
                    <CardTitle className="text-2xl font-black text-[#001F3D] dark:text-foreground">مركز التحكم في الصرف</CardTitle>
                    <CardDescription className="text-sm font-bold text-slate-400 mt-1">إدارة السيولة، الأسعار، والأتمتة الذكية في الوقت الفعلي.</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border dark:border-white/5">
                <Clock className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-lg font-black tabular-nums">{serverTime?.toLocaleTimeString("ar-EG-u-nu-latn", { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        <div className={innerLevelCardClass}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-[#1B69FF]">حالة النشاط والسيولة</h3>
              <Badge className={cn("rounded-full px-4 py-1 font-black text-[10px] border-none", localSettings.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {localSettings.isOpen ? "نظام الصرف متاح" : "نظام الصرف متوقف"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn("flex flex-col items-center justify-center p-4 cursor-help", deepInnerCardClass)}>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <Info className="h-3.5 w-3.5 text-slate-300" />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">من اين يجلب قيمة التداول</span>
                                <span className="text-2xl font-black tabular-nums">{(actualDailyVolume).toLocaleString('en-US')} <span className="text-xs">ج.م</span></span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] rounded-2xl p-4 bg-card shadow-2xl border-none" side="top">
                            <div className="space-y-2 text-right" dir="rtl">
                                <p className="font-black text-xs text-primary">آلية الجلب التراكمية</p>
                                <p className="text-[10px] font-bold leading-relaxed text-slate-500">
                                    يتم جلب هذه القيمة مباشرة من المسار التراكمي في قاعدة البيانات: 
                                    <code className="block mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary break-all">dailyAggregates/{todayKey}/totalEgpAmount</code>
                                    يتم تحديث هذا المسار بشكل "ذري" (Atomic) عبر وظائف الخادم فور اكتمال أي معاملة ناجحة.
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <RadioGroup value={localSettings.mode} onValueChange={(v: "manual" | "auto") => handleSettingChange('mode', v)} className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-center p-2 rounded-xl border dark:border-white/5 bg-white dark:bg-slate-950 has-[:checked]:border-primary transition-all">
                        <RadioGroupItem value="manual" id="r-manual" className="ml-2" />
                        <Label htmlFor="r-manual" className="font-bold text-xs cursor-pointer">تحكم يدوي</Label>
                    </div>
                    <div className="flex items-center justify-center p-2 rounded-xl border dark:border-white/5 bg-white dark:bg-slate-950 has-[:checked]:border-primary transition-all">
                        <RadioGroupItem value="auto" id="r-auto" className="ml-2" />
                        <Label htmlFor="r-auto" className="font-bold text-xs cursor-pointer">إغلاق تلقائي ذكي</Label>
                    </div>
                </RadioGroup>
            </div>

            {localSettings.mode === 'manual' ? (
                 <div className={cn("flex items-center justify-between", deepInnerCardClass)}>
                    <Label htmlFor="ex-status" className="font-black text-sm">تغيير حالة الصرف الآن</Label>
                    <Switch id="ex-status" checked={localSettings.isOpen} onCheckedChange={(c) => handleSettingChange('isOpen', c)} className="data-[state=checked]:bg-green-600 scale-110" />
                </div>
            ) : (
                <div className={cn("space-y-3", deepInnerCardClass)}>
                    <Label className="font-black text-[10px] uppercase block">سقف تداول اليوم (ج.م) - سيتم الإغلاق فور الوصول له</Label>
                    <Input type="number" value={localSettings.autoCloseThreshold} onChange={(e) => handleSettingChange('autoCloseThreshold', parseInt(e.target.value, 10))} className={inputLevel4Class} />
                </div>
            )}
        </div>
        
        <div className={innerLevelCardClass}>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-black text-[10px] uppercase tracking-widest text-[#1B69FF]">سعر الصرف الحالي (LYD/EGP)</Label>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="text-[9px] font-black text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
                            كيف يتم تغيير سعر الصرف ؟
                            <Info className="h-3 w-3" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] rounded-2xl p-4 bg-card shadow-2xl border-none" side="top">
                        <div className="space-y-2 text-right" dir="rtl">
                            <p className="font-black text-xs text-primary">آلية تغيير السعر</p>
                            <p className="text-[10px] font-bold leading-relaxed text-slate-500">
                                يتم تغيير السعر بطريقتين:
                                <br />
                                1. <span className="text-foreground">يدوياً:</span> عبر تعديل القيمة في هذا الحقل والضغط على زر الحفظ في الأسفل.
                                <br />
                                2. <span className="text-foreground">آلياً:</span> عبر "الشروط التلقائية" (وقت أو مبلغ) التي قمت بضبطها؛ حيث تقوم الوظائف الخلفية للسيرفر بتحديث القيمة فور تحقق الشرط.
                                <br />
                                <span className="text-orange-600 block mt-1 font-black">هام: كل تغيير (يدوي أو آلي) يتم توثيقه فوراً في "سجل التغييرات" للرقابة.</span>
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
          <div className={cn("relative p-2", deepInnerCardClass)}>
            <Input
              type="number"
              value={localSettings.currentRate ?? ''}
              onChange={(e) => handleSettingChange('currentRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={cn("text-3xl font-black pl-16 text-left border-none shadow-none focus-visible:ring-0 bg-transparent h-14", inputLevel4Class)}
              step="0.01"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">ج.م</span>
          </div>
        </div>

        <div className={innerLevelCardClass}>
            <div className={cn("flex items-center justify-between p-4", deepInnerCardClass)}>
                <div className="text-right">
                    <Label className="font-black text-sm block">تفعيل الشروط التلقائية</Label>
                    <p className="text-[10px] text-slate-400 font-bold">تغيير السعر آلياً حسب الوقت أو حجم السيولة</p>
                </div>
                <Switch checked={localSettings.autoConditionsActive} onCheckedChange={(c) => handleSettingChange('autoConditionsActive', c)} className="data-[state=checked]:bg-primary scale-110" />
            </div>

            <div className="flex items-center justify-between mt-6">
                 <h3 className="font-black text-[10px] uppercase tracking-widest text-[#1B69FF]">قائمة الشروط المجدولة</h3>
                 <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!localSettings.autoConditionsActive} className="rounded-xl font-bold h-9 text-xs">
                            <PlusCircle className="ml-2 h-4 w-4" /> إضافة شرط
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-card" dir="rtl">
                        <DialogHeader><DialogTitle className="text-2xl font-black text-right">إضافة شرط تغيير آلي</DialogTitle></DialogHeader>
                        <NewConditionForm onSave={handleAddCondition} />
                    </DialogContent>
                 </Dialog>
            </div>
            
            <div className={cn("space-y-3 transition-all max-h-64 overflow-y-auto custom-scrollbar", !localSettings.autoConditionsActive && "opacity-30 pointer-events-none grayscale")}>
                {!localSettings.conditions || Object.keys(localSettings.conditions).length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed dark:border-white/5 rounded-2xl"><p className="text-xs font-bold text-slate-400">لا توجد شروط نشطة حالياً.</p></div>
                ) : (
                    Object.values(localSettings.conditions).map(condition => (
                    <div key={condition.id} className={cn("flex items-center justify-between group", deepInnerCardClass)}>
                       <div className="flex items-center gap-4 text-right">
                            <div className="p-3 bg-primary/5 rounded-xl">{condition.type === 'amount' ? <DollarSign className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-primary" />}</div>
                            <div>
                                <p className="text-sm font-bold">
                                    {condition.type === 'amount' ? `عند تداول ${Number(condition.value).toLocaleString()} ج.م` : `عند الوصول للساعة ${condition.value}`}
                                </p>
                                <span className="text-[10px] font-black text-primary">السعر المستهدف الجديد: {Number(condition.targetRate).toFixed(2)}</span>
                            </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCondition(condition.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                )))}
            </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-8 pt-0">
        <Button onClick={handleSave} className="w-full rounded-2xl h-14 text-lg font-black bg-[#1B69FF] shadow-xl shadow-primary/20" disabled={isSaving}>
          {isSaving ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : "حفظ وتفعيل كافة الإعدادات"}
        </Button>
      </CardFooter>
    </Card>
  );
}
