import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>الاعدادات العامة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">اسم التطبيق</Label>
            <Input id="appName" defaultValue="كاشيات" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>الوضع الليلي</Label>
              <p className="text-xs text-muted-foreground">
                تفعيل المظهر الداكن للوحة التحكم.
              </p>
            </div>
            <Switch />
          </div>
          <Button>حفظ التغييرات</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>إشعارات البريد الإلكتروني</Label>
              <p className="text-xs text-muted-foreground">
                تلقي ملخص يومي بالمعاملات.
              </p>
            </div>
            <Switch defaultChecked/>
          </div>
           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>إشعارات داخل التطبيق</Label>
               <p className="text-xs text-muted-foreground">
                إظهار الإشعارات للمعاملات الجديدة.
              </p>
            </div>
            <Switch defaultChecked/>
          </div>
           <Button>حفظ التغييرات</Button>
        </CardContent>
      </Card>
    </div>
  );
}
