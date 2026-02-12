import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Activity } from "lucide-react";
import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";
import { mockEgyptianTransactions } from "@/lib/mock-egyptian-transactions";
import { mockUsers } from "@/lib/mock-users";
import { SalesChart, CategoryChart } from "@/components/charts";

export default function DashboardPage() {
  const allTransactions = [...mockLibyanTransactions, ...mockEgyptianTransactions];
  
  const libyanRevenue = mockLibyanTransactions.reduce((sum, item) => sum + item.amount, 0);
  const egyptianRevenue = mockEgyptianTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = allTransactions.length;
  const totalUsers = mockUsers.length;

  const stats = [
    {
      title: "إجمالي المستخدمين",
      value: totalUsers.toLocaleString(),
      icon: Users,
      percentage: "+8.5% عن الأمس",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: "up"
    },
    {
      title: "إجمالي الطلبات",
      value: totalTransactions.toLocaleString(),
      icon: ShoppingCart,
      percentage: "+1.3% عن الأسبوع الماضي",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      trend: "up"
    },
    {
      title: "إيرادات ليبيا",
      value: `د.ل ${libyanRevenue.toLocaleString()}`,
      icon: DollarSign,
      percentage: "+5.2% عن الشهر الماضي",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: "up"
    },
    {
      title: "إيرادات مصر",
      value: `ج.م ${egyptianRevenue.toLocaleString()}`,
      icon: DollarSign,
      percentage: "-1.8% عن الأمس",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      trend: "down"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stat.percentage}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SalesChart data={mockLibyanTransactions} title="تفاصيل المبيعات (ليبيا)" currency="د.ل" />
        </div>
        <div className="lg:col-span-2">
           <CategoryChart data={allTransactions} title="المعاملات حسب الفئة" />
        </div>
      </div>
       <div className="grid gap-4 md:grid-cols-1">
        <SalesChart data={mockEgyptianTransactions} title="تفاصيل المبيعات (مصر)" currency="ج.م" />
      </div>
    </div>
  );
}
