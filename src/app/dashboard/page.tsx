"use client";

import { useState, useMemo } from "react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import type { User, Transaction, EgyptTransferTransaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ArrowRightLeft,
  Users,
  CreditCard,
  Landmark,
  PiggyBank,
  Activity,
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
import { mockEgyptianTransfers } from "@/lib/mock-egyptian-transfers";
import type { EgyptianTransfer } from "@/lib/types";
import { mockSupervisors } from "@/lib/mock-supervisors";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const EGYPTIAN_TRANSFER_TYPES: EgyptianTransfer['transferType'][] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

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
    const [integer, fraction] = amount.toFixed(2).split('.');
    return (
        <span className="inline-flex items-baseline" dir="ltr">
            <span className={cn('mr-1', currencyClass)}>{currency}</span>
            <span className={integerClass}>{Number(integer).toLocaleString('en-US')}</span>
            {hasFraction && <span className={cn('text-muted-foreground', fractionClass)}>.{fraction}</span>}
        </span>
    );
};


export default function DashboardPage() {
  const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");
  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>("/transactions");
  
  // --- DATE SETUP ---
  const mostRecentTimestamp = useMemo(() => {
    if (!transactions || transactions.length === 0) return Date.now();
    return Math.max(...transactions.map(t => t.timestamp));
  }, [transactions]);
  
  const todayDate = new Date(mostRecentTimestamp);

  const [selectedMonth, setSelectedMonth] = useState(() => todayDate.getMonth() + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const { 
    totalLibyanBalance, 
    totalEgyptianBalance,
    dailyTradeStats,
    monthlyTradeStats,
    totalUsers,
    pendingVerificationUsers,
    dailyCardStats,
    monthlyCardStats,
    dailyInternalStats,
    monthlyInternalStats,
    fakkaBalance
   } = useMemo(() => {
    const usersData = users || [];
    const transactionsData = transactions || [];

    const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const startOfMonth = new Date(todayDate.getFullYear(), selectedMonth - 1, 1);
    const endOfMonth = new Date(todayDate.getFullYear(), selectedMonth, 0, 23, 59, 59, 999);

    // --- CARD CALCULATIONS ---
    const totalLibyanBalance = usersData.reduce((sum, user) => sum + user.balanceLYD, 0);
    const totalEgyptianBalance = usersData.reduce((sum, user) => sum + user.balanceEGP, 0);

    const lydToEgpTransactions = transactionsData.filter(
        (t): t is EgyptTransferTransaction => t.type === "egypt_transfer" && t.status === "completed"
    );

    const dailyTrades = lydToEgpTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
    const monthlyTrades = lydToEgpTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

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

    const totalUsers = usersData.length;
    const pendingVerificationUsers = usersData.filter(u => u.verification === "pending").length;
    
    const cardTransactions = transactionsData.filter(t => t.type === "recharge_purchase" && t.status === "completed");
    const dailyCards = cardTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
    const monthlyCards = cardTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const dailyCardStats = {
        count: dailyCards.length,
        revenue: dailyCards.reduce((sum, t) => {
            const tx = t as RechargePurchaseTransaction;
            // Simplified fee calculation
            const balanceChange = tx.balanceBefore - tx.balanceAfter;
            const fee = balanceChange - tx.amount;
            return sum + (fee > 0 ? fee : 0);
        }, 0)
    };
    const monthlyCardStats = {
        count: monthlyCards.length,
        revenue: monthlyCards.reduce((sum, t) => {
            const tx = t as RechargePurchaseTransaction;
            const balanceChange = tx.balanceBefore - tx.balanceAfter;
            const fee = balanceChange - tx.amount;
            return sum + (fee > 0 ? fee : 0);
        }, 0)
    };

    const internalTransactions = transactionsData.filter((t): t is AccountTransferTransaction => t.type === "account_transfer" && t.status === "completed");
    const dailyInternal = internalTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
    const monthlyInternal = internalTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
    const dailyInternalStats = {
        count: dailyInternal.length,
        revenue: dailyInternal.reduce((sum, t) => sum + t.fee, 0)
    };
    const monthlyInternalStats = {
        count: monthlyInternal.length,
        revenue: monthlyInternal.reduce((sum, t) => sum + t.fee, 0)
    };

    const fakkaBalance = lydToEgpTransactions.reduce((sum, t) => {
        const preciseAmount = t.amountLYD * t.exchangeRate;
        const fraction = preciseAmount - t.amountEGP;
        return sum + (fraction > 0 ? fraction : 0);
    }, 0);

    return {
        totalLibyanBalance,
        totalEgyptianBalance,
        dailyTradeStats,
        monthlyTradeStats,
        totalUsers,
        pendingVerificationUsers,
        dailyCardStats,
        monthlyCardStats,
        dailyInternalStats,
        monthlyInternalStats,
        fakkaBalance
    };

   }, [users, transactions, selectedMonth, todayDate]);

  // --- MOCK DATA FOR UI PARTS NOT SUPPORTED BY RTDB YET ---
  const dailyEgyptianTransfers = mockEgyptianTransfers.filter(t => new Date(t.requestTimestamp) >= new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()));
  const monthlyEgyptianTransfers = mockEgyptianTransfers.filter(t => {
    const transactionDate = new Date(t.requestTimestamp);
    return transactionDate >= new Date(todayDate.getFullYear(), selectedMonth - 1, 1) && transactionDate <= new Date(todayDate.getFullYear(), selectedMonth, 0, 23, 59, 59, 999);
  });
  
  const dailySuccessfulTransfersEGP = dailyEgyptianTransfers
    .filter((t) => t.status === "ناجح")
    .reduce((sum, t) => sum + t.sentAmount, 0);
  const dailyPendingTransfersEGP = dailyEgyptianTransfers
    .filter((t) => t.status === "قيد التحويل")
    .reduce((sum, t) => sum + t.sentAmount, 0);
  const dailyTotalActiveTransfersEGP = dailySuccessfulTransfersEGP + dailyPendingTransfersEGP;

  const createStatsObject = () => EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
    acc[type] = { count: 0, amount: 0 };
    return acc;
  }, {} as Record<EgyptianTransfer['transferType'], {count: number, amount: number}>);

  const dailySuccessfulStatsByType = createStatsObject();
  const dailyPendingStatsByType = createStatsObject();

  dailyEgyptianTransfers.forEach(t => {
      if (t.status === 'ناجح' && dailySuccessfulStatsByType[t.transferType]) {
          dailySuccessfulStatsByType[t.transferType].count++;
          dailySuccessfulStatsByType[t.transferType].amount += t.sentAmount;
      } else if (t.status === 'قيد التحويل' && dailyPendingStatsByType[t.transferType]) {
          dailyPendingStatsByType[t.transferType].count++;
          dailyPendingStatsByType[t.transferType].amount += t.sentAmount;
      }
  });

  const monthlySuccessfulTransfersEGP = monthlyEgyptianTransfers
    .filter((t) => t.status === "ناجح")
    .reduce((sum, t) => sum + t.sentAmount, 0);
  const monthlyPendingTransfersEGP = monthlyEgyptianTransfers
    .filter((t) => t.status === "قيد التحويل")
    .reduce((sum, t) => sum + t.sentAmount, 0);
  const monthlyTotalActiveTransfersEGP = monthlySuccessfulTransfersEGP + monthlyPendingTransfersEGP;

  const monthlySuccessfulStatsByType = createStatsObject();
  const monthlyPendingStatsByType = createStatsObject();
  
  monthlyEgyptianTransfers.forEach(t => {
      if (t.status === 'ناجح' && monthlySuccessfulStatsByType[t.transferType]) {
          monthlySuccessfulStatsByType[t.transferType].count++;
          monthlySuccessfulStatsByType[t.transferType].amount += t.sentAmount;
      } else if (t.status === 'قيد التحويل' && monthlyPendingStatsByType[t.transferType]) {
          monthlyPendingStatsByType[t.transferType].count++;
          monthlyPendingStatsByType[t.transferType].amount += t.sentAmount;
      }
  });
  
  const calculateStatusCounts = (transfers: EgyptianTransfer[]) => {
    return transfers.reduce((acc, t) => {
        if(t.status === 'ناجح') acc.successful++;
        if(t.status === 'قيد التحويل') acc.pending++;
        if(t.status === 'مرفوض') acc.failed++;
        return acc;
    }, { successful: 0, pending: 0, failed: 0 });
  }
  const dailyEgyptianTransferStatus = calculateStatusCounts(dailyEgyptianTransfers);
  const monthlyEgyptianTransferStatus = calculateStatusCounts(monthlyEgyptianTransfers);

  const successfulEgyptianTransfers = mockEgyptianTransfers.filter(t => t.status === 'ناجح');
  const totalRevenueEGP = successfulEgyptianTransfers.reduce((sum, t) => sum + t.serviceFee, 0);

  const calculateRevenueByType = (transfers: EgyptianTransfer[]) => {
    const initial = EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
        acc[type] = { count: 0, revenue: 0 };
        return acc;
    }, {} as Record<EgyptianTransfer['transferType'], {count: number, revenue: number}>);

    return transfers.reduce((acc, t) => {
        if (t.status === 'ناجح' && acc[t.transferType]) {
            acc[t.transferType].count++;
            acc[t.transferType].revenue += t.serviceFee;
        }
        return acc;
    }, initial);
  };
  const dailyRevenueByType = calculateRevenueByType(dailyEgyptianTransfers);
  const monthlyRevenueByType = calculateRevenueByType(monthlyEgyptianTransfers);
  
  const supervisorStats = mockSupervisors.map(supervisor => {
    const supervisorDailyTransfers = dailyEgyptianTransfers.filter(
      transfer => transfer.delegate === supervisor.name && transfer.status === 'ناجح'
    );
    const supervisorMonthlyTransfers = monthlyEgyptianTransfers.filter(
      transfer => transfer.delegate === supervisor.name && transfer.status === 'ناجح'
    );
    const dailyTotalAmount = supervisorDailyTransfers.reduce((sum, t) => sum + t.sentAmount, 0);
    const monthlyTotalAmount = supervisorMonthlyTransfers.reduce((sum, t) => sum + t.sentAmount, 0);
    const monthlyTotalCount = supervisorMonthlyTransfers.length;
    const monthlyStatsByType = EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
      acc[type] = supervisorMonthlyTransfers.filter(t => t.transferType === type).length;
      return acc;
    }, {} as Record<EgyptianTransfer['transferType'], number>);

    return { ...supervisor, dailyTotalAmount, monthlyTotalAmount, monthlyTotalCount, monthlyStatsByType };
  });

  const isLoading = usersLoading || transactionsLoading;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-36" />
                <Skeleton className="h-64" />
                <Skeleton className="h-36" />
                <Skeleton className="h-28" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total LYD Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>إجمالي رصيد المستخدمين (د.ل)</CardTitle>
            <div className="p-2 rounded-full bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <FormattedAmount amount={totalLibyanBalance} currency="د.ل" integerClass="text-3xl font-bold" fractionClass="text-xl" currencyClass="text-base font-medium" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              إجمالي الأرصدة المتاحة بالدينار الليبي
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Trading Volume */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>تداول الدينار مقابل الجنيه</CardTitle>
            <div className="p-2 rounded-full bg-blue-100">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-1">اليوم</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>العمليات:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {dailyTradeStats.count}
                  </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>المبلغ بالدينار:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    <FormattedAmount amount={dailyTradeStats.lydAmount} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" />
                  </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>المبلغ بالجنيه:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    <FormattedAmount amount={dailyTradeStats.egpAmount} currency="ج.م" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" />
                  </span>
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>العمليات:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {monthlyTradeStats.count}
                  </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>المبلغ بالدينار:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    <FormattedAmount amount={monthlyTradeStats.lydAmount} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" />
                  </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:justify-between">
                  <span>المبلغ بالجنيه:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    <FormattedAmount amount={monthlyTradeStats.egpAmount} currency="ج.م" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" />
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total EGP Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>إجمالي رصيد المستخدمين (ج.م)</CardTitle>
            <div className="p-2 rounded-full bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
                <FormattedAmount amount={totalEgyptianBalance} currency="ج.م" integerClass="text-3xl font-bold" fractionClass="text-xl" currencyClass="text-base font-medium" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              إجمالي الأرصدة المتاحة بالجنيه المصري
            </p>
          </CardContent>
        </Card>

        {/* New Card 1: User Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إحصائيات المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">قيد المراجعة</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingVerificationUsers}</p>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* New Card 2: Card Revenue */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إيرادات الكروت (د.ل)</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                <div>
                    <h4 className="text-sm font-semibold mb-1">اليوم</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{dailyCardStats.count}</span></p>
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyCardStats.revenue} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" /></span></p>
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{monthlyCardStats.count}</span></p>
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyCardStats.revenue} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" /></span></p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* New Card 3: Internal Transfer Revenue */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إيرادات التحويل الداخلي (د.ل)</CardTitle>
                <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent className="pt-4 space-y-3">
                <div>
                    <h4 className="text-sm font-semibold mb-1">اليوم</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>عدد المعاملات:</span> <span className="font-semibold text-foreground">{dailyInternalStats.count}</span></p>
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyInternalStats.revenue} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" /></span></p>
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>عدد المعاملات:</span> <span className="font-semibold text-foreground">{monthlyInternalStats.count}</span></p>
                        <p className="flex flex-col sm:flex-row sm:justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyInternalStats.revenue} currency="د.ل" integerClass="font-semibold text-foreground" fractionClass="text-xs" currencyClass="text-xs" /></span></p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
            {/* New Card 4: Fakka Safe */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">حصالة الفكة</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <FormattedAmount amount={fakkaBalance} currency="ج.م" integerClass="text-2xl font-bold" fractionClass="text-lg" currencyClass="text-base font-medium" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  مجموع كسور التحويلات من الدينار للجنيه
                </p>
              </CardContent>
            </Card>

            {/* New Card 6: Egyptian Transfers Revenue (MOCK) */}
            <Card>
                <CardHeader>
                    <CardTitle>إيرادات التحويلات المصرية (وهمي)</CardTitle>
                    <CardDescription>إجمالي رسوم التحويلات الناجحة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                        <p>
                            <FormattedAmount amount={totalRevenueEGP} currency="ج.م" integerClass="text-2xl font-bold" fractionClass="text-lg" currencyClass="text-base font-medium" />
                        </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(dailyRevenueByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 px-3">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.revenue} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(monthlyRevenueByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 px-3">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.revenue} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>


        {/* New Card 5: Egyptian Transfers Summary (MOCK) */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity /> ملخص اليوم (وهمي)</CardTitle>
                    <CardDescription>
                    حوالات الجنيه المصري اليوم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                    <p className="text-xs text-muted-foreground">الإجمالي (ناجح + معلق)</p>
                    <p>
                        <FormattedAmount amount={dailyTotalActiveTransfersEGP} currency="ج.م" integerClass="text-2xl font-bold" fractionClass="text-lg" currencyClass="text-base font-medium" />
                    </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(dailySuccessfulStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 px-3">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.amount} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <h4 className="text-sm font-semibold mb-2 text-yellow-600 dark:text-yellow-400">الحوالات المعلقة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(dailyPendingStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 text-yellow-600 dark:text-yellow-400 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 border-yellow-500/50 bg-yellow-50 px-3 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/10 dark:text-yellow-400">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.amount} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">حالة الحوالات</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="flex justify-between"><span>ناجحة:</span> <span className="font-semibold text-foreground">{dailyEgyptianTransferStatus.successful}</span></p>
                            <p className="flex justify-between"><span>قيد التحويل:</span> <span className="font-semibold text-yellow-600 dark:text-yellow-400">{dailyEgyptianTransferStatus.pending}</span></p>
                            <p className="flex justify-between"><span>مرفوضة:</span> <span className="font-semibold text-foreground">{dailyEgyptianTransferStatus.failed}</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity /> ملخص الشهر (وهمي)</CardTitle>
                    <CardDescription>
                    حوالات الجنيه المصري هذا الشهر.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                    <p className="text-xs text-muted-foreground">الإجمالي (ناجح + معلق)</p>
                    <p>
                        <FormattedAmount amount={monthlyTotalActiveTransfersEGP} currency="ج.م" integerClass="text-2xl font-bold" fractionClass="text-lg" currencyClass="text-base font-medium" />
                    </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(monthlySuccessfulStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 px-3">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.amount} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <Separator />
                     <div>
                        <h4 className="text-sm font-semibold mb-2 text-yellow-600 dark:text-yellow-400">الحوالات المعلقة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(monthlyPendingStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex flex-col items-start gap-1 text-yellow-600 dark:text-yellow-400 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{type}</span>
                                    <div className="flex w-full items-center justify-end gap-4 sm:w-auto sm:justify-start">
                                        <Badge variant="outline" className="shrink-0 border-yellow-500/50 bg-yellow-50 px-3 text-yellow-700 dark:border-yellow-500/50 dark:bg-yellow-500/10 dark:text-yellow-400">{stats.count} حوالة</Badge>
                                        <span className="font-semibold text-left">
                                            <FormattedAmount amount={stats.amount} currency="ج.م" integerClass="font-semibold" fractionClass="text-xs" currencyClass="text-xs" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">حالة الحوالات</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="flex justify-between"><span>ناجحة:</span> <span className="font-semibold text-foreground">{monthlyEgyptianTransferStatus.successful}</span></p>
                            <p className="flex justify-between"><span>قيد التحويل:</span> <span className="font-semibold text-yellow-600 dark:text-yellow-400">{monthlyEgyptianTransferStatus.pending}</span></p>
                            <p className="flex justify-between"><span>مرفوضة:</span> <span className="font-semibold text-foreground">{monthlyEgyptianTransferStatus.failed}</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <span>ملخص أداء المندوبين لشهر</span>
            <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(0, m - 1).toLocaleString('ar', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>
            ملخص أداء المندوبين اليومي والشهري مع تفصيل أنواع الحوالات الناجحة (بيانات وهمية).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم المندوب</TableHead>
                <TableHead className="text-left">إجمالي اليومي (ج.م)</TableHead>
                <TableHead className="text-left">إجمالي الشهري (ج.م)</TableHead>
                <TableHead className="text-center">عدد حوالات الشهر</TableHead>
                {EGYPTIAN_TRANSFER_TYPES.map(type => (
                    <TableHead key={type} className="text-center">{type} (عدد)</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisorStats.map((supervisor) => {
                return (
                  <TableRow key={supervisor.id}>
                    <TableCell className="font-medium">{supervisor.name}</TableCell>
                    <TableCell className="text-left">
                        <FormattedAmount amount={supervisor.dailyTotalAmount} currency="ج.م" integerClass="font-bold" fractionClass="text-sm" currencyClass="text-sm" />
                    </TableCell>
                    <TableCell className="text-left">
                        <FormattedAmount amount={supervisor.monthlyTotalAmount} currency="ج.م" integerClass="font-bold" fractionClass="text-sm" currencyClass="text-sm" />
                    </TableCell>
                    <TableCell className="text-center font-semibold">{supervisor.monthlyTotalCount}</TableCell>
                    {EGYPTIAN_TRANSFER_TYPES.map(type => (
                       <TableCell key={type} className="text-center">{supervisor.monthlyStatsByType[type] || 0}</TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
