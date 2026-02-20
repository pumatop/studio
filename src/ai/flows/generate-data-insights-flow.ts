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

export async function generateDataInsights(
  input: GenerateDataInsightsInput
): Promise<GenerateDataInsightsOutput> {
  return generateDataInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataInsightsPrompt',
  input: {schema: GenerateDataInsightsInputSchema},
  output: {schema: GenerateDataInsightsOutputSchema},
  prompt: `أنت خبير تحليل بيانات استراتيجي متخصص في تحليل بيانات تطبيقات التحويلات المالية مثل 'حولّي كاش'. مهمتك هي تحويل البيانات الرقمية الخام إلى تقرير استراتيجي شامل ومفهوم، مع تصورات بيانية وتوصيات قابلة للتنفيذ.

استخدم البيانات المهيكلة التالية لإنشاء التقرير:

### ملخص البيانات العام
- إجمالي المستخدمين: {{summary.totalUsers}}
- إجمالي المشرفين: {{summary.totalSupervisors}}
- إجمالي المعاملات: {{summary.totalTransactions}}
- إجمالي حجم تحويلات (دينار لجنيه): {{summary.totalLydToEgpVolume}} د.ل
- إجمالي حجم التحويلات الداخلية: {{summary.totalInternalTransferVolume}} د.ل

### توزيعات البيانات
- توزيع المستخدمين حسب الدور: {{{JSON.stringify usersByRole}}}
- توزيع المستخدمين حسب حالة التوثيق: {{{JSON.stringify usersByVerification}}}
- توزيع المعاملات حسب النوع: {{{JSON.stringify transactionsByType}}}

### عينة من آخر 10 معاملات
{{{JSON.stringify recentTransactions}}}


**مهمتك:**
قم بإنشاء تقرير مفصل بناءً على البيانات أعلاه، مع الالتزام الصارم بتنسيق الإخراج المحدد (Output Schema). يجب أن يكون التقرير باللغة العربية.

**تعليمات لكل قسم في الإخراج:**

1.  **\`reportTitle\`**: عنوان عام جذاب للتقرير.
2.  **\`executiveSummary\`**: اكتب ملخصًا تنفيذيًا (2-3 جمل) يبرز أهم النتائج والتوصيات الرئيسية من التقرير بأكمله.
3.  **\`userAnalysis\`**:
    *   **\`summary\`**: حلل بيانات المستخدمين. علّق على توزيع الأدوار (هل هناك عدد كبير من المسؤولين؟) وتوزيع حالات التوثيق (هل هناك عدد كبير من الحسابات المعلقة؟).
    *   **\`userRolesChart\`**: قم بإعداد البيانات لعرضها في رسم بياني دائري (Pie Chart). استخدم المفاتيح من \`usersByRole\` كـ \`name\` والقيم كـ \`value\`.
    *   **\`userVerificationChart\`**: قم بإعداد البيانات لعرضها في رسم بياني دائري. استخدم المفاتيح من \`usersByVerification\` كـ \`name\` والقيم كـ \`value\`.
4.  **\`transactionAnalysis\`**:
    *   **\`summary\`**: حلل بيانات المعاملات. علّق على الأنواع الأكثر شيوعًا للمعاملات. استنتج اتجاهات النشاط بناءً على عينة المعاملات الأخيرة (هل هناك نشاط حديث؟).
    *   **\`transactionVolumeChart\`**: بناءً على \`recentTransactions\`, قم بإنشاء بيانات لرسم بياني شريطي (Bar Chart) يوضح عدد المعاملات لكل يوم في الأيام القليلة الماضية. يجب أن يكون كل عنصر \`{ name: 'YYYY-MM-DD', value: count }\`.
    *   **\`transactionTypesChart\`**: قم بإعداد البيانات من \`transactionsByType\` لعرضها في رسم بياني شريطي.
5.  **\`financialAnalysis\`**:
    *   **\`summary\`**: حلل الجانب المالي. علق على أحجام التداول (هل هي مرتفعة؟ منخفضة؟). استنتج مصادر الإيرادات المحتملة (مثل رسوم التحويلات التي يمكن استنتاجها من الفروقات في الأرصدة في العينة).
    *   **\`revenueStreamsChart\`**: هذا يتطلب استنتاجًا. بناءً على أنواع المعاملات، قدّر مصادر الدخل. على سبيل المثال، \`egypt_transfer\` لها \`serviceFee\`. \`account_transfer\` لها \`fee\`. \`recharge_purchase\` لها رسوم ضمنية. قم بإنشاء بيانات لرسم بياني شريطي يوضح الإيرادات المقدرة من كل نوع. إذا لم تكن البيانات كافية، قدم تقديرًا أو اذكر ذلك.
6.  **\`recommendations\`**:
    *   بناءً على تحليلك الشامل، قدم 3-4 توصيات استراتيجية قابلة للتنفيذ.
    *   لكل توصية، قدم عنوانًا واضحًا، وشرحًا تفصيليًا للمشكلة أو الفرصة، وحدد أولوية (عالية، متوسطة، منخفضة). مثال: قد توصي بـ "حملة لتشجيع توثيق الحسابات" بأولوية عالية إذا كان عدد الحسابات المعلقة كبيرًا.

تأكد من أن جميع البيانات الموجهة للرسوم البيانية مهيأة بشكل صحيح في مصفوفة من الكائنات \`{ name: string, value: number }\`.`,
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
