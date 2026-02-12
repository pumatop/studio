import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ShoppingCart, Activity, Star } from "lucide-react";
import { mockData } from "@/lib/mock-data";
import { SalesChart, CategoryChart } from "@/components/charts";

export default function DashboardPage() {
  const totalRevenue = mockData.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = mockData.length;
  const averageSale = totalRevenue / totalTransactions;

  const getTopProduct = () => {
    const productCounts: { [key: string]: number } = {};
    mockData.forEach((item) => {
      productCounts[item.product] = (productCounts[item.product] || 0) + 1;
    });
    return Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }
  const topProduct = getTopProduct();

  const stats = [
    {
      title: "إجمالي الإيرادات",
      value: `د.إ ${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "إجمالي المعاملات",
      value: totalTransactions.toString(),
      icon: ShoppingCart,
    },
    {
      title: "متوسط قيمة البيع",
      value: `د.إ ${averageSale.toFixed(2)}`,
      icon: Activity,
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
        <SalesChart data={mockData} />
        <CategoryChart data={mockData} />
      </div>
    </div>
  );
}
