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
import { cn } from "@/lib/utils";

const floatingCardClass = "bg-card shadow-xl border-none hover:shadow-2xl transition-all duration-300 rounded-2xl";

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

  const handleTierChange = (id: string, field: keyof Omit<FeeTier, "id">, value: string) => {
    const newTiers = { ...tiers };
    newTiers[id] = { ...newTiers[id], [field]: Number(value) };
    onTiersChange(newTiers);
  };

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
        {showFreeTransactionsInput && (
            <div className="flex items-center gap-2">
                <Label htmlFor="free-transactions" className="text-sm">المعاملات المجانية</Label>
                <Input id="free-transactions" type="number" value={freeTransactions} onChange={(e) => onFreeTransactionsChange?.(Number(e.target.value))} className="w-20 h-8" />
            </div>
        )}
      </div>
      <div className="space-y-3">
        {tiersArray.map((tier) => (
          <div key={tier.id} className="flex items-end gap-2">
            <div className="flex-1 space-y-1"><Label className="text-[10px]">من ({currency})</Label><Input type="number" value={tier.from} onChange={(e) => handleTierChange(tier.id, "from", e.target.value)} className="h-8" /></div>
            <div className="flex-1 space-y-1"><Label className="text-[10px]">إلى ({currency})</Label><Input type="number" value={tier.to} onChange={(e) => handleTierChange(tier.id, "to", e.target.value)} className="h-8" /></div>
            <div className="flex-1 space-y-1"><Label className="text-[10px]">الرسوم ({currency})</Label><Input type="number" value={tier.fee} onChange={(e) => handleTierChange(tier.id, "fee", e.target.value)} className="h-8" /></div>
            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteTier(tier.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={handleAddTier} className="h-8 text-xs"><PlusCircle className="ml-1 h-3 w-3" /> إضافة شريحة</Button>
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

    useEffect(() => { if(limitsData) setLocalLimits(limitsData); }, [limitsData]);
    useEffect(() => { if(feesData) setLocalFees(feesData); }, [feesData]);

    const handleLimitsChange = (path: string, value: any) => {
        setLocalLimits(prev => {
            const keys = path.split('.');
            let current = prev;
            for(let i = 0; i < keys.length - 1; i++) { current = (current as any)[keys[i]]; }
            (current as any)[keys[keys.length - 1]] = Number(value);
            return {...prev};
        })
    };
    
    const handleSaveLimits = async () => {
        setIsSavingLimits(true);
        try {
            await updateRtdb(database, '/settings/limits', localLimits);
            toast({title: "تم الحفظ بنجاح"});
        } catch (error: any) { toast({title: "خطأ", description: error.message, variant: "destructive"}); }
        finally { setIsSavingLimits(false); }
    };
    
    const handleSaveFees = async () => {
        setIsSavingFees(true);
        try {
            await updateRtdb(database, '/settings/fees', localFees);
            toast({title: "تم حفظ الرسوم بنجاح"});
        } catch (error: any) { toast({title: "خطأ", description: error.message, variant: "destructive"}); }
        finally { setIsSavingFees(false); }
    };

  return (
    <div className="space-y-6">
      {limitsLoading || feesLoading ? <Skeleton className="h-[600px] w-full rounded-2xl" /> : (
        <div className="grid grid-cols-1 gap-6">
          <Card className={floatingCardClass}>
            <CardHeader><CardTitle>حدود المعاملات والتحويلات</CardTitle><CardDescription>إدارة الحدود الدنيا والقصوى للعمليات.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 border rounded-xl p-4 bg-muted/5">
                  <h3 className="font-bold text-primary">التحويل الداخلي (د.ل)</h3>
                  <div className="space-y-4">
                    {['unverified', 'verified', 'merchant'].map(role => (
                      <div key={role} className="p-3 border rounded-lg bg-card/50 space-y-2">
                        <Label className="text-xs font-bold uppercase">{role === 'unverified' ? 'غير موثق' : role === 'verified' ? 'موثق' : 'تاجر'}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="أدنى" value={(localLimits.internal as any)?.[role]?.min || 0} onChange={e => handleLimitsChange(`internal.${role}.min`, e.target.value)} />
                          <Input type="number" placeholder="أقصى" value={(localLimits.internal as any)?.[role]?.max || 0} onChange={e => handleLimitsChange(`internal.${role}.max`, e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 border rounded-xl p-4 bg-muted/5">
                  <h3 className="font-bold text-primary">التحويلات إلى مصر (ج.م)</h3>
                  <div className="space-y-4">
                    {['instapay', 'wallet', 'delivery'].map(type => (
                      <div key={type} className="p-3 border rounded-lg bg-card/50 space-y-2">
                        <Label className="text-xs font-bold uppercase">{type === 'instapay' ? 'انستاباي' : type === 'wallet' ? 'محفظة' : 'توصيل منزلي'}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="number" placeholder="أدنى" value={(localLimits.egypt as any)?.[type]?.min || 0} onChange={e => handleLimitsChange(`egypt.${type}.min`, e.target.value)} />
                          <Input type="number" placeholder="أقصى" value={(localLimits.egypt as any)?.[type]?.max || 0} onChange={e => handleLimitsChange(`egypt.${type}.max`, e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveLimits} disabled={isSavingLimits}>{isSavingLimits ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Button></CardFooter>
          </Card>

          <Card className={floatingCardClass}>
            <CardHeader><CardTitle>رسوم الخدمة</CardTitle><CardDescription>إدارة شرائح الرسوم.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <FeeTierManager title="التحويل الداخلي" currency="د.ل" tiers={localFees.internal || {}} onTiersChange={t => setLocalFees(p => ({...p, internal: t}))} showFreeTransactionsInput freeTransactions={localFees.internalFreeTransactions} onFreeTransactionsChange={v => setLocalFees(p => ({...p, internalFreeTransactions: v}))} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeeTierManager title="محفظة كاش" currency="ج.م" tiers={localFees.wallet || {}} onTiersChange={t => setLocalFees(p => ({...p, wallet: t}))} />
                <FeeTierManager title="انستاباي" currency="ج.م" tiers={localFees.instapay || {}} onTiersChange={t => setLocalFees(p => ({...p, instapay: t}))} />
                <FeeTierManager title="توصيل منزلي" currency="ج.م" tiers={localFees.delivery || {}} onTiersChange={t => setLocalFees(p => ({...p, delivery: t}))} />
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4"><Button onClick={handleSaveFees} disabled={isSavingFees}>{isSavingFees ? 'جاري الحفظ...' : 'حفظ الرسوم'}</Button></CardFooter>
          </Card>
        </div>
      )}
      <AppSettingsCard /><MainSettingsCard />
    </div>
  );
}
