"use server";

import { generateDataInsights, type GenerateDataInsightsOutput } from "@/ai/flows/generate-data-insights-flow";
import { mockData } from "@/lib/mock-data";

export async function generateInsightsAction(): Promise<{
  data: GenerateDataInsightsOutput | null;
  error: string | null;
}> {
  try {
    const dataString = JSON.stringify(mockData, null, 2);
    const result = await generateDataInsights({ data: dataString });
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { data: null, error: `فشل إنشاء التقرير: ${errorMessage}` };
  }
}
