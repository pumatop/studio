import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ArrowRightLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { mockUsers } from "@/lib/mock-users";
import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";

export default function DashboardPage() {
  const totalLibyanBalance = mockUsers.reduce(
    (sum, user) => sum + user.balanceLibyan,
    0
  );

  const totalEgyptianBalance = mockUsers.reduce(
    (sum, user) => sum + user.balanceEgyptian,
    0
  );
  
  const mostRecentTimestamp = mockLibyanTransactions.length > 0 
    ? Math.max(...mockLibyanTransactions.map(t => new Date(t.timestamp).getTime()))
    : new Date().getTime();
  
  const todayDate = new Date(mostRecentTimestamp);
  const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);

  const lydToEgpTransactions = mockLibyanTransactions.filter(
    (t) => t.operationType === "تحويل للجنيه" && t.status === 'ناجحة'
  );

  const dailyTrades = lydToEgpTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= startOfToday;
  });

  const monthlyTrades = lydToEgpTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return transactionDate >= startOfMonth;
  });

  const dailyTradeStats = {
      count: dailyTrades.length,
      lydAmount: dailyTrades.reduce((sum, t) => sum + t.sentAmount, 0),
      egpAmount: dailyTrades.reduce((sum, t) => sum + (t.convertedAmountEGP || 0), 0)
  };

  const monthlyTradeStats = {
      count: monthlyTrades.length,
      lydAmount: monthlyTrades.reduce((sum, t) => sum + t.sentAmount, 0),
      egpAmount: monthlyTrades.reduce((sum, t) => sum + (t.convertedAmountEGP || 0), 0)
  };


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
            <div className="text-3xl font-bold">
              {`د.ل ${totalLibyanBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
                      <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{dailyTradeStats.count}</span></p>
                      <p className="flex justify-between"><span>المبلغ بالدينار:</span> <span className="font-semibold text-foreground">د.ل {dailyTradeStats.lydAmount.toLocaleString("en-US")}</span></p>
                      <p className="flex justify-between"><span>المبلغ بالجنيه:</span> <span className="font-semibold text-foreground">ج.م {dailyTradeStats.egpAmount.toLocaleString("en-US")}</span></p>
                  </div>
              </div>
              <Separator />
              <div>
                  <h4 className="text-sm font-semibold mb-1">هذا الشهر</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex justify-between"><span>العمليات:</span> <span className="font-semibold text-foreground">{monthlyTradeStats.count}</span></p>
                      <p className="flex justify-between"><span>المبلغ بالدينار:</span> <span className="font-semibold text-foreground">د.ل {monthlyTradeStats.lydAmount.toLocaleString("en-US")}</span></p>
                      <p className="flex justify-between"><span>المبلغ بالجنيه:</span> <span className="font-semibold text-foreground">ج.م {monthlyTradeStats.egpAmount.toLocaleString("en-US")}</span></p>
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
            <div className="text-3xl font-bold">
                {`ج.م ${totalEgyptianBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground">
              إجمالي الأرصدة المتاحة بالجنيه المصري
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
