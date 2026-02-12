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
    <Card>
      <CardHeader>
        <CardTitle>التحكم في الصرف والسعر</CardTitle>
        <CardDescription>
          إدارة حالة الصرف وتحديث الأسعار بشكل يدوي أو تلقائي.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exchange Status */}
        <div className="space-y-4">
          <h3 className="font-medium text-base">حالة الصرف</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="exchange-status">الصرف مفتوح</Label>
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
              <Label htmlFor="auto-mode">التحكم التلقائي</Label>
              <p className="text-xs text-muted-foreground">
                تفعيل التحكم التلقائي حسب مبلغ التحويل (LYD/EGP).
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
        <div className="space-y-4">
          <h3 className="font-medium text-base">سعر الصرف الحالي (LYD/EGP)</h3>
          <div className="relative">
            <Input
              id="current-rate"
              type="number"
              value={currentRate}
              onChange={(e) => setCurrentRate(parseFloat(e.target.value))}
              className="text-lg pr-12"
              step="0.001"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              ج.م
            </span>
          </div>
        </div>

        <Separator />

        {/* Automatic Rate Change */}
        <div className="space-y-4">
          <h3 className="font-medium text-base">التغيير التلقائي للسعر</h3>
          <p className="text-sm text-muted-foreground">
            قم بتحديد شرط لتغيير سعر الصرف تلقائيًا إلى سعر جديد.
          </p>
          <RadioGroup
            value={autoCondition}
            onValueChange={setAutoCondition}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="amount" id="r-amount" />
              <Label htmlFor="r-amount">عند الوصول لمبلغ معين</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="time" id="r-time" />
              <Label htmlFor="r-time">عند الوصول لوقت معين</Label>
            </div>
          </RadioGroup>

          {autoCondition === "amount" && (
            <div className="space-y-2">
              <Label htmlFor="auto-amount">مبلغ التحويل (د.ل)</Label>
              <Input
                id="auto-amount"
                type="number"
                value={autoAmount}
                onChange={(e) => setAutoAmount(parseInt(e.target.value, 10))}
              />
            </div>
          )}
          {autoCondition === "time" && (
            <div className="space-y-2">
              <Label htmlFor="auto-time">الوقت المحدد</Label>
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
              step="0.001"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">
          حفظ الإعدادات
        </Button>
      </CardFooter>
    </Card>
  );
}
