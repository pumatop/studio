"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateInsightsAction } from "./actions";
import type { GenerateDataInsightsOutput } from "@/ai/flows/generate-data-insights-flow";
import { BrainCircuit, Lightbulb, ListChecks, TrendingUp, AlertTriangle } from "lucide-react";
import { useRtdbList } from "@/firebase/rtdb/use-rtdb-list";
import type { Transaction } from "@/lib/types";

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function AiReporter() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateDataInsightsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: transactions, isLoading: transactionsLoading } = useRtdbList<Transaction>('/transactions');

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const { data, error } = await generateInsightsAction(transactions);
    if (error) {
      setError(error);
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="text-primary" />
            <span>مولد التقارير الذكية</span>
          </CardTitle>
          <CardDescription>
            انقر على الزر أدناه لتحليل بيانات 'حولّي كاش' الخاصة بك وتوليد ملخصات، اتجاهات، وتوصيات قابلة للتنفيذ باستخدام الذكاء الاصطناعي.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={loading || transactionsLoading}>
            {loading ? "جاري التحليل..." : transactionsLoading ? "جاري تحميل البيانات..." : "توليد تقرير AI"}
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb /> ملخص تنفيذي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> الاتجاهات الرئيسية</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {result.trends.map((trend, i) => <li key={i}>{trend}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> توصيات</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(result.performanceMetrics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
