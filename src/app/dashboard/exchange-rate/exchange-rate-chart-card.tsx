"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DailyRate } from "@/lib/types";

const chartConfig = {
  rate: {
    label: "السعر",
  },
} satisfies ChartConfig;

const colors = {
    increase: "hsl(142.1 76.2% 36.3%)", // green-600
    decrease: "hsl(0 72.2% 50.6%)",  // red-600
    equal: "hsl(215.4 9.3% 62.2%)",   // stone-500
    selected: "hsl(var(--primary))",
};

export function ExchangeRateChartCard({ 
    data, 
    onDateSelect,
    selectedDate 
}: { 
    data: DailyRate[],
    onDateSelect: (date: string) => void,
    selectedDate: string | null
}) {
    
  const getColorForRate = (index: number) => {
    if (selectedDate && new Date(data[index].date).toISOString().split('T')[0] === new Date(selectedDate).toISOString().split('T')[0]) {
      return colors.selected;
    }
    if (index === 0) {
      return colors.equal;
    }
    const currentRate = data[index].rate;
    const previousRate = data[index - 1].rate;
    if (currentRate > previousRate) {
      return colors.increase;
    }
    if (currentRate < previousRate) {
      return colors.decrease;
    }
    return colors.equal;
  };
  
  const handleBarClick = (payload: any) => {
    if(payload && payload.activePayload && payload.activePayload[0]) {
        const date = payload.activePayload[0].payload.date;
        onDateSelect(date);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>أسعار الصرف لآخر 7 أيام</CardTitle>
        <CardDescription>زوج العملات: LYD/EGP. اضغط على يوم لعرض تفاصيله.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            لا توجد بيانات كافية لعرض الرسم البياني.
          </div>
        ) : (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data}
            margin={{ top: 30, right: 20, left: -10, bottom: 0 }}
            accessibilityLayer
            onClick={handleBarClick}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("ar-EG-u-nu-latn", { weekday: "short" })
              }
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              orientation="right"
              type="number"
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickLine={false}
              axisLine={false}
              tickMargin={20}
              tickFormatter={(value) => value.toFixed(2)}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              cursor={{fill: 'hsl(var(--accent) / 0.5)'}}
              content={<ChartTooltipContent indicator="dot" formatter={(value, name, props) => {
                const { payload } = props;
                return (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{new Date(payload.date).toLocaleDateString("ar-EG-u-nu-latn", { year: 'numeric', month: '2-digit', day: '2-digit'})}</span>
                    <span className="font-bold">{`${chartConfig.rate.label}: ${value}`}</span>
                  </div>
                )
              }} />}
            />
            <Bar
                dataKey="rate"
                radius={[4, 4, 0, 0]}
                className="cursor-pointer"
            >
                {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorForRate(index)} />
                ))}
                <LabelList 
                    dataKey="rate" 
                    position="top" 
                    formatter={(value: number) => value.toFixed(2)} 
                    className="fill-foreground"
                    fontSize={12}
                />
            </Bar>
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
