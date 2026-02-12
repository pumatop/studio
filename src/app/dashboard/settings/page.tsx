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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>حدود المعاملات والتحويلات</CardTitle>
          <CardDescription>
            إدارة الحدود الدنيا والقصوى للمعاملات المختلفة للعملية الواحدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Internal Transfer LYD */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold text-lg">التحويل الداخلي (بالدينار الليبي)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internal-min">الحد الأدنى (د.ل)</Label>
                <Input id="internal-min" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal-max">الحد الأقصى (د.ل)</Label>
                <Input id="internal-max" type="number" defaultValue="5000" />
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">التحويلات إلى مصر (بالجنيه المصري)</h3>
            <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                    <Label className="font-medium">حدود التحويل عبر انستاباي</Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="instapay-min" className="text-sm text-muted-foreground">الحد الأدنى (ج.م)</Label>
                            <Input id="instapay-min" type="number" defaultValue="100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instapay-max" className="text-sm text-muted-foreground">الحد الأقصى (ج.م)</Label>
                            <Input id="instapay-max" type="number" defaultValue="50000" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                    <Label className="font-medium">حدود التحويل عبر محفظة كاش</Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="wallet-min" className="text-sm text-muted-foreground">الحد الأدنى (ج.م)</Label>
                            <Input id="wallet-min" type="number" defaultValue="100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wallet-max" className="text-sm text-muted-foreground">الحد الأقصى (ج.م)</Label>
                            <Input id="wallet-max" type="number" defaultValue="30000" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                    <Label className="font-medium">حدود التحويل عبر وصلني البيت</Label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="delivery-min" className="text-sm text-muted-foreground">الحد الأدنى (ج.م)</Label>
                            <Input id="delivery-min" type="number" defaultValue="1000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="delivery-max" className="text-sm text-muted-foreground">الحد الأقصى (ج.م)</Label>
                            <Input id="delivery-max" type="number" defaultValue="100000" />
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button>حفظ التغييرات</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
