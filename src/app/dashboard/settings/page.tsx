"use client";

import { useState } from "react";
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
import { PlusCircle, Trash2 } from "lucide-react";
import type { FeeTier } from "@/lib/types";

// Initial Data
const initialInternalFees: FeeTier[] = [
  { id: "int_1", from: 1, to: 1000, fee: 1 },
  { id: "int_2", from: 1001, to: 5000, fee: 2 },
];
const initialWalletFees: FeeTier[] = [
  { id: "wal_1", from: 1, to: 5000, fee: 10 },
  { id: "wal_2", from: 5001, to: 30000, fee: 20 },
];
const initialInstapayFees: FeeTier[] = [
  { id: "ins_1", from: 1, to: 10000, fee: 15 },
  { id: "ins_2", from: 10001, to: 50000, fee: 25 },
];
const initialDeliveryFees: FeeTier[] = [
  { id: "del_1", from: 1, to: 10000, fee: 100 },
  { id: "del_2", from: 10001, to: 100000, fee: 150 },
];

function FeeTierManager({
  title,
  currency,
  tiers,
  setTiers,
}: {
  title: string;
  currency: string;
  tiers: FeeTier[];
  setTiers: React.Dispatch<React.SetStateAction<FeeTier[]>>;
}) {
  const handleAddTier = () => {
    setTiers([...tiers, { id: `tier_${Date.now()}`, from: 0, to: 0, fee: 0 }]);
  };

  const handleDeleteTier = (id: string) => {
    setTiers(tiers.filter((tier) => tier.id !== id));
  };

  const handleTierChange = (
    id: string,
    field: keyof Omit<FeeTier, "id">,
    value: string
  ) => {
    setTiers(
      tiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: Number(value) } : tier
      )
    );
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="space-y-3">
        {tiers.length > 0 && (
          <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-center">
            <Label className="text-xs text-muted-foreground">
              من مبلغ ({currency})
            </Label>
            <Label className="text-xs text-muted-foreground">
              إلى مبلغ ({currency})
            </Label>
            <Label className="text-xs text-muted-foreground">
              قيمة الرسوم ({currency})
            </Label>
            <span className="w-8"></span>
          </div>
        )}
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="grid grid-cols-[1fr,1fr,1fr,auto] gap-2 items-center"
          >
            <Input
              type="number"
              value={tier.from}
              onChange={(e) =>
                handleTierChange(tier.id, "from", e.target.value)
              }
              placeholder="من"
            />
            <Input
              type="number"
              value={tier.to}
              onChange={(e) => handleTierChange(tier.id, "to", e.target.value)}
              placeholder="إلى"
            />
            <Input
              type="number"
              value={tier.fee}
              onChange={(e) => handleTierChange(tier.id, "fee", e.target.value)}
              placeholder="الرسوم"
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive h-9 w-9"
              onClick={() => handleDeleteTier(tier.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={handleAddTier}>
        <PlusCircle className="ml-2 h-4 w-4" />
        إضافة شريحة
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [internalFees, setInternalFees] = useState(initialInternalFees);
  const [walletFees, setWalletFees] = useState(initialWalletFees);
  const [instapayFees, setInstapayFees] = useState(initialInstapayFees);
  const [deliveryFees, setDeliveryFees] = useState(initialDeliveryFees);

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
            <h3 className="font-semibold text-lg">
              التحويل الداخلي (بالدينار الليبي)
            </h3>
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
            <h3 className="font-semibold text-lg">
              التحويلات إلى مصر (بالجنيه المصري)
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <Label className="font-medium">حدود التحويل عبر انستاباي</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="instapay-min"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأدنى (ج.م)
                    </Label>
                    <Input
                      id="instapay-min"
                      type="number"
                      defaultValue="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="instapay-max"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأقصى (ج.م)
                    </Label>
                    <Input
                      id="instapay-max"
                      type="number"
                      defaultValue="50000"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="font-medium">حدود التحويل عبر محفظة كاش</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="wallet-min"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأدنى (ج.م)
                    </Label>
                    <Input id="wallet-min" type="number" defaultValue="100" />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="wallet-max"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأقصى (ج.م)
                    </Label>
                    <Input id="wallet-max" type="number" defaultValue="30000" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label className="font-medium">
                  حدود التحويل عبر وصلني البيت
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-min"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأدنى (ج.م)
                    </Label>
                    <Input
                      id="delivery-min"
                      type="number"
                      defaultValue="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-max"
                      className="text-sm text-muted-foreground"
                    >
                      الحد الأقصى (ج.م)
                    </Label>
                    <Input
                      id="delivery-max"
                      type="number"
                      defaultValue="100000"
                    />
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

      <Card>
        <CardHeader>
          <CardTitle>رسوم الخدمة</CardTitle>
          <CardDescription>
            إدارة شرائح رسوم الخدمة للتحويلات المختلفة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FeeTierManager
            title="التحويل الداخلي"
            currency="د.ل"
            tiers={internalFees}
            setTiers={setInternalFees}
          />
          <Separator />
          <div className="space-y-4">
             <h3 className="font-semibold text-lg">رسوم الخدمات (بالجنيه المصري)</h3>
              <FeeTierManager
                title="محفظة كاش"
                currency="ج.م"
                tiers={walletFees}
                setTiers={setWalletFees}
              />
              <FeeTierManager
                title="انستاباي"
                currency="ج.م"
                tiers={instapayFees}
                setTiers={setInstapayFees}
              />
              <FeeTierManager
                title="وصلني البيت"
                currency="ج.م"
                tiers={deliveryFees}
                setTiers={setDeliveryFees}
              />
          </div>
        </CardContent>
        <CardFooter>
          <Button>حفظ رسوم الخدمة</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
