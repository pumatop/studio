'use server';
/**
 * @fileOverview An AI agent that generates insights, trends, performance metrics, and recommendations from data.
 *
 * - generateDataInsights - A function that handles the data insights generation process.
 * - GenerateDataInsightsInput - The input type for the generateDataInsights function.
 * - GenerateDataInsightsOutput - The return type for the generateDataInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDataInsightsInputSchema = z.object({
  data: z
    .string()
    .describe(
      "بيانات 'حولّي كاش' المقدمة كسلسلة نصية مهيكلة (مثل JSON، CSV، أو ملخص مفصل باللغة الطبيعية) للتحليل."
    ),
});
export type GenerateDataInsightsInput = z.infer<
  typeof GenerateDataInsightsInputSchema
>;

const GenerateDataInsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe('ملخص موجز للنتائج الرئيسية من البيانات.'),
  trends: z
    .array(z.string())
    .describe('الاتجاهات والأنماط الرئيسية المحددة في البيانات.'),
  performanceMetrics: z
    .record(z.any())
    .describe(
      'مؤشرات الأداء الرئيسية (KPIs) المستخرجة من البيانات، ممثلة ككائن JSON.'
    ),
  recommendations: z
    .array(z.string())
    .describe('توصيات قابلة للتنفيذ بناءً على رؤى البيانات.'),
});
export type GenerateDataInsightsOutput = z.infer<
  typeof GenerateDataInsightsOutputSchema
>;

export async function generateDataInsights(
  input: GenerateDataInsightsInput
): Promise<GenerateDataInsightsOutput> {
  return generateDataInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataInsightsPrompt',
  input: {schema: GenerateDataInsightsInputSchema},
  output: {schema: GenerateDataInsightsOutputSchema},
  prompt: `أنت محلل بيانات خبير متخصص في بيانات 'حولّي كاش'.
مهمتك هي تحليل البيانات المقدمة واستخلاص الرؤى الرئيسية وتحديد الاتجاهات وقياس مقاييس الأداء وتقديم توصيات قابلة للتنفيذ.

بيانات للتحليل:
{{{data}}}

بناءً على البيانات المقدمة، قم بإنشاء تحليل شامل يتضمن:
1. ملخص موجز لأهم النتائج.
2. الاتجاهات والأنماط الرئيسية المحددة.
3. مقاييس الأداء الهامة (مؤشرات الأداء الرئيسية) بتنسيق كائن JSON.
4. توصيات قابلة للتنفيذ لتحسين الأداء أو معالجة المشكلات المحددة.`,
});

const generateDataInsightsFlow = ai.defineFlow(
  {
    name: 'generateDataInsightsFlow',
    inputSchema: GenerateDataInsightsInputSchema,
    outputSchema: GenerateDataInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
