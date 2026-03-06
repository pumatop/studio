"use client";

import { useState, useEffect, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { RateCondition, ExchangeControlSettings } from "@/lib/types";
import { Clock, DollarSign, PlusCircle, Trash2, Info, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRtdbObject, useDatabase, updateRtdb, pushRtdb, useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const floatingCardClass = "floating-card h-full flex flex-col p-2";
const innerLevelCardClass = "bg-[#E3F2FD]/50 dark:bg-primary/5 rounded-[2rem] border border-[#1B69FF]/5 p-6 space-y-4";
const deepInnerCardClass = "bg-background dark:bg-slate-900/50 border border-[#1B69FF]/5 rounded-2xl p-4 shadow-sm";
const inputLevel4Class = "bg-background dark:bg-slate-950 border-[#1B69FF]/10 focus:border-primary transition-all rounded-xl h-12 font-bold tabular-nums";

function NewConditionForm({ onSave }: { onSave: (condition: Omit<RateCondition, 'id' | 'createdBy'>) => void }) {
    const [type, setType] = useState<'amount' | 'time'>('amount');
    const [value, setValue] = useState<string>('');
    const [targetRate, setTargetRate] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value || !targetRate) {
          return;
        }
        onSave({
            type,
            value: type === 'amount' ? parseFloat(value) : value,
            targetRate: parseFloat(targetRate),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
             <div>
                <Label className="font-black text-foreground text-xs uppercase tracking-widest mb-3 block">نوع الشرط</Label>
                 <RadioGroup
                    value={type}
                    onValueChange={(v: 'amount' | 'time') => setType(v)}
                    className="grid grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="amount" id="r-amount" className="peer sr-only" />
                        <Label htmlFor="r-amount" className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-card p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-[#E3F2FD]/30 dark:peer-data-[state=checked]:bg-primary/10 transition-all cursor-pointer font-bold text-sm text-center">
                            عند الوصول لمبلغ
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="time" id="r-time" className="peer sr-only" />
                        <Label htmlFor="r-time" className="flex flex-col items-center justify-between rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-card p-4 hover:bg-slate-50 dark:hover:bg-slate-900 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-[#E3F2FD]/30 dark:peer-data-[state=checked]:bg-primary/10 transition-all cursor-pointer font-bold text-sm text-center">
                            عند الوصول لوقت
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {type === 'amount' && (
                 <div className="space-y-2 text-right">
                    <Label htmlFor="cond-value-amount" className="font-bold text-slate-500 dark:text-slate-400">مبلغ التحويل المستهدف (جنيه مصري)</Label>
                    <Input id="cond-value-amount" type="number" value={value} onChange={e => setValue(e.target.value)} required className={inputLevel4Class} />
                 </div>
            )}
            {type === 'time' && (
                 <div className="space-y-2 text-right">
                    <Label htmlFor="cond-value-time" className="font-bold text-slate-500 dark:text-slate-400">الوقت المحدد للتغيير</Label>
                    <Input id="cond-value-time" type="time" value={value} onChange={e => setValue(e.target.value)} required className={inputLevel4Class} />
                 </div>
            )}

            <div className="space-y-2 text-right">
                <Label htmlFor="cond-target-rate" className="font-bold text-slate-500 dark:text-slate-400">السعر الجديد المستهدف</Label>
                <Input id="cond-target-rate" type="number" value={targetRate} onChange={e => setTargetRate(e.target.value)} step="0.01" required className={inputLevel4Class} />
            </div>

            <DialogFooter className="gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="ghost" className="rounded-xl font-bold">إلغاء</Button>
                </DialogClose>
                <Button type="submit" className="rounded-xl font-bold bg-[#1B69FF] hover:bg-[#1B69FF]/90 px-8">إضافة الشرط</Button>
            </DialogFooter>
        </form>
    );
}

function formatTime12h(timeString: string) {
  if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  const [hour, minute] = timeString.split(':');
  let h = parseInt(hour, 10);
  const suffix = h >= 12 ? 'م' : 'ص';
  h = ((h + 11) % 12) + 1;
  return `${h}:${minute} ${suffix}`;
}


export function ExchangeControlCard() {
  const { data: settings, isLoading } = useRtdbObject<ExchangeControlSettings>('/settings/exchangeControl');
  const { database } = useDatabase();
  const { user } = useUser();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState<Partial<ExchangeControlSettings & { currentRate: number | '' }>>({});
  const [isFormOpen, setFormOpen] = useState(false);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previousRateRef = useRef<number | undefined>();
  
  useEffect(() => {
    if (settings) {
      if (previousRateRef.current !== undefined && previousRateRef.current !== settings.currentRate) {
        toast({
            title: <div className="flex items-center gap-2"><Info className="text-blue-500"/> <span>تم تحديث السعر تلقائياً</span></div>,
            description: `السعر الجديد هو: ${settings.currentRate.toFixed(2)}`,
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
        createdBy: user?.displayName || 'Admin'
    };
    
    const currentConditions = localSettings.conditions ? 
        Object.values(localSettings.conditions) : 
        [];
    
    const newConditionsList = [...currentConditions, newCondition];
    const newConditionsObject = newConditionsList.reduce((acc, cond) => {
        acc[cond.id] = cond;
        return acc;
    }, {} as {[key: string]: RateCondition});

    handleSettingChange('conditions', newConditionsObject);
    toast({ title: "تم إضافة الشرط بنجاح" });
    setFormOpen(false);
  };

  const handleDeleteCondition = (id: string) => {
    if (!localSettings.conditions) return;
    const newConditions = {...localSettings.conditions};
    delete newConditions[id];
    handleSettingChange('conditions', newConditions);
    toast({ title: "تم حذف الشرط", variant: 'destructive' });
  }

  const handleSave = async () => {
    if (localSettings.currentRate === '' || localSettings.currentRate === null || typeof localSettings.currentRate === 'undefined') {
        toast({ title: "خطأ", description: "الرجاء إدخال سعر صرف صحيح.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        if (settings && typeof localSettings.currentRate === 'number' && localSettings.currentRate !== settings.currentRate) {
            const logPath = '/exchangeRateLogs';
            const newLog = {
                date: new Date().toISOString(),
                modifiedBy: user?.displayName || 'المسؤول',
                oldRate: settings.currentRate,
                newRate: localSettings.currentRate,
                currencyPair: "LYD/EGP",
            };
            await pushRtdb(database, logPath, newLog);
        }

        await updateRtdb(database, '/settings/exchangeControl', localSettings);
        toast({
          title: "تم حفظ الإعدادات",
          description: "تم تحديث إعدادات سعر الصرف بنجاح.",
        });
    } catch (error: any) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[800px] w-full rounded-[2.5rem]" />
  }

  return (
    <Card className={floatingCardClass}>
      <CardHeader className="pb-6">
        <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-right">
                <div className="p-4 bg-[#E3F2FD] dark:bg-primary/10 rounded-[1.5rem]"><Activity className="h-6 w-6 text-[#1B69FF]" /></div>
                <div>
                    <CardTitle className="text-foreground font-black text-2xl">التحكم في الصرف</CardTitle>
                    <CardDescription className="text-sm font-bold text-slate-400">إدارة حالة الصرف والأسعار</CardDescription>
                </div>
            </div>
            {/* Server Clock */}
            <div className="flex items-center gap-3 px-5 py-2.5 bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-[#1B69FF]/10 animate-in fade-in zoom-in duration-500">
                <Clock className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-lg text-foreground font-black tabular-nums tracking-tight">
                {serverTime ? serverTime.toLocaleTimeString("ar-EG-u-nu-latn", {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                }) : '--:--:--'}
                </span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-8">
        
        {/* Exchange Status */}
        <div className={innerLevelCardClass}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-foreground text-xs uppercase tracking-widest">حالة الصرف الحالية</h3>
              <Badge
                  className={cn(
                      "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest border",
                      localSettings.isOpen 
                        ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20" 
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20"
                  )}
              >
                  {localSettings.isOpen ? "مفتوح للعملاء" : "مغلق للصيانة"}
              </Badge>
            </div>
             <RadioGroup
                value={localSettings.mode}
                onValueChange={(v: "manual" | "auto") => handleSettingChange('mode', v)}
                className="grid grid-cols-2 gap-4"
            >
                <div className="flex items-center justify-center p-3 rounded-xl border border-[#1B69FF]/5 bg-card shadow-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                    <RadioGroupItem value="manual" id="r-manual" className="ml-2" />
                    <Label htmlFor="r-manual" className="font-bold text-sm cursor-pointer">تحكم يدوي</Label>
                </div>
                <div className="flex items-center justify-center p-3 rounded-xl border border-[#1B69FF]/5 bg-card shadow-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                    <RadioGroupItem value="auto" id="r-auto" className="ml-2" />
                    <Label htmlFor="r-auto" className="font-bold text-sm cursor-pointer">اغلاق تلقائي</Label>
                </div>
            </RadioGroup>

            {localSettings.mode === 'manual' && (
                 <div className={cn("flex items-center justify-between animate-in fade-in-0 duration-500", deepInnerCardClass)}>
                    <Label htmlFor="exchange-status" className="font-black text-foreground text-sm">تبديل الحالة يدوياً</Label>
                    <Switch
                        id="exchange-status"
                        checked={localSettings.isOpen}
                        onCheckedChange={(checked) => handleSettingChange('isOpen', checked)}
                        className="data-[state=checked]:bg-green-600 scale-110"
                    />
                </div>
            )}
             {localSettings.mode === 'auto' && (
                <div className={cn("space-y-3 animate-in fade-in-0 duration-500", deepInnerCardClass)}>
                    <Label htmlFor="auto-close-threshold" className="font-black text-foreground text-[10px] uppercase tracking-widest block text-right">سقف التداول قبل الإغلاق (ج.م)</Label>
                    <Input
                        id="auto-close-threshold"
                        type="number"
                        value={localSettings.autoCloseThreshold}
                        onChange={(e) => handleSettingChange('autoCloseThreshold', parseInt(e.target.value, 10))}
                        className={inputLevel4Class}
                    />
                </div>
            )}
        </div>
        
        {/* Current Exchange Rate */}
        <div className={innerLevelCardClass}>
          <Label htmlFor="current-rate" className="font-black text-foreground text-xs uppercase tracking-widest mb-2 block text-right">سعر الصرف (LYD/EGP)</Label>
          <div className={cn("relative p-2", deepInnerCardClass)}>
            <Input
              id="current-rate"
              type="number"
              value={localSettings.currentRate ?? ''}
              onChange={(e) => handleSettingChange('currentRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={cn("text-2xl font-black pl-16 text-left h-12 border-none shadow-none focus-visible:ring-0 bg-transparent", inputLevel4Class)}
              step="0.01"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-base font-black text-slate-300 dark:text-slate-600 pointer-events-none">
              ج.م
            </span>
          </div>
        </div>

        {/* Automatic Rate Change Conditions */}
        <div className={innerLevelCardClass}>
            <div className={cn("flex items-center justify-between p-4", deepInnerCardClass)}>
                <div className="space-y-1 text-right">
                    <Label htmlFor="auto-conditions-switch" className="font-black text-foreground text-sm block">تفعيل الشروط التلقائية</Label>
                    <p className="text-[10px] text-slate-400 font-bold">تطبيق التغييرات المجدولة للسعر</p>
                </div>
                <Switch
                    id="auto-conditions-switch"
                    checked={localSettings.autoConditionsActive}
                    onCheckedChange={(checked) => handleSettingChange('autoConditionsActive', checked)}
                    className="data-[state=checked]:bg-[#1B69FF] scale-110"
                />
            </div>

            <div className="flex items-center justify-between mt-6">
                 <h3 className="font-black text-foreground text-xs uppercase tracking-widest">جدول التغييرات</h3>
                 <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!localSettings.autoConditionsActive} className="rounded-xl bg-card border-[#1B69FF]/10 font-bold text-xs h-9 text-foreground">
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة شرط
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-foreground text-right">إضافة شرط جديد</DialogTitle>
                            <DialogDescription className="font-bold text-right">قم بتحديد معيار التغيير التلقائي لسعر الصرف.</DialogDescription>
                        </DialogHeader>
                        <NewConditionForm onSave={handleAddCondition} />
                    </DialogContent>
                 </Dialog>
            </div>
            
            <div className={cn("space-y-3 transition-all max-h-64 overflow-y-auto pr-2 custom-scrollbar", !localSettings.autoConditionsActive && "opacity-30 pointer-events-none grayscale")}>
                {!localSettings.conditions || Object.keys(localSettings.conditions).length === 0 ? (
                    <div className="text-center py-10 bg-background/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-[#1B69FF]/10">
                        <p className="text-xs font-bold text-slate-400">لا توجد شروط مجدولة حالياً.</p>
                    </div>
                ) : (
                    Object.values(localSettings.conditions).map(condition => (
                    <div key={condition.id} className={cn("flex items-center justify-between group hover:border-primary/20 transition-all", deepInnerCardClass)}>
                       <div className="flex items-center gap-4 text-right">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                                {condition.type === 'amount' ? <DollarSign className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                    {condition.type === 'amount' ? `عند تداول ` : `عند حلول الساعة `}
                                    <span className="font-black text-foreground mx-1">{typeof condition.value === 'number' ? condition.value.toLocaleString('en-US') : condition.type === 'time' ? formatTime12h(condition.value as string) : condition.value}</span>
                                    {condition.type === 'amount' && ` ج.م`}
                                </p>
                                <div className="flex items-center gap-2 mt-1 justify-start">
                                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">السعر الجديد: {condition.targetRate.toFixed(2)}</span>
                                    <span className="text-[9px] text-slate-400 font-bold">• بواسطة {condition.createdBy}</span>
                                </div>
                            </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCondition(condition.id)}>
                            <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                )))}
            </div>
        </div>

      </CardContent>
      <CardFooter className="pt-6 border-t border-slate-50 dark:border-slate-800 mt-4">
        <Button onClick={handleSave} className="w-full rounded-[1.5rem] shadow-xl shadow-primary/20 h-14 text-lg font-black bg-[#1B69FF] hover:bg-[#1B69FF]/90" disabled={isSaving}>
          {isSaving ? "جاري الحفظ..." : "حفظ كافة الإعدادات"}
        </Button>
      </CardFooter>
    </Card>
  );
}
