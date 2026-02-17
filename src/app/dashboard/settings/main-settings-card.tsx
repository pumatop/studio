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
import { ShieldOff, Smartphone, UserPlus, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRtdbObject, useDatabase, updateRtdb } from "@/firebase";
import type { MainSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>الصيانة والتحديثات</CardTitle>
          <CardDescription>
            إدارة إعدادات الصيانة والتحديثات الإجبارية للتطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>الأمان والتسجيل</CardTitle>
          <CardDescription>
            التحكم في آليات التحقق من الهوية وتسجيل الحسابات الجديدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
