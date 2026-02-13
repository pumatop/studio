
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
  UserCog,
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
import { mockUsers } from "@/lib/mock-users";
import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";
import { mockEgyptianTransfers } from "@/lib/mock-egyptian-transfers";
import type { EgyptianTransfer } from "@/lib/types";
import { mockSupervisors } from "@/lib/mock-supervisors";

const EGYPTIAN_TRANSFER_TYPES: EgyptianTransfer['transferType'][] = ['محفظة كاش', 'انستاباي', 'وصلني البيت'];

export default function DashboardPage() {
  // --- DATE SETUP ---
  const mostRecentLibyanTimestamp =
    mockLibyanTransactions.length > 0
      ? Math.max(
          ...mockLibyanTransactions.map((t) => new Date(t.timestamp).getTime())
        )
      : 0;

  const mostRecentEgyptianTimestamp =
    mockEgyptianTransfers.length > 0
      ? Math.max(
          ...mockEgyptianTransfers.map((t) =>
            new Date(t.requestTimestamp).getTime()
          )
        )
      : 0;

  const mostRecentTimestamp =
    Math.max(mostRecentLibyanTimestamp, mostRecentEgyptianTimestamp) ||
    new Date().getTime();

  const todayDate = new Date(mostRecentTimestamp);
  const startOfToday = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  );
  const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const monthName = todayDate.toLocaleString("ar-EG-u-nu-latn", { month: 'numeric' });

  // --- ORIGINAL CARDS' CALCULATIONS ---
  const totalLibyanBalance = mockUsers.reduce(
    (sum, user) => sum + user.balanceLibyan,
    0
  );

  const totalEgyptianBalance = mockUsers.reduce(
    (sum, user) => sum + user.balanceEgyptian,
    0
  );

  const lydToEgpTransactions = mockLibyanTransactions.filter(
    (t) => t.operationType === "تحويل للجنيه" && t.status === "ناجحة"
  );

  const dailyTrades = lydToEgpTransactions.filter((t) => {
    const transactionDate = new Date(t.timestamp);
    return transactionDate >= startOfToday;
  });

  const monthlyTrades = lydToEgpTransactions.filter((t) => {
    const transactionDate = new Date(t.timestamp);
    return transactionDate >= startOfMonth;
  });

  const dailyTradeStats = {
    count: dailyTrades.length,
    lydAmount: dailyTrades.reduce((sum, t) => sum + t.sentAmount, 0),
    egpAmount: dailyTrades.reduce((sum, t) => sum + (t.convertedAmountEGP || 0), 0),
  };

  const monthlyTradeStats = {
    count: monthlyTrades.length,
    lydAmount: monthlyTrades.reduce((sum, t) => sum + t.sentAmount, 0),
    egpAmount: monthlyTrades.reduce(
      (sum, t) => sum + (t.convertedAmountEGP || 0),
      0
    ),
  };
  
  // --- NEW CARDS' CALCULATIONS ---

  // 1. User Stats
  const totalUsers = mockUsers.length;
  const pendingVerificationUsers = mockUsers.filter(
    (u) => u.verificationStatus === "قيد المراجعة"
  ).length;

  // 2. Card Revenue
  const cardTransactions = mockLibyanTransactions.filter(
    (t) => t.operationType === "كرت شحن" && t.status === "ناجحة"
  );
  const dailyCards = cardTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
  const monthlyCards = cardTransactions.filter(t => new Date(t.timestamp) >= startOfMonth);
  const dailyCardStats = {
      count: dailyCards.length,
      revenue: dailyCards.reduce((sum, t) => sum + t.serviceFee, 0)
  };
  const monthlyCardStats = {
      count: monthlyCards.length,
      revenue: monthlyCards.reduce((sum, t) => sum + t.serviceFee, 0)
  };

  // 3. Internal Transfer Revenue
  const internalTransactions = mockLibyanTransactions.filter(
      (t) => t.operationType === "تحويل داخلي" && t.status === "ناجحة"
  );
  const dailyInternal = internalTransactions.filter(t => new Date(t.timestamp) >= startOfToday);
  const monthlyInternal = internalTransactions.filter(t => new Date(t.timestamp) >= startOfMonth);
  const dailyInternalStats = {
      count: dailyInternal.length,
      revenue: dailyInternal.reduce((sum, t) => sum + t.serviceFee, 0)
  };
  const monthlyInternalStats = {
      count: monthlyInternal.length,
      revenue: monthlyInternal.reduce((sum, t) => sum + t.serviceFee, 0)
  };

  // 4. Fakka Safe
  const fakkaBalance = lydToEgpTransactions.reduce((sum, t) => {
    const preciseAmount = t.sentAmount * (t.exchangeRate || 0);
    const fraction = preciseAmount - (t.convertedAmountEGP || 0);
    return sum + fraction;
  }, 0);

  const dailyEgyptianTransfers = mockEgyptianTransfers.filter(t => new Date(t.requestTimestamp) >= startOfToday);
  const monthlyEgyptianTransfers = mockEgyptianTransfers.filter(t => new Date(t.requestTimestamp) >= startOfMonth);
  
  // 5. Egyptian Transfers Summary
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


  // 6. Egyptian Transfers Revenue
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
  
  // Supervisor Performance Stats
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

    return {
      ...supervisor,
      dailyTotalAmount,
      monthlyTotalAmount,
      monthlyTotalCount,
      monthlyStatsByType,
    };
  });


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
            <div className="text-3xl font-bold text-left">
              {totalLibyanBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })} <span className="text-base font-medium">د.ل</span>
            </div>
            <p className="text-xs text-muted-foreground">
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
                <p className="flex justify-between">
                  <span>العمليات:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {dailyTradeStats.count}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>المبلغ بالدينار:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    {dailyTradeStats.lydAmount.toLocaleString("en-US")} <span className="text-xs">د.ل</span>
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>المبلغ بالجنيه:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    {dailyTradeStats.egpAmount.toLocaleString("en-US")} <span className="text-xs">ج.م</span>
                  </span>
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="flex justify-between">
                  <span>العمليات:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {monthlyTradeStats.count}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>المبلغ بالدينار:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    {monthlyTradeStats.lydAmount.toLocaleString("en-US")} <span className="text-xs">د.ل</span>
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>المبلغ بالجنيه:</span>{" "}
                  <span className="font-semibold text-foreground text-left">
                    {monthlyTradeStats.egpAmount.toLocaleString("en-US")} <span className="text-xs">ج.م</span>
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
            <div className="text-3xl font-bold text-left">
              {totalEgyptianBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })} <span className="text-base font-medium">ج.م</span>
            </div>
            <p className="text-xs text-muted-foreground">
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
            <div className="flex items-center justify-between">
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
                        <p className="flex justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{dailyCardStats.count}</span></p>
                        <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left">{dailyCardStats.revenue.toLocaleString("en-US")} <span className="text-xs">د.ل</span></span></p>
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex justify-between"><span>عدد الكروت:</span> <span className="font-semibold text-foreground">{monthlyCardStats.count}</span></p>
                        <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left">{monthlyCardStats.revenue.toLocaleString("en-US")} <span className="text-xs">د.ل</span></span></p>
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
                        <p className="flex justify-between"><span>عدد المعاملات:</span> <span className="font-semibold text-foreground">{dailyInternalStats.count}</span></p>
                        <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left">{dailyInternalStats.revenue.toLocaleString("en-US")} <span className="text-xs">د.ل</span></span></p>
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex justify-between"><span>عدد المعاملات:</span> <span className="font-semibold text-foreground">{monthlyInternalStats.count}</span></p>
                        <p className="flex justify-between"><span>قيمة الرسوم:</span> <span className="font-semibold text-foreground text-left">{monthlyInternalStats.revenue.toLocaleString("en-US")} <span className="text-xs">د.ل</span></span></p>
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
                <div className="text-2xl font-bold text-left">
                  {fakkaBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 4,
                  })} <span className="text-base font-medium">ج.م</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  مجموع كسور التحويلات من الدينار للجنيه
                </p>
              </CardContent>
            </Card>

            {/* New Card 6: Egyptian Transfers Revenue */}
            <Card>
                <CardHeader>
                    <CardTitle>إيرادات التحويلات المصرية</CardTitle>
                    <CardDescription>إجمالي رسوم التحويلات الناجحة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold text-left">{totalRevenueEGP.toLocaleString("en-US")} <span className="text-base font-medium">ج.م</span></p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">اليوم</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(dailyRevenueByType).map(([type, stats]) => (
                                <div key={type} className="flex justify-between items-center">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-16 justify-center">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.revenue.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
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
                                <div key={type} className="flex justify-between items-center">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-16 justify-center">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.revenue.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>


        {/* New Card 5: Egyptian Transfers Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity /> ملخص اليوم</CardTitle>
                    <CardDescription>
                    حوالات الجنيه المصري اليوم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                    <p className="text-xs text-muted-foreground">الإجمالي (ناجح + معلق)</p>
                    <p className="text-2xl font-bold text-left">
                        {dailyTotalActiveTransfersEGP.toLocaleString("en-US")} <span className="text-base font-medium">ج.م</span>
                    </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(dailySuccessfulStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex justify-between items-center">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="w-16 justify-center">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.amount.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
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
                                <div key={type} className="flex justify-between items-center text-yellow-600 dark:text-yellow-400">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="w-16 justify-center border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.amount.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
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
                    <CardTitle className="flex items-center gap-2"><Activity /> ملخص الشهر</CardTitle>
                    <CardDescription>
                    حوالات الجنيه المصري هذا الشهر.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                    <p className="text-xs text-muted-foreground">الإجمالي (ناجح + معلق)</p>
                    <p className="text-2xl font-bold text-left">
                        {monthlyTotalActiveTransfersEGP.toLocaleString("en-US")} <span className="text-base font-medium">ج.م</span>
                    </p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="text-sm font-semibold mb-2">الحوالات الناجحة</h4>
                        <div className="space-y-2 text-xs">
                            {Object.entries(monthlySuccessfulStatsByType).map(([type, stats]) => (
                                <div key={type} className="flex justify-between items-center">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="w-16 justify-center">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.amount.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
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
                                <div key={type} className="flex justify-between items-center text-yellow-600 dark:text-yellow-400">
                                    <span>{type}</span>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="w-16 justify-center border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10">{stats.count} حوالة</Badge>
                                        <span className="font-semibold w-24 text-left">{stats.amount.toLocaleString("en-US")} <span className="text-xs">ج.م</span></span>
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
          <CardTitle>ملخص أداء المندوبين لشهر {monthName}</CardTitle>
          <CardDescription>
            ملخص أداء المندوبين اليومي والشهري مع تفصيل أنواع الحوالات الناجحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell className="text-left font-mono text-lg font-bold">{supervisor.dailyTotalAmount.toLocaleString("en-US")} ج.م</TableCell>
                    <TableCell className="text-left font-mono text-lg font-bold">{supervisor.monthlyTotalAmount.toLocaleString("en-US")} ج.م</TableCell>
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
