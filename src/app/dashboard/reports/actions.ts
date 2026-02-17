"use server";

import { generateDataInsights, type GenerateDataInsightsOutput } from "@/ai/flows/generate-data-insights-flow";

export async function generateInsightsAction(allTransactions: any): Promise<{
  data: GenerateDataInsightsOutput | null;
  error: string | null;
}> {
  try {
    if (!allTransactions || Object.keys(allTransactions).length === 0) {
      return { data: null, error: "لا توجد بيانات كافية لإنشاء تقرير. يرجى إضافة بعض المعاملات أولاً." };
    }
    
    const dataString = JSON.stringify(allTransactions, null, 2);
    const result = await generateDataInsights({ data: dataString });
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { data: null, error: `فشل إنشاء التقرير: ${errorMessage}` };
  }
}
