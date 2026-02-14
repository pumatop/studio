import type { ExchangeRateLog } from "@/lib/types";
const now = new Date();

export const mockExchangeRateLogs: ExchangeRateLog[] = [
  {
    id: "log_1",
    date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    modifiedBy: "مشرف النظام",
    oldRate: 9.45,
    newRate: 9.50,
  },
  {
    id: "log_2",
    date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    modifiedBy: "مشرف النظام",
    oldRate: 9.50,
    newRate: 9.55,
  },
  {
    id: "log_3",
    date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    modifiedBy: "مندوب 1",
    oldRate: 9.55,
    newRate: 9.52,
  },
    {
    id: "log_4",
    date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    modifiedBy: "مشرف النظام",
    oldRate: 9.52,
    newRate: 9.60,
  },
    {
    id: "log_5",
    date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    modifiedBy: "مندوب 1",
    oldRate: 9.60,
    newRate: 9.62,
  },
    {
    id: "log_6",
    date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    modifiedBy: "مشرف النظام",
    oldRate: 9.62,
    newRate: 9.60,
  },
    {
    id: "log_7",
    date: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    modifiedBy: "مشرف النظام",
    oldRate: 9.60,
    newRate: 9.65,
  },
];
