"use client";

import { useState, useMemo, useEffect } from "react";
import { useRtdbList, useRtdbObject } from "@/firebase";
import type { User, Transaction, EgyptTransferTransaction, Supervisor, RechargePurchaseTransaction, AccountTransferTransaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRightLeft,
  Activity,
  Banknote,
  Users2,
  Wallet,
  CreditCard,
  Coins,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const E_TYPES: EgyptTransferTransaction['transferType'][] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

const FormattedAmount = ({
    amount,
    currency,
    integerClass,
    fractionClass,
    currencyClass
}: {
    amount: number;
    currency: string;
    integerClass?: string;
    fractionClass?: string;
    currencyClass?: string;
}) => {
    const hasFraction = amount % 1 !== 0;
    const [integer, fraction] = (amount || 0).toFixed(2).split('.');
    return (
        <span className="inline-flex items-baseline" dir="ltr">
            <span className={cn('mr-1', currencyClass)}>{currency}</span>
            <span className={integerClass}>{Number(integer).toLocaleString('en-US')}</span>
            {hasFraction && <span className={cn('text-muted-foreground', fractionClass)}>.{fraction}</span>}
        </span>
    );
};

const MoneyBoxIcon = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="20" height="12" rx="2" className="fill-blue-500" />
      <path d="M12 2V6" className="stroke-yellow-500" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="3" className="fill-yellow-400" />
      <path d="M10 14H14" className="stroke-white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const floatingCardClass = "bg-card shadow-xl border-none hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl";

export default function DashboardPage() {
  const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>("/supervisors");
  const { data: fakkaSafeData, isLoading: fakkaLoading } = useRtdbObject<{totalFakka: number}>("/fakkaSafe");

  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(3); 
  const [selectedDay, setSelectedDay] = useState(1); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const transactions = useMemo(() => {
    if (!users) return [];
    return users.flatMap(user => 
        user.transactions 
            ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
            : []
    ) as Transaction[];
  }, [users]);

  const daysInMonth = useMemo(() => {
    return new Date(2026, selectedMonth, 0).getDate();
  }, [selectedMonth]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const getMonthName = (month: number) => {
    return new Date(2026, month - 1).toLocaleString('ar', { month: 'long' });
  };

  const InlineMonthSelector = () => (
    <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
      <SelectTrigger className="inline-flex h-auto w-auto border-none bg-transparent p-0 font-bold text-primary hover:underline focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer">
        <SelectValue placeholder={`شهر ${getMonthName(selectedMonth)}`} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {months.map((m) => (
          <SelectItem key={m} value={String(m)}>
            {getMonthName(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const InlineDaySelector = () => {
    const isToday = selectedDay === 1 && selectedMonth === 3;
    const displayLabel = isToday ? "اليوم" : `يوم ${selectedDay}`;
    
    return (
      <Select value={String(selectedDay)} onValueChange={(val) => setSelectedDay(Number(val))}>
        <SelectTrigger className="inline-flex h-auto w-auto border-none bg-transparent p-0 font-bold text-primary hover:underline focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer">
          <SelectValue placeholder={displayLabel} />
        </SelectTrigger>
        <SelectContent dir="rtl" className="max-h-[300px]">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>
              {d === 1 && selectedMonth === 3 ? "اليوم" : `يوم ${d}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const stats = useMemo(() => {
    if (!isMounted || !users) return null;

    const startOfSelectedDay = new Date(2026, selectedMonth - 1, selectedDay);
    const endOfSelectedDay = new Date(2026, selectedMonth - 1, selectedDay, 23, 59, 59, 999);
    const startOfMonth = new Date(2026, selectedMonth - 1, 1);
    const endOfMonth = new Date(2026, selectedMonth, 0, 23, 59, 59, 999);

    const totalLibyanBalance = users.reduce((sum, user) => sum + (user.balanceLYD || 0), 0);
    const totalEgyptianBalance = users.reduce((sum, user) => sum + (user.balanceEGP || 0), 0);

    const egyptTransfers = transactions.filter((t): t is EgyptTransferTransaction => t.type === "egypt_transfer");
    const completedEgyptTransfers = egyptTransfers.filter(t => t.status === "completed");

    const dailyTrades = completedEgyptTransfers.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyTrades = completedEgyptTransfers.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const dailyTradeStats = {
        count: dailyTrades.length,
        lydAmount: dailyTrades.reduce((sum, t) => sum + t.amountLYD, 0),
        egpAmount: dailyTrades.reduce((sum, t) => sum + t.amountEGP, 0),
    };
    const monthlyTradeStats = {
        count: monthlyTrades.length,
        lydAmount: monthlyTrades.reduce((sum, t) => sum + t.amountLYD, 0),
        egpAmount: monthlyTrades.reduce((sum, t) => sum + t.amountEGP, 0),
    };

    const userCounts = {
        total: users.length,
        merchants: users.filter(u => u.role === 'merchant').length,
        verified: users.filter(u => u.verification === 'verified' && u.role !== 'merchant').length,
        unverified: users.filter(u => u.verification === 'unverified' && u.role !== 'merchant').length,
        banned: users.filter(u => u.status === 'banned').length,
        pendingDoc: users.filter(u => u.verification === 'pending').length,
    };

    const internalTx = transactions.filter((t): t is AccountTransferTransaction => t.type === "account_transfer" && t.status === "completed");
    const dailyInternal = internalTx.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyInternal = internalTx.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const cardsTx = transactions.filter((t): t is RechargePurchaseTransaction => t.type === "recharge_purchase" && t.status === "completed");
    const dailyCards = cardsTx.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyCards = cardsTx.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const createTransferStats = (list: EgyptTransferTransaction[]) => {
        const statsObj = E_TYPES.reduce((acc, type) => {
            acc[type] = { count: 0, amount: 0 };
            return acc;
        }, {} as any);

        list.forEach(t => {
            if (t.status === 'completed' && statsObj[t.transferType]) {
                statsObj[t.transferType].count++;
                statsObj[t.transferType].amount += t.amountEGP;
            }
        });
        return statsObj;
    };

    const createStatusStats = (list: EgyptTransferTransaction[]) => ({
        successful: list.filter(t => t.status === 'completed').length,
        pending: list.filter(t => t.status === 'pending').length,
        failed: list.filter(t => t.status === 'failed').length,
        totalActive: list.filter(t => t.status === 'completed' || t.status === 'pending').reduce((sum, t) => sum + t.amountEGP, 0)
    });

    const dailyEgyptList = egyptTransfers.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyEgyptList = egyptTransfers.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const monthlyRevenueByType = E_TYPES.reduce((acc, type) => {
        const typeTransfers = monthlyEgyptList.filter(t => t.transferType === type && t.status === 'completed');
        acc[type] = {
            count: typeTransfers.length,
            revenue: typeTransfers.reduce((sum, t) => sum + (t.serviceFee || 0), 0)
        };
        return acc;
    }, {} as any);

    const supervisorSummary = (supervisors || []).map(s => {
        const sMonthTx = monthlyEgyptList.filter(t => t.delegateName === s.name && t.status === 'completed');
        return {
            id: s.id,
            name: s.name,
            dailyTotal: dailyEgyptList.filter(t => t.delegateName === s.name && t.status === 'completed').reduce((sum, t) => sum + t.amountEGP, 0),
            monthlyTotal: sMonthTx.reduce((sum, t) => sum + t.amountEGP, 0),
            monthlyFees: sMonthTx.reduce((sum, t) => sum + (t.serviceFee || 0), 0),
            monthlyCount: sMonthTx.length,
            details: E_TYPES.map(type => sMonthTx.filter(t => t.transferType === type).length)
        };
    });

    return {
        totalLibyanBalance,
        totalEgyptianBalance,
        dailyTradeStats,
        monthlyTradeStats,
        userCounts,
        fakkaBalance: fakkaSafeData?.totalFakka || 0,
        dailyInternalStats: { count: dailyInternal.length, revenue: dailyInternal.reduce((sum, t) => sum + (t.fee || 0), 0) },
        monthlyInternalStats: { count: monthlyInternal.length, revenue: monthlyInternal.reduce((sum, t) => sum + (t.fee || 0), 0) },
        dailyCardStats: { count: dailyCards.length, value: dailyCards.reduce((sum, t) => sum + (t.amount || 0), 0) },
        monthlyCardStats: { count: monthlyCards.length, value: monthlyCards.reduce((sum, t) => sum + (t.amount || 0), 0) },
        dailyEgyptSummary: createStatusStats(dailyEgyptList),
        monthlyEgyptSummary: createStatusStats(monthlyEgyptList),
        dailyEgyptDetailed: createTransferStats(dailyEgyptList.filter(t => t.status === 'completed')),
        monthlyEgyptDetailed: createTransferStats(monthlyEgyptList.filter(t => t.status === 'completed')),
        dailyPendingDetailed: createTransferStats(dailyEgyptList.filter(t => t.status === 'pending')),
        monthlyPendingDetailed: createTransferStats(monthlyEgyptList.filter(t => t.status === 'pending')),
        monthlyTotalRevenueEGP: monthlyEgyptList.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.serviceFee || 0), 0),
        monthlyRevenueByType,
        supervisorSummary
    };
  }, [isMounted, users, transactions, selectedMonth, selectedDay, fakkaSafeData, supervisors]);

  const isLoading = usersLoading || supervisorsLoading || fakkaLoading || !isMounted;

  if (isLoading || !stats) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
            <div className="grid gap-6 lg:grid-cols-4"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 lg:col-span-2 rounded-2xl" /></div>
        </div>
    );
  }

  const renderTransferSummary = (summary: any, successful: any, pending: any) => (
    <CardContent className="space-y-4 pt-6 flex-grow flex flex-col justify-center">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">إجمالي (ناجح + معلق)</p>
            <p><FormattedAmount amount={summary.totalActive} currency="ج.م" integerClass="text-xl md:text-2xl font-bold" fractionClass="text-md md:text-lg" currencyClass="text-sm md:text-base font-medium" /></p>
        </div>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
            <div className="space-y-2 text-xs">
                {Object.entries(successful).map(([type, s]: [string, any]) => (
                    <div key={type} className="grid grid-cols-3 items-center">
                        <span className="text-right">{type}</span>
                        <div className="flex justify-center"><Badge variant="outline" className="px-3 text-green-600 border-green-200">{s.count} حوالة</Badge></div>
                        <span className="font-semibold text-left"><FormattedAmount amount={s.amount} currency="ج.م" integerClass="font-semibold" /></span>
                    </div>
                ))}
            </div>
        </div>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2 text-yellow-600">الحوالات المعلقة</h4>
            <div className="space-y-2 text-xs">
                {Object.entries(pending).map(([type, s]: [string, any]) => (
                    <div key={type} className="grid grid-cols-3 items-center text-yellow-600">
                        <span className="text-right">{type}</span>
                        <div className="flex justify-center"><Badge variant="outline" className="px-3 border-yellow-200 text-yellow-700 bg-yellow-50">{s.count} حوالة</Badge></div>
                        <span className="font-semibold text-left"><FormattedAmount amount={s.amount} currency="ج.م" integerClass="font-semibold" /></span>
                    </div>
                ))}
            </div>
        </div>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2">حالة الحوالات</h4>
            <div className="space-y-1 text-xs font-medium">
                <p className="flex justify-between text-green-600"><span>ناجحة:</span> <span>{summary.successful}</span></p>
                <p className="flex justify-between text-yellow-600"><span>قيد التحويل:</span> <span>{summary.pending}</span></p>
                <p className="flex justify-between text-red-600"><span>مرفوضة:</span> <span>{summary.failed}</span></p>
            </div>
        </div>
    </CardContent>
  );

  return (
    <div className="space-y-6">
        {/* Row 1: Balances */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base">إجمالي الرصيد الليبي</CardTitle>
                            <CardDescription className="text-xs">رصيد جميع المستخدمين بالدينار</CardDescription>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 font-bold text-sm">LYD</div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center pb-8">
                    <FormattedAmount amount={stats.totalLibyanBalance} currency="د.ل" integerClass="text-3xl md:text-4xl font-bold text-green-600" currencyClass="text-lg" />
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div><CardTitle>تداول الدينار مقابل الجنيه</CardTitle><CardDescription>العمليات الناجحة (DG)</CardDescription></div>
                        <div className="p-3 bg-blue-100 rounded-xl"><ArrowRightLeft className="h-6 w-6 text-blue-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div><h4 className="text-sm font-semibold mb-2"><InlineDaySelector /></h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{stats.dailyTradeStats.count}</span></p>
                            <p className="flex justify-between"><span>المبلغ (د.ل):</span> <span className="font-semibold text-foreground"><FormattedAmount amount={stats.dailyTradeStats.lydAmount} currency="د.ل" /></span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground"><FormattedAmount amount={stats.dailyTradeStats.egpAmount} currency="ج.م" /></span></p>
                        </div>
                    </div>
                    <Separator />
                    <div><h4 className="text-sm font-semibold mb-2"><InlineMonthSelector /></h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{stats.monthlyTradeStats.count}</span></p>
                            <p className="flex justify-between"><span>المبلغ (د.ل):</span> <span className="font-semibold text-foreground"><FormattedAmount amount={stats.monthlyTradeStats.lydAmount} currency="د.ل" /></span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground"><FormattedAmount amount={stats.monthlyTradeStats.egpAmount} currency="ج.م" /></span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base">إجمالي الرصيد المصري</CardTitle>
                            <CardDescription className="text-xs">رصيد جميع المستخدمين بالجنيه</CardDescription>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 font-bold text-sm">EGP</div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center pb-8">
                    <FormattedAmount amount={stats.totalEgyptianBalance} currency="ج.م" integerClass="text-3xl md:text-4xl font-bold text-purple-600" currencyClass="text-lg" />
                </CardContent>
            </Card>
        </div>

        {/* Row 2: Users and Internal Operations */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div><CardTitle>المستخدمون</CardTitle><CardDescription className="text-xs">{(stats.userCounts.pendingDoc)} طلب توثيق</CardDescription></div>
                        <div className="p-3 bg-orange-100 rounded-xl"><Users2 className="h-6 w-6 text-orange-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="text-center text-4xl font-bold mb-4">{stats.userCounts.total}</div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="flex justify-between text-green-600 bg-green-50 p-1.5 rounded"><span>تاجر:</span><span>{stats.userCounts.merchants}</span></div>
                        <div className="flex justify-between text-blue-600 bg-blue-50 p-1.5 rounded"><span>موثق:</span><span>{stats.userCounts.verified}</span></div>
                        <div className="flex justify-between text-yellow-600 bg-yellow-50 p-1.5 rounded"><span>غير موثق:</span><span>{stats.userCounts.unverified}</span></div>
                        <div className="flex justify-between text-red-600 bg-red-50 p-1.5 rounded"><span>مجمد:</span><span>{stats.userCounts.banned}</span></div>
                    </div>
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div><CardTitle>التحويل الداخلي (DD)</CardTitle><CardDescription>العمليات والرسوم بالدينار</CardDescription></div>
                        <div className="p-3 bg-green-100 rounded-xl"><Wallet className="h-6 w-6 text-green-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div><h4 className="text-sm font-semibold mb-2"><InlineDaySelector /></h4>
                        <div className="flex justify-between text-sm"><span>العمليات: {stats.dailyInternalStats.count}</span> <FormattedAmount amount={stats.dailyInternalStats.revenue} currency="د.ل" /></div>
                    </div>
                    <Separator />
                    <div><h4 className="text-sm font-semibold mb-2"><InlineMonthSelector /></h4>
                        <div className="flex justify-between text-sm"><span>العمليات: {stats.monthlyInternalStats.count}</span> <FormattedAmount amount={stats.monthlyInternalStats.revenue} currency="د.ل" /></div>
                    </div>
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div><CardTitle>متجر الكروت (DC)</CardTitle><CardDescription>المبيعات بالدينار</CardDescription></div>
                        <div className="p-3 bg-sky-100 rounded-xl"><CreditCard className="h-6 w-6 text-sky-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div><h4 className="text-sm font-semibold mb-2"><InlineDaySelector /></h4>
                        <div className="flex justify-between text-sm"><span>الكروت: {stats.dailyCardStats.count}</span> <FormattedAmount amount={stats.dailyCardStats.value} currency="د.ل" /></div>
                    </div>
                    <Separator />
                    <div><h4 className="text-sm font-semibold mb-2"><InlineMonthSelector /></h4>
                        <div className="flex justify-between text-sm"><span>الكروت: {stats.monthlyCardStats.count}</span> <FormattedAmount amount={stats.monthlyCardStats.value} currency="د.ل" /></div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Row 3: Fakka and Detailed Summaries */}
        <div className="grid gap-6 lg:grid-cols-4">
            <Card className={cn(floatingCardClass, "flex flex-col text-center")}>
                <CardHeader>
                    <CardTitle className="text-base font-bold">حصالة الفكة</CardTitle>
                    <CardDescription className="text-xs">مجموع كسور التحويلات</CardDescription>
                    <div className="flex justify-center mt-2"><MoneyBoxIcon /></div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-8">
                    <div className="mb-2"><InlineMonthSelector /></div>
                    <FormattedAmount amount={stats.fakkaBalance} currency="ج.م" integerClass="text-2xl md:text-3xl font-bold text-blue-600" />
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "flex flex-col")}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1"><CardTitle>إيرادات <InlineMonthSelector /></CardTitle><CardDescription className="text-xs">رسوم التحويلات المصرية</CardDescription></div>
                        <div className="p-3 bg-indigo-100 rounded-xl"><Banknote className="h-6 w-6 text-indigo-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div className="text-center"><FormattedAmount amount={stats.monthlyTotalRevenueEGP} currency="ج.م" integerClass="text-2xl font-bold text-indigo-600" /></div>
                    <Separator />
                    <div className="space-y-2 text-xs">
                        {Object.entries(stats.monthlyRevenueByType).map(([type, s]: [string, any]) => (
                            <div key={type} className="flex justify-between items-center">
                                <span>{type}</span>
                                <div className="flex items-center gap-3"><Badge variant="outline" className="px-2">{s.count}</Badge> <FormattedAmount amount={s.revenue} currency="ج.م" integerClass="font-semibold" /></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className={cn(floatingCardClass, "lg:col-span-2 flex flex-col")}>
                <Tabs defaultValue="today" dir="rtl" className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Activity size={18} /> ملخص الحوالات</CardTitle>
                            <TabsList className="grid grid-cols-2 w-48">
                                <TabsTrigger value="today"><InlineDaySelector /></TabsTrigger>
                                <TabsTrigger value="month">الإجمالي الشهري</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <TabsContent value="today" className="flex-grow m-0">{renderTransferSummary(stats.dailyEgyptSummary, stats.dailyEgyptDetailed, stats.dailyPendingDetailed)}</TabsContent>
                    <TabsContent value="month" className="flex-grow m-0">
                        <div className="px-6 py-1 text-[10px] text-muted-foreground flex justify-center items-center gap-1">عرض بيانات <InlineMonthSelector /></div>
                        {renderTransferSummary(stats.monthlyEgyptSummary, stats.monthlyEgyptDetailed, stats.monthlyPendingDetailed)}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>

        {/* Row 4: Supervisor Table */}
        <Card className={cn(floatingCardClass)}>
            <CardHeader>
                <CardTitle>ملخص أداء المندوبين <InlineMonthSelector /></CardTitle>
                <CardDescription>عرض شامل لمبالغ التحويل والرسوم حسب كل مندوب</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold text-center">المندوب</TableHead>
                                <TableHead className="text-center font-bold"><InlineDaySelector /> (ج.م)</TableHead>
                                <TableHead className="text-center font-bold">إجمالي الشهر (ج.م)</TableHead>
                                <TableHead className="text-center font-bold">إجمالي الرسوم (ج.م)</TableHead>
                                <TableHead className="text-center font-bold">عدد العمليات</TableHead>
                                {E_TYPES.map(t => <TableHead key={t} className="text-center font-bold">{t}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.supervisorSummary.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium text-center">{s.name}</TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.dailyTotal} currency="ج.م" integerClass="font-bold" /></TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.monthlyTotal} currency="ج.م" integerClass="font-bold" /></TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.monthlyFees} currency="ج.م" integerClass="font-bold text-primary" /></TableCell>
                                    <TableCell className="text-center font-semibold">{s.monthlyCount}</TableCell>
                                    {s.details.map((count, i) => <TableCell key={i} className="text-center">{count}</TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
