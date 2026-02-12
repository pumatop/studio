"use client";

import { useState } from "react";
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

export function ExchangeControlCard() {
  const { toast } = useToast();
  const [isExchangeOpen, setExchangeOpen] = useState(true);
  const [isAutoMode, setAutoMode] = useState(false);
  const [currentRate, setCurrentRate] = useState(9.65);
  const [autoCondition, setAutoCondition] = useState("amount");
  const [autoAmount, setAutoAmount] = useState(500000);
  const [autoTime, setAutoTime] = useState("22:00");
  const [autoNextRate, setAutoNextRate] = useState(9.7);

  const handleSave = () => {
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث إعدادات سعر الصرف بنجاح.",
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>التحكم في الصرف</CardTitle>
        <CardDescription>
          إدارة حالة الصرف وتحديث الأسعار.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* Exchange Status */}
        <div className="space-y-4">
           <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="exchange-status" className="font-semibold">الصرف مفتوح</Label>
              <p className="text-xs text-muted-foreground">
                فتح أو إغلاق الصرف بشكل نهائي.
              </p>
            </div>
            <Switch
              id="exchange-status"
              checked={isExchangeOpen}
              onCheckedChange={setExchangeOpen}
              aria-label="Toggle exchange status"
            />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="auto-mode" className="font-semibold">التحكم التلقائي</Label>
              <p className="text-xs text-muted-foreground">
                تفعيل التغيير التلقائي للسعر.
              </p>
            </div>
            <Switch
              id="auto-mode"
              checked={isAutoMode}
              onCheckedChange={setAutoMode}
              aria-label="Toggle automatic control"
            />
          </div>
        </div>

        <Separator />

        {/* Exchange Rate */}
        <div className="space-y-2">
          <Label htmlFor="current-rate" className="font-semibold">سعر الصرف الحالي (LYD/EGP)</Label>
          <div className="relative">
            <Input
              id="current-rate"
              type="number"
              value={currentRate}
              onChange={(e) => setCurrentRate(parseFloat(e.target.value))}
              className="text-lg font-bold pr-16"
              step="0.01"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
              ج.م
            </span>
          </div>
        </div>

        {/* Automatic Rate Change */}
        {isAutoMode && (
            <>
            <Separator />
            <div className="space-y-4 animate-in fade-in-0 duration-500">
                <h3 className="font-semibold text-base">شروط التغيير التلقائي</h3>
                <RadioGroup
                    value={autoCondition}
                    onValueChange={setAutoCondition}
                    className="grid grid-cols-2 gap-4"
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

                {autoCondition === "amount" && (
                    <div className="space-y-2 animate-in fade-in-0 duration-300">
                    <Label htmlFor="auto-amount">مبلغ التحويل المستهدف (د.ل)</Label>
                    <Input
                        id="auto-amount"
                        type="number"
                        value={autoAmount}
                        onChange={(e) => setAutoAmount(parseInt(e.target.value, 10))}
                    />
                    </div>
                )}
                {autoCondition === "time" && (
                    <div className="space-y-2 animate-in fade-in-0 duration-300">
                    <Label htmlFor="auto-time">الوقت المحدد للتغيير</Label>
                    <Input
                        id="auto-time"
                        type="time"
                        value={autoTime}
                        onChange={(e) => setAutoTime(e.target.value)}
                    />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="auto-next-rate">السعر الجديد المستهدف</Label>
                    <Input
                    id="auto-next-rate"
                    type="number"
                    value={autoNextRate}
                    onChange={(e) => setAutoNextRate(parseFloat(e.target.value))}
                    step="0.01"
                    />
                </div>
            </div>
            </>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          حفظ الإعدادات
        </Button>
      </CardFooter>
    </Card>
  );
}
