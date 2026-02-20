"use server";

import {
  generateDataInsights,
  type GenerateDataInsightsInput,
  type GenerateDataInsightsOutput,
} from "@/ai/flows/generate-data-insights-flow";
import type { User, Transaction, Supervisor, EgyptTransferTransaction, AccountTransferTransaction } from "@/lib/types";

export async function generateInsightsAction(
    users: User[] | null,
    transactions: Transaction[] | null,
    supervisors: Supervisor[] | null
): Promise<{
  data: GenerateDataInsightsOutput | null;
  error: string | null;
}> {
  try {
    if (!transactions || transactions.length === 0 || !users || users.length === 0) {
      return { data: null, error: "لا توجد بيانات كافية لإنشاء تقرير. يرجى إضافة بعض المعاملات والمستخدمين أولاً." };
    }

    // 1. Prepare Summary
    const lydToEgpTransactions = transactions.filter(
        (t): t is EgyptTransferTransaction => t.type === "egypt_transfer"
    );
    const internalTransactions = transactions.filter(
        (t): t is AccountTransferTransaction => t.type === "account_transfer"
    );

    const summary: GenerateDataInsightsInput['summary'] = {
        totalUsers: users.length,
        totalSupervisors: supervisors?.length ?? 0,
        totalTransactions: transactions.length,
        totalLydToEgpVolume: lydToEgpTransactions.reduce((acc, t) => acc + t.amountLYD, 0),
        totalInternalTransferVolume: internalTransactions.reduce((acc, t) => acc + t.amount, 0),
    };
    
    // 2. Prepare Distributions
    const transactionsByType = transactions.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const usersByRole = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const usersByVerification = users.reduce((acc, u) => {
        acc[u.verification] = (acc[u.verification] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    // 3. Prepare Recent Transactions
    const recentTransactions = [...transactions].sort((a,b) => b.timestamp - a.timestamp).slice(0, 10);
    
    // 4. Construct input for AI flow
    const flowInput: GenerateDataInsightsInput = {
        summary,
        transactionsByType,
        usersByRole,
        usersByVerification,
        recentTransactions,
    };

    const result = await generateDataInsights(flowInput);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { data: null, error: `فشل إنشاء التقرير: ${errorMessage}` };
  }
}
