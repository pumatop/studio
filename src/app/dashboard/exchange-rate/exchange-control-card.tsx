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
import { Clock, DollarSign, PlusCircle, Trash2, Info } from "lucide-react";
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
             <div>
                <Label>نوع الشرط</Label>
                 <RadioGroup
                    value={type}
                    onValueChange={(v: 'amount' | 'time') => setType(v)}
                    className="grid grid-cols-2 gap-4 mt-2"
                >
                    <div>
                        <RadioGroupItem value="amount" id="r-amount" className="peer sr-only" />
                        <Label htmlFor="r-amount" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            عند الوصول لمبلغ
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="time" id="r-time" className="peer sr-only" />
                        <Label htmlFor="r-time" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            عند الوصول لوقت
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {type === 'amount' && (
                 <div className="space-y-2">
                    <Label htmlFor="cond-value-amount">مبلغ التحويل المستهدف (جنيه مصري)</Label>
                    <Input id="cond-value-amount" type="number" value={value} onChange={e => setValue(e.target.value)} required />
                 </div>
            )}
            {type === 'time' && (
                 <div className="space-y-2">
                    <Label htmlFor="cond-value-time">الوقت المحدد للتغيير</Label>
                    <Input id="cond-value-time" type="time" value={value} onChange={e => setValue(e.target.value)} required />
                 </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="cond-target-rate">السعر الجديد المستهدف</Label>
                <Input id="cond-target-rate" type="number" value={targetRate} onChange={e => setTargetRate(e.target.value)} step="0.01" required />
            </div>

            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">إلغاء</Button>
                </DialogClose>
                <Button type="submit">إضافة الشرط</Button>
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
  h = ((h + 11) % 12) + 1; // Convert 24h to 12h
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
            title: <div className="flex items-center gap-2"><Info /> <span>تم تحديث السعر تلقائياً</span></div>,
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
        // Check if the current rate has been changed manually
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
    return <Skeleton className="h-[700px] w-full" />
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>التحكم في الصرف</CardTitle>
        <CardDescription>
          إدارة حالة الصرف وتحديث الأسعار بشكل يدوي وتلقائي.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        
        {/* Exchange Status */}
        <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">حالة الصرف</h3>
              <Badge
                  variant={localSettings.isOpen ? "default" : "destructive"}
                  className={localSettings.isOpen ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}
              >
                  {localSettings.isOpen ? "مفتوح" : "مغلق"}
              </Badge>
            </div>
             <RadioGroup
                value={localSettings.mode}
                onValueChange={(v: "manual" | "auto") => handleSettingChange('mode', v)}
                className="flex gap-4"
            >
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="manual" id="r-manual" />
                    <Label htmlFor="r-manual">يدوي</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="auto" id="r-auto" />
                    <Label htmlFor="r-auto">تلقائي</Label>
                </div>
            </RadioGroup>

            {localSettings.mode === 'manual' && (
                 <div className="flex items-center justify-between rounded-lg border p-4 animate-in fade-in-0 duration-300">
                    <div>
                        <Label htmlFor="exchange-status" className="font-semibold">فتح/غلق الصرف يدوي</Label>
                    </div>
                    <Switch
                        id="exchange-status"
                        checked={localSettings.isOpen}
                        onCheckedChange={(checked) => handleSettingChange('isOpen', checked)}
                        aria-label="Toggle exchange status"
                        className="data-[state=checked]:bg-green-600"
                    />
                </div>
            )}
             {localSettings.mode === 'auto' && (
                <div className="space-y-2 animate-in fade-in-0 duration-300">
                    <Label htmlFor="auto-close-threshold">إغلاق الصرف عند وصول التداول إلى جنيه مصري</Label>
                    <Input
                        id="auto-close-threshold"
                        type="number"
                        value={localSettings.autoCloseThreshold}
                        onChange={(e) => handleSettingChange('autoCloseThreshold', parseInt(e.target.value, 10))}
                    />
                </div>
            )}
        </div>
        
        <Separator />

        {/* Current Exchange Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="current-rate" className="font-semibold">سعر الصرف الحالي (LYD/EGP)</Label>
            <span className="text-sm text-primary font-bold">
              {serverTime ? serverTime.toLocaleTimeString("ar-EG-u-nu-latn", {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              }) : '--:--:--'}
            </span>
          </div>
          <div className="relative">
            <Input
              id="current-rate"
              type="number"
              value={localSettings.currentRate ?? ''}
              onChange={(e) => handleSettingChange('currentRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="text-lg font-bold pl-16 text-left"
              step="0.01"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
              ج.م
            </span>
          </div>
        </div>

        <Separator />

        {/* Timezone Setting */}
        <div className="space-y-2">
          <Label htmlFor="timezone-select" className="font-semibold">المنطقة الزمنية</Label>
          <p className="text-xs text-muted-foreground">
            تُستخدم هذه المنطقة الزمنية للتحقق من شروط تغيير السعر المستندة إلى الوقت.
          </p>
          <Select
            value={localSettings.timezone}
            onValueChange={(value) => handleSettingChange('timezone', value)}
          >
            <SelectTrigger id="timezone-select">
              <SelectValue placeholder="اختر منطقة زمنية..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Cairo">توقيت القاهرة (EET)</SelectItem>
              <SelectItem value="Asia/Riyadh">توقيت الرياض (AST)</SelectItem>
              <SelectItem value="UTC">التوقيت العالمي المنسق (UTC)</SelectItem>
              <SelectItem value="Europe/London">توقيت لندن (GMT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Automatic Rate Change Conditions */}
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <Label htmlFor="auto-conditions-switch">تفعيل الشروط التلقائية</Label>
                    <p className="text-xs text-muted-foreground">في حال الإيقاف، لن يتم تطبيق أي شرط من الشروط أدناه.</p>
                </div>
                <Switch
                    id="auto-conditions-switch"
                    checked={localSettings.autoConditionsActive}
                    onCheckedChange={(checked) => handleSettingChange('autoConditionsActive', checked)}
                    className="data-[state=checked]:bg-green-600"
                />
            </div>

            <div className="flex items-center justify-between">
                 <h3 className="font-semibold text-base">شروط التغيير التلقائي للسعر</h3>
                 <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!localSettings.autoConditionsActive}>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            إضافة شرط
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة شرط جديد</DialogTitle>
                        </DialogHeader>
                        <NewConditionForm onSave={handleAddCondition} />
                    </DialogContent>
                 </Dialog>
            </div>
            
            <div className={cn("space-y-2 transition-opacity", !localSettings.autoConditionsActive && "opacity-50 pointer-events-none")}>
                {!localSettings.conditions || Object.keys(localSettings.conditions).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">لا توجد شروط حالياً.</p>
                ) : (
                    Object.values(localSettings.conditions).map(condition => (
                    <div key={condition.id} className="flex items-center justify-between rounded-lg border p-3">
                       <div className="flex items-center gap-3">
                            {condition.type === 'amount' ? <DollarSign className="h-5 w-5 text-muted-foreground" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                            <div className="text-sm">
                                <p>
                                    {condition.type === 'amount' ? `عند وصول المبلغ إلى` : `عند وصول الوقت إلى`}
                                    <span className="font-bold mx-1">{typeof condition.value === 'number' ? condition.value.toLocaleString('en-US') : condition.type === 'time' ? formatTime12h(condition.value as string) : condition.value}</span>
                                    {condition.type === 'amount' && ` جنيه مصري،`}
                                    غيّر السعر إلى <span className="font-bold mx-1">{condition.targetRate.toFixed(2)}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">أضافها: {condition.createdBy}</p>
                            </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCondition(condition.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">حذف الشرط</span>
                       </Button>
                    </div>
                )))}
            </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </CardFooter>
    </Card>
  );
}