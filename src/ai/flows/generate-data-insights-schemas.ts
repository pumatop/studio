import { z } from 'genkit';

const ChartDataItemSchema = z.object({
  name: z.string().describe("The label for the data point (e.g., a date, a category name)."),
  value: z.number().describe("The numerical value for the data point."),
});


export const GenerateDataInsightsInputSchema = z.object({
  summary: z.object({
    totalUsers: z.number(),
    totalSupervisors: z.number(),
    totalTransactions: z.number(),
    totalLydToEgpVolume: z.number(),
    totalInternalTransferVolume: z.number(),
  }),
  transactionsByType: z.record(z.number()).describe("Count of transactions for each type (e.g., egypt_transfer, account_transfer)"),
  usersByRole: z.record(z.number()).describe("Count of users for each role (e.g., user, admin, merchant)"),
  usersByVerification: z.record(z.number()).describe("Count of users for each verification status (e.g., verified, pending)"),
  recentTransactions: z.array(z.any()).describe("A sample of the 10 most recent transactions"),
});


export type GenerateDataInsightsInput = z.infer<
  typeof GenerateDataInsightsInputSchema
>;

export const GenerateDataInsightsOutputSchema = z.object({
  reportTitle: z.string().describe("A main title for the entire report, like 'تحليل شامل لبيانات حولّي كاش'."),
  executiveSummary: z
    .string()
    .describe(
      "ملخص تنفيذي شامل لاهم النقاط والرؤى الرئيسية في التقرير كله."
    ),
  userAnalysis: z.object({
    title: z.string().describe("Title for the user analysis section, e.g., 'تحليل المستخدمين'."),
    summary: z.string().describe("A textual summary of user data, including growth, roles, and verification trends."),
    userRolesChart: z.array(ChartDataItemSchema).describe("Data formatted for a pie chart showing user distribution by role."),
    userVerificationChart: z.array(ChartDataItemSchema).describe("Data formatted for a pie chart showing user distribution by verification status."),
  }),
  transactionAnalysis: z.object({
    title: z.string().describe("Title for the transaction analysis section, e.g., 'تحليل المعاملات'."),
    summary: z.string().describe("A textual summary of transaction data, including volume, types, and status trends."),
    transactionVolumeChart: z.array(ChartDataItemSchema).describe("Data for a bar chart showing transaction volume over the last 7 days."),
    transactionTypesChart: z.array(ChartDataItemSchema).describe("Data for a bar chart showing the distribution of transaction types."),
  }),
  financialAnalysis: z.object({
    title: z.string().describe("Title for the financial analysis section, e.g., 'التحليل المالي'."),
    summary: z.string().describe("A textual summary of financial data, covering revenue from fees, total balances, etc."),
    revenueStreamsChart: z.array(ChartDataItemSchema).describe("Data for a bar chart showing revenue from different sources (internal transfers, card purchases, Egyptian transfers)."),
  }),
  recommendations: z.array(
    z.object({
      title: z.string().describe("A short, catchy title for the recommendation."),
      description: z.string().describe("A detailed explanation of the recommendation and the reasoning behind it."),
      priority: z.enum(["High", "Medium", "Low"]).describe("The priority of the recommendation."),
    })
  ).describe("A list of actionable recommendations with titles, descriptions, and priorities."),
});


export type GenerateDataInsightsOutput = z.infer<
  typeof GenerateDataInsightsOutputSchema
>;
