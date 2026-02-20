"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateInsightsAction } from "./actions";
import type { GenerateDataInsightsOutput } from "@/ai/flows/generate-data-insights-flow";
import { 
    BrainCircuit, Lightbulb, ListChecks, TrendingUp, AlertTriangle, Users as UsersIcon, 
    BarChart3, PieChartIcon, Coins, ArrowUp, ArrowDown, ArrowRight 
} from "lucide-react";
import { useRtdbList } from "@/firebase";
import type { Transaction, User, Supervisor } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Pie, PieChart, Cell, Legend, LabelList } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="space-y-2"><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="space-y-2"><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent className="space-y-2"><Skeleton className="h-40 w-full" /></CardContent>
            </Card>
        </div>
    )
}

const SimplePieChart = ({ data, title }: { data: { name: string, value: number }[], title: string }) => {
    const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return (
        <div>
            <h4 className="text-center text-sm font-medium text-muted-foreground">{title}</h4>
            <ChartContainer config={{}} className="h-[200px] w-full">
                <PieChart>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                            <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-muted-foreground">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ChartContainer>
        </div>
    );
};

const SimpleBarChart = ({ data, title }: { data: { name: string, value: number }[], title: string }) => (
    <div>
        <h4 className="text-center text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <ChartContainer config={{}} className="h-[200px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 10)}
                    className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4}>
                    <LabelList dataKey="value" position="top" offset={5} className="fill-foreground" fontSize={12} />
                </Bar>
            </BarChart>
        </ChartContainer>
    </div>
);

const priorityClasses: Record<string, { badge: string, icon: React.ReactNode }> = {
    High: { badge: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", icon: <ArrowUp className="h-4 w-4 text-red-500" /> },
    Medium: { badge: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20", icon: <ArrowRight className="h-4 w-4 text-yellow-500" /> },
    Low: { badge: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20", icon: <ArrowDown className="h-4 w-4 text-green-500" /> }
}

export default function AiReporter() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateDataInsightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>('/transactions');
  const { data: users, isLoading: usersLoading } = useRtdbList<User>('/users');
  const { data: supervisors, isLoading: supervisorsLoading } = useRtdbList<Supervisor>('/supervisors');

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const { data, error } = await generateInsightsAction(users, transactions, supervisors);
    if (error) {
      setError(error);
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  const isDataLoading = transactionsLoading || usersLoading || supervisorsLoading;

  return (
    <div className="container mx-auto py-4">
      <Card className="mb-6 bg-card/50 dark:bg-card/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BrainCircuit className="text-primary h-8 w-8" />
            <span>مولد التقارير الذكية</span>
          </CardTitle>
          <CardDescription>
            اضغط على الزر أدناه لتحليل بيانات 'حولّي كاش' (المستخدمين، المعاملات، والمشرفين) وتوليد تقارير شاملة، رسوم بيانية، وتوصيات قابلة للتنفيذ باستخدام الذكاء الاصطناعي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={loading || isDataLoading} size="lg">
            {loading ? "جاري التحليل..." : isDataLoading ? "جاري تحميل البيانات..." : "توليد تقرير شامل"}
          </Button>
        </CardContent>
      </Card>
      
      {loading && <LoadingSkeleton />}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb /> ملخص تنفيذي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{result.executiveSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UsersIcon /> {result.userAnalysis.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">{result.userAnalysis.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SimplePieChart data={result.userAnalysis.userRolesChart} title="توزيع المستخدمين حسب الدور" />
                    <SimplePieChart data={result.userAnalysis.userVerificationChart} title="توزيع المستخدمين حسب التوثيق" />
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> {result.transactionAnalysis.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">{result.transactionAnalysis.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SimpleBarChart data={result.transactionAnalysis.transactionVolumeChart} title="حجم المعاملات (آخر 7 أيام)" />
                    <SimpleBarChart data={result.transactionAnalysis.transactionTypesChart} title="توزيع أنواع المعاملات" />
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Coins /> {result.financialAnalysis.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">{result.financialAnalysis.summary}</p>
                <SimpleBarChart data={result.financialAnalysis.revenueStreamsChart} title="مصادر الإيرادات المقدرة" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks /> توصيات استراتيجية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="border-r-4 rounded-r-md p-4 bg-muted/40" style={{borderColor: `hsl(var(--${rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'primary' : 'chart-2'}))`}}>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                            {priorityClasses[rec.priority]?.icon || null}
                            {rec.title}
                        </h4>
                        <Badge variant="outline" className={cn("font-semibold", priorityClasses[rec.priority]?.badge)}>{rec.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pr-6">{rec.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
