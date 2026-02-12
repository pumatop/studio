import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingCart, Activity, Star } from "lucide-react";
import { mockLibyanTransactions } from "@/lib/mock-libyan-transactions";
import { mockEgyptianTransactions } from "@/lib/mock-egyptian-transactions";
import { SalesChart, CategoryChart } from "@/components/charts";

export default function DashboardPage() {
  const allTransactions = [...mockLibyanTransactions, ...mockEgyptianTransactions];
  
  const libyanRevenue = mockLibyanTransactions.reduce((sum, item) => sum + item.amount, 0);
  const egyptianRevenue = mockEgyptianTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = allTransactions.length;

  const getTopProduct = () => {
    if (allTransactions.length === 0) return 'N/A';
    const productCounts: { [key: string]: number } = {};
    allTransactions.forEach((item) => {
      productCounts[item.product] = (productCounts[item.product] || 0) + 1;
    });
    return Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }
  const topProduct = getTopProduct();

  const stats = [
    {
      title: "إيرادات ليبيا",
      value: `LYD ${libyanRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "إيرادات مصر",
      value: `EGP ${egyptianRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "إجمالي المعاملات",
      value: totalTransactions.toString(),
      icon: ShoppingCart,
    },
    {
      title: "أفضل منتج مبيعاً",
      value: topProduct,
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={mockLibyanTransactions} title="إيرادات ليبيا على مدار الوقت" currency="LYD" />
        <SalesChart data={mockEgyptianTransactions} title="إيرادات مصر على مدار الوقت" currency="EGP" />
      </div>
       <div className="grid gap-4 md:grid-cols-1">
        <CategoryChart data={allTransactions} title="المعاملات حسب الفئة (الكل)" />
      </div>
    </div>
  );
}
