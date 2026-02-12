import type { ExchangeRateLog } from "@/lib/types";

export const mockExchangeRateLogs: ExchangeRateLog[] = [
  {
    id: "log_001",
    date: "2024-05-20T10:00:00Z",
    modifiedBy: "أحمد خالد",
    oldRate: 9.6,
    newRate: 9.65,
  },
  {
    id: "log_002",
    date: "2024-05-19T15:30:00Z",
    modifiedBy: "النظام (تلقائي)",
    oldRate: 9.58,
    newRate: 9.6,
  },
  {
    id: "log_003",
    date: "2024-05-18T09:00:00Z",
    modifiedBy: "أحمد خالد",
    oldRate: 9.55,
    newRate: 9.58,
  },
  {
    id: "log_004",
    date: "2024-05-17T11:20:00Z",
    modifiedBy: "سارة إبراهيم",
    oldRate: 9.5,
    newRate: 9.55,
  },
  {
    id: "log_005",
    date: "2024-05-16T18:00:00Z",
    modifiedBy: "النظام (تلقائي)",
    oldRate: 9.51,
    newRate: 9.5,
  },
];
