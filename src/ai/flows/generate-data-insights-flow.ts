'use server';
/**
 * @fileOverview An AI agent that generates insights, trends, performance metrics, and recommendations from data.
 *
 * - generateDataInsights - A function that handles the data insights generation process.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateDataInsightsInputSchema,
    GenerateDataInsightsOutputSchema,
    type GenerateDataInsightsInput,
    type GenerateDataInsightsOutput,
} from './generate-data-insights-schemas';

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
