
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRtdbList } from "@/firebase";
import type { User, Transaction, EgyptTransferTransaction, Supervisor, RechargePurchaseTransaction, AccountTransferTransaction, EgyptLocalTransferTransaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRightLeft,
  Banknote,
  Users2,
  Wallet,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  BarChart3
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

const E_TYPES: EgyptTransferTransaction['transferType'][] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

const FormattedAmount = ({
    amount,
    currency,
    integerClass,
    fractionClass,
    currencyClass,
    className
}: {
    amount: number;
    currency: string;
    integerClass?: string;
    fractionClass?: string;
    currencyClass?: string;
    className?: string;
}) => {
    const [integer, fraction] = (amount || 0).toFixed(2).split('.');
    return (
        <div className={cn('flex items-baseline gap-x-1 whitespace-nowrap leading-none', className)} dir="ltr">
            <span className={cn('shrink-0 font-bold text-[#1B69FF] font-sans', currencyClass)}>{currency}</span>
            <span className={cn('tabular-nums tracking-tighter font-bold', integerClass)}>{Number(integer).toLocaleString('en-US')}</span>
            <span className={cn('text-muted-foreground opacity-60 shrink-0 tabular-nums text-[0.7em]', fractionClass)}>.{fraction}</span>
        </div>
    );
};

export default function DashboardPage() {
  const { data: users, isLoading: usersLoading } = useRtdbList<User>("/users");
  const { data: globalPendingTransfers, isLoading: pendingLoading } = useRtdbList<EgyptLocalTransferTransaction>("admin/pending_egypt_transfers");
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>("/supervisors");

  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
  const [selectedDay, setSelectedDay] = useState(new Date().getDate()); 
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  }, []);

  const transactions = useMemo(() => {
    const txMap = new Map<string, Transaction>();
    
    if (users) {
        users.forEach(user => {
            if (user.transactions) {
                Object.entries(user.transactions).forEach(([id, tx]) => {
                    txMap.set(id, { ...(tx as object), id } as Transaction);
                });
            }
        });
    }

    if (globalPendingTransfers) {
        globalPendingTransfers.forEach(tx => {
            if (!txMap.has(tx.id)) {
                txMap.set(tx.id, tx as Transaction);
            }
        });
    }

    return Array.from(txMap.values());
  }, [users, globalPendingTransfers]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, selectedMonth, 0).getDate();
  }, [selectedMonth, currentYear]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const getMonthName = (month: number) => {
    const date = new Date();
    date.setMonth(month - 1);
    return date.toLocaleString('ar', { month: 'long' });
  };

  const InlineMonthSelector = () => {
    const now = new Date();
    const isThisMonth = selectedMonth === (now.getMonth() + 1);
    const displayLabel = isThisMonth ? `هذا الشهر (${getMonthName(selectedMonth)})` : `شهر ${getMonthName(selectedMonth)}`;

    return (
        <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
        <SelectTrigger className="inline-flex h-9 w-auto border-none bg-[#E3F2FD] px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
            <SelectValue placeholder={displayLabel} />
        </SelectTrigger>
        <SelectContent dir="rtl" className="rounded-2xl border-none shadow-2xl">
            {months.map((m) => (
            <SelectItem key={m} value={String(m)} className="rounded-xl font-bold">
                {m === (now.getMonth() + 1) ? `هذا الشهر (${getMonthName(m)})` : getMonthName(m)}
            </SelectItem>
            ))}
        </SelectContent>
        </Select>
    );
  };

  const InlineDaySelector = () => {
    const now = new Date();
    const isToday = selectedDay === now.getDate() && selectedMonth === (now.getMonth() + 1);
    const displayLabel = isToday ? "اليوم" : `يوم ${selectedDay}`;
    
    return (
      <Select value={String(selectedDay)} onValueChange={(val) => setSelectedDay(Number(val))}>
        <SelectTrigger className="inline-flex h-9 w-auto border-none bg-[#E3F2FD] px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#1B69FF] hover:bg-[#E3F2FD]/80 focus:ring-0 transition-all cursor-pointer">
          <SelectValue placeholder={displayLabel} />
        </SelectTrigger>
        <SelectContent dir="rtl" className="max-h-[300px] rounded-2xl border-none shadow-2xl">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)} className="rounded-xl font-bold">
              {d === now.getDate() && selectedMonth === (now.getMonth() + 1) ? "اليوم" : `يوم ${d}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const stats = useMemo(() => {
    if (!isMounted || !users) return null;

    const startOfSelectedDay = new Date(currentYear, selectedMonth - 1, selectedDay);
    const endOfSelectedDay = new Date(currentYear, selectedMonth - 1, selectedDay, 23, 59, 59, 999);
    const startOfMonth = new Date(currentYear, selectedMonth - 1, 1);
    const endOfMonth = new Date(currentYear, selectedMonth, 0, 23, 59, 59, 999);

    const totalLibyanBalance = users.reduce((sum, user) => sum + (user.balanceLYD || 0), 0);
    const totalEgyptianBalance = users.reduce((sum, user) => sum + (user.balanceEGP || 0), 0);

    const getDisplayType = (t: any): EgyptTransferTransaction['transferType'] => {
        const typeStr = t.transferType || t.methodDisplayName || t.type || '';
        if (typeStr.includes('محفظة') || typeStr.includes('محافظ')) return 'محفظة كاش';
        if (typeStr.includes('انستاباي') || typeStr.includes('إنستاباي')) return 'انستاباي';
        if (typeStr.includes('بيت') || typeStr.includes('منزلي')) return 'وصلني البيت';
        return 'محفظة كاش';
    };

    const isEgyptType = (t: Transaction) => 
        t.type === "egypt_transfer" || 
        t.type === "egypt_home" || 
        t.type === "egypt_wallets" || 
        t.type === "egypt_instapay";

    const egyptTransfers = transactions.filter(isEgyptType);
    const completedEgyptTransfers = egyptTransfers.filter(t => t.status === "completed");

    const dailyTrades = completedEgyptTransfers.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyTrades = completedEgyptTransfers.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const dailyTradeStats = {
        count: dailyTrades.length,
        lydAmount: dailyTrades.reduce((sum, t) => sum + ((t as any).amountLYD || 0), 0),
        egpAmount: dailyTrades.reduce((sum, t) => sum + ((t as any).amountEGP || 0), 0),
        fakkaAmount: dailyTrades.reduce((sum, t) => sum + ((t as any).fakkaAmount || 0), 0),
    };
    const monthlyTradeStats = {
        count: monthlyTrades.length,
        lydAmount: monthlyTrades.reduce((sum, t) => sum + ((t as any).amountLYD || 0), 0),
        egpAmount: monthlyTrades.reduce((sum, t) => sum + ((t as any).amountEGP || 0), 0),
        fakkaAmount: monthlyTrades.reduce((sum, t) => sum + ((t as any).fakkaAmount || 0), 0),
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

    const createTransferStats = (list: Transaction[]) => {
        const statsObj = E_TYPES.reduce((acc, type) => {
            acc[type] = { count: 0, amount: 0 };
            return acc;
        }, {} as any);

        list.forEach(t => {
            const displayType = getDisplayType(t);
            if (statsObj[displayType]) {
                statsObj[displayType].count++;
                statsObj[displayType].amount += (t as any).amountEGP || 0;
            }
        });
        return statsObj;
    };

    const createStatusStats = (list: Transaction[]) => ({
        successful: list.filter(t => t.status === 'completed').length,
        pending: list.filter(t => t.status === 'pending').length,
        failed: list.filter(t => t.status === 'failed').length,
        totalActive: list.filter(t => t.status === 'completed' || t.status === 'pending').reduce((sum, t) => sum + ((t as any).amountEGP || 0), 0)
    });

    const dailyEgyptList = egyptTransfers.filter(t => t.timestamp >= startOfSelectedDay.getTime() && t.timestamp <= endOfSelectedDay.getTime());
    const monthlyEgyptList = egyptTransfers.filter(t => t.timestamp >= startOfMonth.getTime() && t.timestamp <= endOfMonth.getTime());

    const monthlyRevenueByType = E_TYPES.reduce((acc, type) => {
        const typeTransfers = monthlyEgyptList.filter(t => getDisplayType(t) === type && t.status === 'completed');
        acc[type] = {
            count: typeTransfers.length,
            revenue: typeTransfers.reduce((sum, t) => sum + ((t as any).serviceFee || 0), 0)
        };
        return acc;
    }, {} as any);

    const supervisorSummary = (supervisors || []).map(s => {
        const sMonthTx = monthlyEgyptList.filter(t => ((t as any).delegateName === s.name || (t as any).agentInfo === s.name) && t.status === 'completed');
        return {
            id: s.id,
            name: s.name,
            dailyTotal: dailyEgyptList.filter(t => ((t as any).delegateName === s.name || (t as any).agentInfo === s.name) && t.status === 'completed').reduce((sum, t) => sum + ((t as any).amountEGP || 0), 0),
            monthlyTotal: sMonthTx.reduce((sum, t) => sum + ((t as any).amountEGP || 0), 0),
            monthlyFees: sMonthTx.reduce((sum, t) => sum + ((t as any).serviceFee || 0), 0),
            monthlyCount: sMonthTx.length,
            details: E_TYPES.map(type => sMonthTx.filter(t => getDisplayType(t) === type).length)
        };
    });

    return {
        totalLibyanBalance,
        totalEgyptianBalance,
        dailyTradeStats,
        monthlyTradeStats,
        userCounts,
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
        monthlyTotalRevenueEGP: monthlyEgyptList.filter(t => t.status === 'completed').reduce((sum, t) => sum + ((t as any).serviceFee || 0), 0),
        monthlyRevenueByType,
        supervisorSummary
    };
  }, [isMounted, users, transactions, selectedMonth, selectedDay, supervisors, currentYear]);

  const isLoading = usersLoading || pendingLoading || supervisorsLoading || !isMounted;

  if (isLoading || !stats) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <ShieldCheck className="h-12 md:h-16 w-12 md:w-16 text-primary animate-pulse" />
                <p className="text-[#001F3D] font-black text-lg md:text-xl">جاري معالجة البيانات المباشرة...</p>
            </div>
        </div>
    );
  }

  const renderTransferSummary = (summary: any, successful: any, pending: any) => (
    <CardContent className="space-y-4 md:space-y-6 pt-6 md:pt-10 flex-grow flex flex-col justify-center px-4 md:px-10">
        <div className="text-right p-4 md:p-6 bg-[#E3F2FD] rounded-2xl md:rounded-[2rem] border border-[#1B69FF]/5 w-full">
            <p className="text-[9px] md:text-[10px] font-black uppercase text-[#1B69FF]/60 tracking-widest mb-1 md:mb-2 text-right">إجمالي الحوالات (ناجح + معلق)</p>
            <FormattedAmount amount={summary.totalActive} currency="ج.م" integerClass="text-xl md:text-2xl lg:text-3xl font-black text-[#1B69FF]" fractionClass="text-xs md:text-sm" currencyClass="text-sm md:text-lg font-bold" className="justify-start w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm text-green-600">
                <h4 className="text-[10px] md:text-xs font-black uppercase text-inherit tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse"></div>
                    الحوالات الناجحة
                </h4>
                <div className="space-y-2 md:space-y-3">
                    {Object.entries(successful).map(([type, s]: [string, any]) => (
                        <div key={type} className="flex justify-between items-center text-xs md:text-sm gap-2">
                            <span className="font-bold text-slate-500 shrink-0">{type}</span>
                            <div className="flex items-center gap-2 md:gap-3">
                                <Badge variant="outline" className="rounded-full bg-green-50 text-green-700 border-green-100 font-bold text-[9px] md:text-[10px] shrink-0">{s.count} حوالة</Badge>
                                <FormattedAmount amount={s.amount} currency="ج.م" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm text-yellow-600">
                <h4 className="text-[10px] md:text-xs font-black uppercase text-inherit tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-yellow-500"></div>
                    الحوالات المعلقة
                </h4>
                <div className="space-y-2 md:space-y-3">
                    {Object.entries(pending).map(([type, s]: [string, any]) => (
                        <div key={type} className="flex justify-between items-center text-xs md:text-sm gap-2">
                            <span className="font-bold text-slate-500 shrink-0">{type}</span>
                            <div className="flex items-center gap-2 md:gap-3">
                                <Badge variant="outline" className="rounded-full bg-yellow-50 text-yellow-700 border-yellow-100 font-bold text-[9px] md:text-[10px] shrink-0">{s.count} حوالة</Badge>
                                <FormattedAmount amount={s.amount} currency="ج.م" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <Separator className="bg-slate-100" />
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div><p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">ناجحة</p><p className="font-black text-green-600 text-lg md:text-xl">{summary.successful}</p></div>
            <div><p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">معلق</p><p className="font-black text-yellow-600 text-lg md:text-xl">{summary.pending}</p></div>
            <div><p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mb-1">مرفوض</p><p className="font-black text-red-600 text-lg md:text-xl">{summary.failed}</p></div>
        </div>
    </CardContent>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-10 max-w-full overflow-visible">
        <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-[#001F3D] font-black text-base md:text-lg text-right">إجمالي الرصيد الليبي</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs font-bold text-slate-400 text-right">رصيد جميع المستخدمين بالدينار</CardDescription>
                        </div>
                        <div className="p-3 md:p-4 bg-green-50 rounded-xl md:rounded-[1.5rem] shrink-0 flex items-center justify-center min-w-[50px] md:min-w-[64px]">
                            <span className="text-green-600 font-black text-xs md:text-sm">LYD</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-start py-6 md:py-10 px-6 text-right overflow-visible">
                    <div className="w-full overflow-visible">
                        <FormattedAmount 
                            amount={stats.totalLibyanBalance} 
                            currency="د.ل" 
                            integerClass="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-green-600" 
                            currencyClass="text-[10px] sm:text-xs md:text-sm lg:text-lg font-bold text-green-600" 
                            className="justify-start w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div><CardTitle className="text-[#001F3D] font-black text-base md:text-lg">تداول العملات</CardTitle><CardDescription className="text-[10px] md:text-xs font-bold text-slate-400">العمليات الناجحة (DG)</CardDescription></div>
                        <div className="p-3 md:p-4 bg-blue-50 rounded-xl md:rounded-[1.5rem] shrink-0"><ArrowRightLeft className="h-5 w-5 md:h-6 md:w-6 text-[#1B69FF]" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 flex-grow flex flex-col justify-center py-4 md:py-6 px-4 md:px-6 overflow-visible">
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <div className="flex items-center justify-between">
                            <h4 className="mb-2"><InlineDaySelector /></h4>
                        </div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">العمليات</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.dailyTradeStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">المبلغ الليبي</span><FormattedAmount amount={stats.dailyTradeStats.lydAmount} currency="د.ل" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">المبلغ المصري</span><FormattedAmount amount={stats.dailyTradeStats.egpAmount} currency="ج.م" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">حصالة الفكة</span><FormattedAmount amount={stats.dailyTradeStats.fakkaAmount} currency="ج.م" integerClass="font-bold text-xs md:text-sm text-orange-600" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                    </div>
                    <Separator className="bg-slate-50" />
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <div className="flex items-center justify-between">
                            <h4 className="mb-2"><InlineMonthSelector /></h4>
                        </div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">العمليات</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.monthlyTradeStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">المبلغ الليبي</span><FormattedAmount amount={stats.monthlyTradeStats.lydAmount} currency="د.ل" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">المبلغ المصري</span><FormattedAmount amount={stats.monthlyTradeStats.egpAmount} currency="ج.م" integerClass="font-bold text-xs md:text-sm" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">حصالة الفكة</span><FormattedAmount amount={stats.monthlyTradeStats.fakkaAmount} currency="ج.م" integerClass="font-bold text-xs md:text-sm text-orange-600" currencyClass="text-[9px] md:text-[10px] font-bold" className="justify-start w-full" /></div>
                    </div>
                </CardContent>
            </Card>

            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-[#001F3D] font-black text-base md:text-lg text-right">إجمالي الرصيد المصري</CardTitle>
                            <CardDescription className="text-[10px] md:text-xs font-bold text-slate-400 text-right">رصيد جميع المستخدمين بالجنيه</CardDescription>
                        </div>
                        <div className="p-3 md:p-4 bg-purple-50 rounded-xl md:rounded-[1.5rem] shrink-0 flex items-center justify-center min-w-[50px] md:min-w-[64px]">
                            <span className="text-purple-600 font-black text-xs md:text-sm">EGP</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-start py-6 md:py-10 px-6 text-right overflow-visible">
                    <div className="w-full overflow-visible">
                        <FormattedAmount 
                            amount={stats.totalEgyptianBalance} 
                            currency="ج.م" 
                            integerClass="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-purple-600" 
                            currencyClass="text-[10px] sm:text-xs md:text-sm lg:text-lg font-bold text-purple-600" 
                            className="justify-start w-full"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div><CardTitle className="text-[#001F3D] font-black text-base md:text-lg">إدارة المستخدمين</CardTitle><CardDescription className="text-[9px] md:text-[10px] text-yellow-500 font-black uppercase tracking-widest">{stats.userCounts.pendingDoc} طلب توثيق</CardDescription></div>
                        <div className="p-3 md:p-4 bg-orange-50 rounded-xl md:rounded-[1.5rem] shrink-0"><Users2 className="h-5 w-5 md:h-6 md:w-6 text-orange-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center py-4 md:py-6 px-4 md:px-6 overflow-visible">
                    <div className="text-center text-4xl md:text-6xl font-black text-[#001F3D] mb-6 md:mb-8 tabular-nums">{stats.userCounts.total}</div>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="flex justify-between items-center bg-green-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-green-100"><span className="text-[8px] md:text-[10px] font-black text-green-700 uppercase">تاجر</span><span className="font-bold text-green-700 text-xs md:text-base">{stats.userCounts.merchants}</span></div>
                        <div className="flex justify-between items-center bg-blue-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-blue-100"><span className="text-[8px] md:text-[10px] font-black text-blue-700 uppercase">موثق</span><span className="font-bold text-blue-700 text-xs md:text-base">{stats.userCounts.verified}</span></div>
                        <div className="flex justify-between items-center bg-yellow-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-yellow-100"><span className="text-[8px] md:text-[10px] font-black text-yellow-700 uppercase">غير موثق</span><span className="font-bold text-yellow-700 text-xs md:text-base">{stats.userCounts.unverified}</span></div>
                        <div className="flex justify-between items-center bg-red-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-red-100"><span className="text-[8px] md:text-[10px] font-black text-red-700 uppercase">مجمد</span><span className="font-bold text-red-700 text-xs md:text-base">{stats.userCounts.banned}</span></div>
                    </div>
                </CardContent>
            </Card>

            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div><CardTitle className="text-[#001F3D] font-black text-base md:text-lg">التحويل الداخلي (DD)</CardTitle><CardDescription className="text-[10px] md:text-xs font-bold text-slate-400">العمليات والرسوم بالدينار</CardDescription></div>
                        <div className="p-3 md:p-4 bg-green-50 rounded-xl md:rounded-[1.5rem] shrink-0"><Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 flex-grow flex flex-col justify-center py-4 md:py-6 px-4 md:px-6 overflow-visible">
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <h4 className="mb-2"><InlineDaySelector /></h4>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">العمليات</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.dailyInternalStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">إجمالي الرسوم</span><FormattedAmount amount={stats.dailyInternalStats.revenue} currency="د.ل" integerClass="font-bold text-xs md:text-sm text-green-600" className="justify-start w-full" /></div>
                    </div>
                    <Separator className="bg-slate-50" />
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <h4 className="mb-2"><InlineMonthSelector /></h4>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">العمليات</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.monthlyInternalStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">إجمالي الرسوم</span><FormattedAmount amount={stats.monthlyInternalStats.revenue} currency="د.ل" integerClass="font-bold text-xs md:text-sm text-green-600" className="justify-start w-full" /></div>
                    </div>
                </CardContent>
            </Card>

            <Card className="floating-card flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div><CardTitle className="text-[#001F3D] font-black text-base md:text-lg">متجر الكروت (DC)</CardTitle><CardDescription className="text-[10px] md:text-xs font-bold text-slate-400">مبيعات الكروت المباشرة</CardDescription></div>
                        <div className="p-3 md:p-4 bg-sky-50 rounded-xl md:rounded-[1.5rem] shrink-0"><CreditCard className="h-5 w-5 md:h-6 md:w-6 text-sky-600" /></div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 flex-grow flex flex-col justify-center py-4 md:py-6 px-4 md:px-6 overflow-visible">
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <h4 className="mb-2"><InlineDaySelector /></h4>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">عدد الكروت</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.dailyCardStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">قيمة المبيعات</span><FormattedAmount amount={stats.dailyCardStats.value} currency="د.ل" integerClass="font-bold text-xs md:text-sm text-sky-600" className="justify-start w-full" /></div>
                    </div>
                    <Separator className="bg-slate-50" />
                    <div className="space-y-2 md:space-y-3 overflow-visible">
                        <h4 className="mb-2"><InlineMonthSelector /></h4>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">عدد الكروت</span><span className="font-bold text-[#001F3D] text-sm md:text-base text-left flex-1" dir="ltr">{stats.monthlyCardStats.count}</span></div>
                        <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold text-xs md:text-sm shrink-0">قيمة المبيعات</span><FormattedAmount amount={stats.monthlyCardStats.value} currency="د.ل" integerClass="font-bold text-xs md:text-sm text-sky-600" className="justify-start w-full" /></div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-3 items-stretch">
            <Card className="floating-card lg:col-span-1 flex flex-col p-1 md:p-2 overflow-visible">
                <CardHeader className="pb-2 md:pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col space-y-1">
                            <CardTitle className="text-[#001F3D] font-black text-base md:text-lg text-right">رسوم التحويلات المصرية</CardTitle>
                            <CardDescription className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest text-right">إيرادات <InlineMonthSelector /></CardDescription>
                        </div>
                        <div className="p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-[1.5rem] shadow-inner shadow-indigo-600/5 shrink-0">
                            <Banknote className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6 flex-grow flex flex-col justify-center py-4 md:py-6 px-4 md:px-6 overflow-visible">
                    <div className="text-right py-3 md:py-4 bg-indigo-50/50 rounded-xl md:rounded-[1.5rem] border border-indigo-100/50 w-full overflow-visible px-6">
                        <FormattedAmount amount={stats.monthlyTotalRevenueEGP} currency="ج.م" integerClass="text-xl md:text-2xl font-black text-indigo-600" currencyClass="text-[10px] md:text-sm font-bold" className="justify-start w-full" />
                    </div>
                    <Separator className="bg-slate-100" />
                    <div className="space-y-3 md:space-y-4 overflow-visible">
                        {Object.entries(stats.monthlyRevenueByType).map(([type, s]: [string, any]) => (
                            <div key={type} className="flex justify-between items-center text-xs md:text-sm gap-2">
                                <span className="font-bold text-slate-500 shrink-0">{type}</span>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Badge variant="outline" className="rounded-full bg-slate-50 text-slate-600 border-slate-200 font-bold text-[9px] md:text-[10px] px-1.5 md:px-2 shrink-0">{s.count}</Badge>
                                    <FormattedAmount amount={s.revenue} currency="ج.م" integerClass="font-bold text-[#001F3D] text-xs md:text-sm" className="justify-start" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="floating-card lg:col-span-2 flex flex-col p-1 md:p-2 overflow-visible">
                <Tabs defaultValue="today" dir="rtl" className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2 md:gap-3 text-[#001F3D] font-black text-lg md:text-xl">
                                <TrendingUp className="h-5 w-5 md:h-6 md:w-6" /> 
                                ملخص الحوالات المصرية
                            </CardTitle>
                            <TabsList className="bg-slate-100 p-1 rounded-xl md:rounded-2xl h-10 md:h-12 w-full sm:w-auto">
                                <TabsTrigger value="today" className="flex-1 sm:flex-none rounded-lg md:rounded-xl px-4 md:px-6 font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">تقرير اليوم</TabsTrigger>
                                <TabsTrigger value="month" className="flex-1 sm:flex-none rounded-lg md:rounded-xl px-4 md:px-6 font-black text-[10px] md:text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">تقرير الشهر</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <TabsContent value="today" className="flex-grow m-0 focus-visible:ring-0 overflow-visible">
                        <div className="px-4 md:px-10 py-2"><InlineDaySelector /></div>
                        {renderTransferSummary(stats.dailyEgyptSummary, stats.dailyEgyptDetailed, stats.dailyPendingDetailed)}
                    </TabsContent>
                    <TabsContent value="month" className="flex-grow m-0 focus-visible:ring-0 overflow-visible">
                        <div className="px-4 md:px-10 py-2"><InlineMonthSelector /></div>
                        {renderTransferSummary(stats.monthlyEgyptSummary, stats.monthlyEgyptDetailed, stats.monthlyPendingDetailed)}
                    </TabsContent>
                </Tabs>
            </Card>
        </div>

        <Card className="floating-card p-2 md:p-4 overflow-hidden">
            <CardHeader className="pb-4 md:pb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-3 md:p-4 bg-[#E3F2FD] rounded-xl md:rounded-[1.5rem] shrink-0"><BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-[#1B69FF]" /></div>
                        <div>
                            <CardTitle className="text-[#001F3D] font-black text-lg md:text-2xl">أداء المندوبين</CardTitle>
                            <CardDescription className="text-xs font-bold text-slate-400">عرض شامل لمبالغ التحويل والرسوم حسب المندوب</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <InlineMonthSelector />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-1 md:px-6 overflow-hidden">
                <div className="rounded-2xl md:rounded-[2rem] border border-slate-100 overflow-x-auto shadow-inner bg-slate-50/30 w-full">
                    <Table className="min-w-[600px] md:min-w-full">
                        <TableHeader className="bg-white">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                <TableHead className="font-black text-[#001F3D] text-center uppercase tracking-widest text-[9px] md:text-[10px]">المندوب</TableHead>
                                <TableHead className="text-center font-black text-[#001F3D] uppercase tracking-widest text-[9px] md:text-[10px]">تداول اليوم</TableHead>
                                <TableHead className="text-center font-black text-[#001F3D] uppercase tracking-widest text-[9px] md:text-[10px]">إجمالي الشهر</TableHead>
                                <TableHead className="text-center font-black text-[#001F3D] uppercase tracking-widest text-[9px] md:text-[10px]">إجمالي الرسوم</TableHead>
                                <TableHead className="text-center font-black text-[#001F3D] uppercase tracking-widest text-[9px] md:text-[10px]">العمليات</TableHead>
                                {E_TYPES.map(t => <TableHead key={t} className="text-center font-black text-[#001F3D] uppercase tracking-widest text-[9px] md:text-[10px]">{t}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.supervisorSummary.map(s => (
                                <TableRow key={s.id} className="hover:bg-[#E3F2FD]/30 transition-colors border-b border-slate-50/50 last:border-0">
                                    <TableCell className="font-black text-[#001F3D] text-center text-xs md:sm">{s.name}</TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.dailyTotal} currency="ج.م" integerClass="font-bold text-slate-600 text-xs md:text-sm" currencyClass="text-[8px] md:text-[10px] font-bold" className="justify-start" /></TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.monthlyTotal} currency="ج.م" integerClass="font-bold text-[#001F3D] text-xs md:text-sm" currencyClass="text-[8px] md:text-[10px] font-bold" className="justify-start" /></TableCell>
                                    <TableCell className="text-center"><FormattedAmount amount={s.monthlyFees} currency="ج.م" integerClass="font-bold text-indigo-600 text-xs md:text-sm" currencyClass="text-[8px] md:text-[10px] font-bold" className="justify-start" /></TableCell>
                                    <TableCell className="text-center font-bold text-slate-400 text-xs md:text-sm">{s.monthlyCount}</TableCell>
                                    {s.details.map((count, i) => <TableCell key={i} className="text-center font-bold text-slate-400 text-xs md:sm">{count}</TableCell>)}
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
