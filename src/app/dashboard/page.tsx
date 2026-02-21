
"use client";

import { useState, useMemo } from "react";
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
  DollarSign,
  ArrowRightLeft,
  Users,
  CreditCard,
  Landmark,
  PiggyBank,
  Activity,
  Banknote,
  Users2,
  Wallet,
  Truck
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

const EGYPTIAN_TRANSFER_TYPES: EgyptTransferTransaction['transferType'][] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

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
  const { data: users, isLoading: usersLoading, error: usersError } = useRtdbList<User>("/users");
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>("/supervisors");
  const { data: fakkaSafeData, isLoading: fakkaLoading } = useRtdbObject<{totalFakka: number}>("/fakkaSafe");

  const transactions = useMemo(() => {
    if (!users) return [];
    return users.flatMap(user => 
        user.transactions 
            ? Object.entries(user.transactions).map(([id, tx]) => ({ ...(tx as object), id })) 
            : []
    ) as Transaction[];
  }, [users]);
  const transactionsLoading = usersLoading;

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
    fakkaBalance,
    dailyEgyptianTransfers,
    monthlyEgyptianTransfers,
    dailyTotalActiveTransfersEGP,
    monthlyTotalActiveTransfersEGP,
    dailySuccessfulStatsByType,
    monthlySuccessfulStatsByType,
    dailyPendingStatsByType,
    monthlyPendingStatsByType,
    dailyEgyptianTransferStatus,
    monthlyEgyptianTransferStatus,
    totalRevenueEGP,
    dailyRevenueByType,
    monthlyRevenueByType,
    supervisorStats,
    monthlyTotalRevenueLYD,
    monthlyTotalRevenueEGP
  } = useMemo(() => {
    const usersData = users || [];
    const transactionsData = transactions || [];
    const supervisorsData = supervisors || [];

    const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const startOfMonth = new Date(todayDate.getFullYear(), selectedMonth - 1, 1);
    const endOfMonth = new Date(todayDate.getFullYear(), selectedMonth, 0, 23, 59, 59, 999);

    const totalLibyanBalance = usersData.reduce((sum, user) => sum + (user.balanceLYD || 0), 0);
    const totalEgyptianBalance = usersData.reduce((sum, user) => sum + (user.balanceEGP || 0), 0);

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
    
    const cardTransactions = transactionsData.filter((t): t is RechargePurchaseTransaction => t.type === "recharge_purchase" && t.status === "completed");
    const dailyCards = cardTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
    const monthlyCards = cardTransactions.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const dailyCardStats = {
        count: dailyCards.length,
        revenue: dailyCards.reduce((sum, t) => {
            const balanceChange = t.balanceBefore - t.balanceAfter;
            const fee = balanceChange - t.amount;
            return sum + (fee > 0 ? fee : 0);
        }, 0)
    };
    const monthlyCardStats = {
        count: monthlyCards.length,
        revenue: monthlyCards.reduce((sum, t) => {
            const balanceChange = t.balanceBefore - t.balanceAfter;
            const fee = balanceChange - t.amount;
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

    const fakkaBalance = fakkaSafeData?.totalFakka || 0;

    // Egyptian Transfers Stats (from live data)
    const egyptianTransfers = transactionsData.filter((t): t is EgyptTransferTransaction => t.type === 'egypt_transfer');
    
    const dailyEgyptianTransfers = egyptianTransfers.filter(t => new Date(t.timestamp) >= startOfToday);
    const monthlyEgyptianTransfers = egyptianTransfers.filter(t => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });
    
    const dailySuccessfulTransfersEGP = dailyEgyptianTransfers.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amountEGP, 0);
    const dailyPendingTransfersEGP = dailyEgyptianTransfers.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amountEGP, 0);
    const dailyTotalActiveTransfersEGP = dailySuccessfulTransfersEGP + dailyPendingTransfersEGP;

    const createStatsObject = () => EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
        acc[type] = { count: 0, amount: 0 };
        return acc;
    }, {} as Record<EgyptTransferTransaction['transferType'], {count: number, amount: number}>);
    
    const dailySuccessfulStatsByType = createStatsObject();
    const dailyPendingStatsByType = createStatsObject();

    dailyEgyptianTransfers.forEach(t => {
        if (t.status === 'completed' && dailySuccessfulStatsByType[t.transferType]) {
            dailySuccessfulStatsByType[t.transferType].count++;
            dailySuccessfulStatsByType[t.transferType].amount += t.amountEGP;
        } else if (t.status === 'pending' && dailyPendingStatsByType[t.transferType]) {
            dailyPendingStatsByType[t.transferType].count++;
            dailyPendingStatsByType[t.transferType].amount += t.amountEGP;
        }
    });
    
    const monthlySuccessfulTransfersEGP = monthlyEgyptianTransfers.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amountEGP, 0);
    const monthlyPendingTransfersEGP = monthlyEgyptianTransfers.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amountEGP, 0);
    const monthlyTotalActiveTransfersEGP = monthlySuccessfulTransfersEGP + monthlyPendingTransfersEGP;

    const monthlySuccessfulStatsByType = createStatsObject();
    const monthlyPendingStatsByType = createStatsObject();
    
    monthlyEgyptianTransfers.forEach(t => {
        if (t.status === 'completed' && monthlySuccessfulStatsByType[t.transferType]) {
            monthlySuccessfulStatsByType[t.transferType].count++;
            monthlySuccessfulStatsByType[t.transferType].amount += t.amountEGP;
        } else if (t.status === 'pending' && monthlyPendingStatsByType[t.transferType]) {
            monthlyPendingStatsByType[t.transferType].count++;
            monthlyPendingStatsByType[t.transferType].amount += t.amountEGP;
        }
    });

    const calculateStatusCounts = (transfers: EgyptTransferTransaction[]) => {
        return transfers.reduce((acc, t) => {
            if(t.status === 'completed') acc.successful++;
            if(t.status === 'pending') acc.pending++;
            if(t.status === 'failed') acc.failed++;
            return acc;
        }, { successful: 0, pending: 0, failed: 0 });
    };
    const dailyEgyptianTransferStatus = calculateStatusCounts(dailyEgyptianTransfers);
    const monthlyEgyptianTransferStatus = calculateStatusCounts(monthlyEgyptianTransfers);

    const successfulEgyptianTransfers = egyptianTransfers.filter(t => t.status === 'completed');
    const totalRevenueEGP = successfulEgyptianTransfers.reduce((sum, t) => sum + (t.serviceFee || 0), 0);

    const calculateRevenueByType = (transfers: EgyptTransferTransaction[]) => {
        const initial = EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
            acc[type] = { count: 0, revenue: 0 };
            return acc;
        }, {} as Record<EgyptTransferTransaction['transferType'], {count: number, revenue: number}>);

        return transfers.reduce((acc, t) => {
            if (t.status === 'completed' && acc[t.transferType]) {
                acc[t.transferType].count++;
                acc[t.transferType].revenue += (t.serviceFee || 0);
            }
            return acc;
        }, initial);
    };
    const dailyRevenueByType = calculateRevenueByType(dailyEgyptianTransfers);
    const monthlyRevenueByType = calculateRevenueByType(monthlyEgyptianTransfers);

    const supervisorStats = supervisorsData.map(supervisor => {
        const supervisorDailyTransfers = dailyEgyptianTransfers.filter(transfer => transfer.delegateName === supervisor.name && transfer.status === 'completed');
        const supervisorMonthlyTransfers = monthlyEgyptianTransfers.filter(transfer => transfer.delegateName === supervisor.name && transfer.status === 'completed');
        const dailyTotalAmount = supervisorDailyTransfers.reduce((sum, t) => sum + t.amountEGP, 0);
        const monthlyTotalAmount = supervisorMonthlyTransfers.reduce((sum, t) => sum + t.amountEGP, 0);
        const monthlyTotalCount = supervisorMonthlyTransfers.length;
        const monthlyStatsByType = EGYPTIAN_TRANSFER_TYPES.reduce((acc, type) => {
            acc[type] = supervisorMonthlyTransfers.filter(t => t.transferType === type).length;
            return acc;
        }, {} as Record<EgyptTransferTransaction['transferType'], number>);

        return { ...supervisor, dailyTotalAmount, monthlyTotalAmount, monthlyTotalCount, monthlyStatsByType };
    });
    
    const monthlyTotalRevenueLYD = monthlyInternalStats.revenue + monthlyCardStats.revenue;
    const monthlyTotalRevenueEGP = monthlyEgyptianTransfers.reduce((sum, t) => sum + (t.serviceFee || 0), 0);


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
        fakkaBalance,
        dailyEgyptianTransfers,
        monthlyEgyptianTransfers,
        dailyTotalActiveTransfersEGP,
        monthlyTotalActiveTransfersEGP,
        dailySuccessfulStatsByType,
        monthlySuccessfulStatsByType,
        dailyPendingStatsByType,
        monthlyPendingStatsByType,
        dailyEgyptianTransferStatus,
        monthlyEgyptianTransferStatus,
        totalRevenueEGP,
        dailyRevenueByType,
        monthlyRevenueByType,
        supervisorStats,
        monthlyTotalRevenueLYD,
        monthlyTotalRevenueEGP,
    };

   }, [users, transactions, supervisors, selectedMonth, todayDate, fakkaSafeData]);

  const isLoading = usersLoading || transactionsLoading || supervisorsLoading || fakkaLoading;
  
  const transferSummaryContent = (
      period: 'daily' | 'monthly',
      totalActive: number, 
      successfulStats: Record<string, {count: number, amount: number}>,
      pendingStats: Record<string, {count: number, amount: number}>,
      statusCounts: { successful: number, pending: number, failed: number }
    ) => (
    <CardContent className="space-y-4 pt-6 flex-grow flex flex-col justify-center">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">الإجمالي (ناجح + معلق)</p>
            <p>
                <FormattedAmount amount={totalActive} currency="ج.م" integerClass="text-xl md:text-2xl font-bold" fractionClass="text-md md:text-lg" currencyClass="text-sm md:text-base font-medium" />
            </p>
        </div>
        <Separator />
        <div>
            <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
            <div className="space-y-2 text-xs">
                {Object.entries(successfulStats).map(([type, stats]) => (
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
                {Object.entries(pendingStats).map(([type, stats]) => (
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
                <p className="flex justify-between"><span>ناجحة:</span> <span className="font-semibold text-foreground">{statusCounts.successful}</span></p>
                <p className="flex justify-between"><span>قيد التحويل:</span> <span className="font-semibold text-yellow-600 dark:text-yellow-400">{statusCounts.pending}</span></p>
                <p className="flex justify-between"><span>مرفوضة:</span> <span className="font-semibold text-foreground">{statusCounts.failed}</span></p>
            </div>
        </div>
    </CardContent>
  );

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <Skeleton className="h-96 lg:col-span-2" />
                <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-64" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-base">إجمالي الرصيد (د.ل)</CardTitle>
                            <CardDescription className="text-xs">رصيد جميع المستخدمين بالدينار</CardDescription>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
                            <DollarSign className="h-7 w-7 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center">
                    <FormattedAmount amount={totalLibyanBalance} currency="د.ل" integerClass="text-2xl md:text-3xl xl:text-4xl font-bold" fractionClass="text-lg md:text-xl xl:text-2xl" currencyClass="text-base md:text-lg" />
                </CardContent>
            </Card>
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-base">إجمالي الرصيد (ج.م)</CardTitle>
                            <CardDescription className="text-xs">رصيد جميع المستخدمين بالجنيه</CardDescription>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                            <DollarSign className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center">
                    <FormattedAmount amount={totalEgyptianBalance} currency="ج.م" integerClass="text-2xl md:text-3xl xl:text-4xl font-bold" fractionClass="text-lg md:text-xl xl:text-2xl" currencyClass="text-base md:text-lg" />
                </CardContent>
            </Card>
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-base">المستخدمون</CardTitle>
                            <CardDescription className="text-xs">إجمالي المستخدمين والحسابات المعلقة</CardDescription>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                            <Users2 className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-grow items-center justify-center gap-4">
                    <div className="text-4xl font-bold">{totalUsers}</div>
                    <div className="text-lg text-yellow-600 dark:text-yellow-400">({pendingVerificationUsers} معلق)</div>
                </CardContent>
            </Card>
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="text-base">حصالة الفكة</CardTitle>
                            <CardDescription className="text-xs">مجموع كسور التحويلات</CardDescription>
                        </div>
                        <div className="p-3 bg-pink-100 dark:bg-pink-500/20 rounded-lg">
                            <PiggyBank className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center">
                    <FormattedAmount amount={fakkaBalance} currency="ج.م" integerClass="text-2xl md:text-3xl xl:text-4xl font-bold" fractionClass="text-lg md:text-xl xl:text-2xl" currencyClass="text-base md:text-lg" />
                </CardContent>
            </Card>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">إيرادات الشهر (د.ل)</CardTitle>
                        <CardDescription>الرسوم من (DD) و (DC)</CardDescription>
                    </div>
                     <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
                        <DollarSign className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                 <div className="text-center">
                    <FormattedAmount amount={monthlyTotalRevenueLYD} currency="د.ل" integerClass="text-2xl xl:text-3xl font-bold" fractionClass="text-lg xl:text-xl" currencyClass="text-sm xl:text-base" />
                </div>
                <Separator />
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>التحويل الداخلي (DD):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyInternalStats.revenue} currency="د.ل" /></span></p>
                    <p className="flex justify-between"><span>شراء الكروت (DC):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyCardStats.revenue} currency="د.ل" /></span></p>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>تداول الدينار مقابل الجنيه</CardTitle>
                        <CardDescription>العمليات الناجحة (DG)</CardDescription>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                        <ArrowRightLeft className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                <div>
                <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailyTradeStats.count}</span></p>
                    <p className="flex justify-between"><span>المبلغ (د.ل):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyTradeStats.lydAmount} currency="د.ل" /></span></p>
                    <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyTradeStats.egpAmount} currency="ج.م" /></span></p>
                </div>
                </div>
                <Separator />
                <div>
                <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlyTradeStats.count}</span></p>
                    <p className="flex justify-between"><span>المبلغ (د.ل):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyTradeStats.lydAmount} currency="د.ل" /></span></p>
                    <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyTradeStats.egpAmount} currency="ج.م" /></span></p>
                </div>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>التحويل الداخلي (DD)</CardTitle>
                        <CardDescription>العمليات ورسومها بالدينار</CardDescription>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
                        <Wallet className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                <div>
                <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailyInternalStats.count}</span></p>
                    <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyInternalStats.revenue} currency="د.ل" /></span></p>
                </div>
                </div>
                <Separator />
                <div>
                <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlyInternalStats.count}</span></p>
                    <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyInternalStats.revenue} currency="د.ل" /></span></p>
                </div>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>شراء الكروت (DC)</CardTitle>
                        <CardDescription>العمليات ورسومها بالدينار</CardDescription>
                    </div>
                    <div className="p-3 bg-sky-100 dark:bg-sky-500/20 rounded-lg">
                        <CreditCard className="h-7 w-7 text-sky-600 dark:text-sky-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                <div>
                <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{dailyCardStats.count}</span></p>
                    <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailyCardStats.revenue} currency="د.ل" /></span></p>
                </div>
                </div>
                <Separator />
                <div>
                <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{monthlyCardStats.count}</span></p>
                    <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlyCardStats.revenue} currency="د.ل" /></span></p>
                </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>إيرادات الشهر (ج.م)</CardTitle>
                        <CardDescription>إجمالي رسوم التحويلات المصرية</CardDescription>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                        <Banknote className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                <div className="text-center">
                    <FormattedAmount amount={monthlyTotalRevenueEGP} currency="ج.م" integerClass="text-2xl xl:text-3xl font-bold" fractionClass="text-lg xl:text-xl" currencyClass="text-sm xl:text-base" />
                </div>
                <Separator />
                <div>
                    <h4 className="text-sm font-semibold mb-2">تفاصيل الشهر</h4>
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

        <Card className="lg:col-span-2 bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
            <Tabs defaultValue="today" dir="rtl" className="flex flex-col flex-grow">
                <CardHeader>
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Activity /> ملخص التحويلات المصرية</CardTitle>
                            <CardDescription>عرض تفصيلي للحوالات الناجحة والمعلقة.</CardDescription>
                        </div>
                        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                            <TabsTrigger value="today">اليوم</TabsTrigger>
                            <TabsTrigger value="month">هذا الشهر</TabsTrigger>
                        </TabsList>
                    </div>
                </CardHeader>
                <TabsContent value="today" className="flex-grow">
                    {transferSummaryContent('daily', dailyTotalActiveTransfersEGP, dailySuccessfulStatsByType, dailyPendingStatsByType, dailyEgyptianTransferStatus)}
                </TabsContent>
                <TabsContent value="month" className="flex-grow">
                    {transferSummaryContent('monthly', monthlyTotalActiveTransfersEGP, monthlySuccessfulStatsByType, monthlyPendingStatsByType, monthlyEgyptianTransferStatus)}
                </TabsContent>
            </Tabs>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">تفاصيل التحويلات المصرية الناجحة</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>محفظة كاش (EC)</CardTitle>
                            <CardDescription>التحويلات الناجحة</CardDescription>
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                            <Landmark className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailySuccessfulStatsByType['محفظة كاش']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailySuccessfulStatsByType['محفظة كاش']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlySuccessfulStatsByType['محفظة كاش']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlySuccessfulStatsByType['محفظة كاش']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>انستاباي (EI)</CardTitle>
                            <CardDescription>التحويلات الناجحة</CardDescription>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <Banknote className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailySuccessfulStatsByType['انستاباي']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailySuccessfulStatsByType['انستاباي']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlySuccessfulStatsByType['انستاباي']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlySuccessfulStatsByType['انستاباي']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>وصلي للبيت (EW)</CardTitle>
                            <CardDescription>التحويلات الناجحة</CardDescription>
                        </div>
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                            <Truck className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-center">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailySuccessfulStatsByType['وصلني البيت']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={dailySuccessfulStatsByType['وصلني البيت']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">هذا الشهر</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlySuccessfulStatsByType['وصلني البيت']?.count || 0}</span></p>
                            <p className="flex justify-between"><span>المبلغ (ج.م):</span> <span className="font-semibold text-foreground text-left"><FormattedAmount amount={monthlySuccessfulStatsByType['وصلني البيت']?.amount || 0} currency="ج.م" /></span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card className="bg-card/50 dark:bg-card/30 backdrop-blur-xl flex flex-col">
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
            ملخص أداء المندوبين اليومي والشهري مع تفصيل أنواع الحوالات الناجحة.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto flex-grow">
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
