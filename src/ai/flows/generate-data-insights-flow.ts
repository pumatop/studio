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
      "The 'cashaat databese' data provided as a structured string (e.g., JSON, CSV, or a detailed natural language summary) for analysis."
    ),
});
export type GenerateDataInsightsInput = z.infer<
  typeof GenerateDataInsightsInputSchema
>;

const GenerateDataInsightsOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key findings from the data.'),
  trends: z
    .array(z.string())
    .describe('Identified key trends and patterns in the data.'),
  performanceMetrics: z
    .record(z.any())
    .describe(
      'Key performance indicators (KPIs) extracted from the data, represented as a JSON object.'
    ),
  recommendations: z
    .array(z.string())
    .describe('Actionable recommendations based on the data insights.'),
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
  prompt: `You are an expert data analyst specializing in 'cashaat databese' data.
Your task is to analyze the provided data and extract key insights, identify trends, quantify performance metrics, and provide actionable recommendations.

Data for analysis:
{{{data}}}

Based on the data provided, generate a comprehensive analysis including:
1. A concise summary of the most important findings.
2. Identified key trends and patterns.
3. Important performance metrics (Key Performance Indicators) in a JSON object format.
4. Actionable recommendations to improve performance or address identified issues.`,
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
