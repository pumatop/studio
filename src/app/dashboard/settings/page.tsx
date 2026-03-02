"use client";

import { useState, useEffect } from "react";
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
import type { FeeTier, TransactionLimits, FeeSettings } from "@/lib/types";
import { AppSettingsCard } from "./app-settings-card";
import { MainSettingsCard } from "./main-settings-card";
import { useRtdbObject, useDatabase, updateRtdb } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function FeeTierManager({
  title,
  description,
  currency,
  tiers,
  onTiersChange,
  showFreeTransactionsInput = false,
  freeTransactions,
  onFreeTransactionsChange,
}: {
  title: string;
  description?: string;
  currency: string;
  tiers: { [key: string]: FeeTier };
  onTiersChange: (tiers: { [key: string]: FeeTier }) => void;
  showFreeTransactionsInput?: boolean;
  freeTransactions?: number;
  onFreeTransactionsChange?: (value: number) => void;
}) {

  const tiersArray = Object.entries(tiers || {}).map(([id, tier]) => ({ ...tier, id }));

  const handleAddTier = () => {
    const newId = `tier_${Date.now()}`;
    const newTiers = { ...tiers, [newId]: { from: 0, to: 0, fee: 0 } };
    onTiersChange(newTiers);
  };

  const handleDeleteTier = (id: string) => {
    const newTiers = { ...tiers };
    delete newTiers[id];
    onTiersChange(newTiers);
  };

  const handleTierChange = (
    id: string,
    field: keyof Omit<FeeTier, "id">,
    value: string
  ) => {
    const newTiers = { ...tiers };
    newTiers[id] = { ...newTiers[id], [field]: Number(value) };
    onTiersChange(newTiers);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
        {showFreeTransactionsInput && (
            <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="free-transactions" className="text-sm shrink-0">المعاملات الشهرية المجانية</Label>
                <Input
                    id="free-transactions"
                    type="number"
                    value={freeTransactions}
                    onChange={(e) => onFreeTransactionsChange?.(Number(e.target.value))}
                    className="w-24"
                />
            </div>
        )}
      </div>
      <div className="space-y-3">
        {tiersArray.map((tier) => (
          <div
            key={tier.id}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="flex-1 space-y-1 min-w-[120px]">
                <Label htmlFor={`from-${tier.id}`} className="text-xs text-muted-foreground">من ({currency})</Label>
                <Input
                  id={`from-${tier.id}`}
                  type="number"
                  value={tier.from}
                  onChange={(e) =>
                    handleTierChange(tier.id, "from", e.target.value)
                  }
                  placeholder="من"
                />
            </div>
            <div className="flex-1 space-y-1 min-w-[120px]">
                <Label htmlFor={`to-${tier.id}`} className="text-xs text-muted-foreground">إلى ({currency})</Label>
                <Input
                  id={`to-${tier.id}`}
                  type="number"
                  value={tier.to}
                  onChange={(e) => handleTierChange(tier.id, "to", e.target.value)}
                  placeholder="إلى"
                />
            </div>
            <div className="flex-1 space-y-1 min-w-[120px]">
                <Label htmlFor={`fee-${tier.id}`} className="text-xs text-muted-foreground">قيمة الرسوم ({currency})</Label>
                <Input
                  id={`fee-${tier.id}`}
                  type="number"
                  value={tier.fee}
                  onChange={(e) => handleTierChange(tier.id, "fee", e.target.value)}
                  placeholder="الرسوم"
                />
            </div>
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
    const { data: limitsData, isLoading: limitsLoading } = useRtdbObject<TransactionLimits>('/settings/limits');
    const { data: feesData, isLoading: feesLoading } = useRtdbObject<FeeSettings>('/settings/fees');
    const { database } = useDatabase();
    const { toast } = useToast();

    const [localLimits, setLocalLimits] = useState<Partial<TransactionLimits>>({});
    const [localFees, setLocalFees] = useState<Partial<FeeSettings>>({});
    const [isSavingLimits, setIsSavingLimits] = useState(false);
    const [isSavingFees, setIsSavingFees] = useState(false);

    useEffect(() => {
        if(limitsData) setLocalLimits(limitsData);
    }, [limitsData]);

    useEffect(() => {
        if(feesData) setLocalFees(feesData);
    }, [feesData]);

    const handleLimitsChange = (path: string, value: any) => {
        setLocalLimits(prev => {
            const keys = path.split('.');
            let current = prev;
            for(let i = 0; i < keys.length - 1; i++) {
                current = (current as any)[keys[i]];
            }
            (current as any)[keys[keys.length - 1]] = Number(value);
            return {...prev};
        })
    };
    
    const handleSaveLimits = async () => {
        setIsSavingLimits(true);
        try {
            await updateRtdb(database, '/settings/limits', localLimits);
            toast({title: "تم حفظ حدود المعاملات بنجاح"});
        } catch (error: any) {
            toast({title: "حدث خطأ", description: error.message, variant: "destructive"});
        } finally {
            setIsSavingLimits(false);
        }
    };
    
    const handleSaveFees = async () => {
        setIsSavingFees(true);
        try {
            await updateRtdb(database, '/settings/fees', localFees);
            toast({title: "تم حفظ رسوم الخدمة بنجاح"});
        } catch (error: any) {
            toast({title: "حدث خطأ", description: error.message, variant: "destructive"});
        } finally {
            setIsSavingFees(false);
        }
    };
    
    const isLoading = limitsLoading || feesLoading;

  return (
    <div className="space-y-6">
    {isLoading ? (
        <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[600px] w-full" />
        </div>
    ) : (
      <div className="space-y-6">
        {/* Row 1 - Transaction Limits (Wide) */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>حدود المعاملات والتحويلات</CardTitle>
            <CardDescription>
              إدارة الحدود الدنيا والقصوى للمعاملات المختلفة للعملية الواحدة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Right Column: Internal Transfer (RTL) */}
              <div className="space-y-4 rounded-lg border p-4 bg-muted/5">
                <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                  <span>التحويل الداخلي (بالدينار الليبي)</span>
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg border p-3 space-y-3 bg-card">
                    <Label className="font-medium">المستخدم غير الموثق</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.internal?.unverified?.min || ''} onChange={e => handleLimitsChange('internal.unverified.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.internal?.unverified?.max || ''} onChange={e => handleLimitsChange('internal.unverified.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 space-y-3 bg-card">
                    <Label className="font-medium">المستخدم الموثق</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.internal?.verified?.min || ''} onChange={e => handleLimitsChange('internal.verified.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.internal?.verified?.max || ''} onChange={e => handleLimitsChange('internal.verified.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 space-y-3 bg-card">
                    <Label className="font-medium">التاجر</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.internal?.merchant?.min || ''} onChange={e => handleLimitsChange('internal.merchant.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.internal?.merchant?.max || ''} onChange={e => handleLimitsChange('internal.merchant.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Column: Transfers to Egypt (RTL) */}
              <div className="space-y-4 rounded-lg border p-4 bg-muted/5">
                <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                  <span>التحويلات إلى مصر (بالجنيه المصري)</span>
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3 bg-card">
                    <Label className="font-medium">حدود التحويل عبر انستاباي</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.egypt?.instapay?.min || ''} onChange={e => handleLimitsChange('egypt.instapay.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.egypt?.instapay?.max || ''} onChange={e => handleLimitsChange('egypt.instapay.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3 bg-card">
                    <Label className="font-medium">حدود التحويل عبر محفظة كاش</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.egypt?.wallet?.min || ''} onChange={e => handleLimitsChange('egypt.wallet.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.egypt?.wallet?.max || ''} onChange={e => handleLimitsChange('egypt.wallet.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3 bg-card">
                    <Label className="font-medium">حدود التحويل عبر وصلني البيت</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأدنى</Label>
                        <Input value={localLimits.egypt?.delivery?.min || ''} onChange={e => handleLimitsChange('egypt.delivery.min', e.target.value)} type="number" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">الحد الأقصى</Label>
                        <Input value={localLimits.egypt?.delivery?.max || ''} onChange={e => handleLimitsChange('egypt.delivery.max', e.target.value)} type="number" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/5 pt-6">
            <Button onClick={handleSaveLimits} disabled={isSavingLimits}>
                {isSavingLimits ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </CardFooter>
        </Card>

        {/* Row 2 - Fee Tiers (Wide) */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>رسوم الخدمة</CardTitle>
            <CardDescription>
              إدارة شرائح رسوم الخدمة للتحويلات المختلفة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FeeTierManager
              title="التحويل الداخلي"
              description="(الرسوم لا تطبق على حسابات التجار)"
              currency="د.ل"
              tiers={localFees.internal || {}}
              onTiersChange={(tiers) => setLocalFees(p => ({...p, internal: tiers}))}
              showFreeTransactionsInput={true}
              freeTransactions={localFees.internalFreeTransactions || 0}
              onFreeTransactionsChange={(val) => setLocalFees(p => ({...p, internalFreeTransactions: val}))}
            />
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">رسوم الخدمات (بالجنيه المصري)</h3>
              <div className="grid grid-cols-1 gap-6">
                <FeeTierManager
                  title="محفظة كاش"
                  currency="ج.م"
                  tiers={localFees.wallet || {}}
                  onTiersChange={(tiers) => setLocalFees(p => ({...p, wallet: tiers}))}
                />
                <FeeTierManager
                  title="انستاباي"
                  currency="ج.م"
                  tiers={localFees.instapay || {}}
                  onTiersChange={(tiers) => setLocalFees(p => ({...p, instapay: tiers}))}
                />
                <FeeTierManager
                  title="وصلني البيت"
                  currency="ج.م"
                  tiers={localFees.delivery || {}}
                  onTiersChange={(tiers) => setLocalFees(p => ({...p, delivery: tiers}))}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/5 pt-6">
            <Button onClick={handleSaveFees} disabled={isSavingFees}>
                {isSavingFees ? 'جاري الحفظ...' : 'حفظ رسوم الخدمة'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )}
      <AppSettingsCard />
      <MainSettingsCard />
    </div>
  );
}
