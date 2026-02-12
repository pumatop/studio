import type { ExchangeRate } from "@/lib/types";

export const mockExchangeRates: ExchangeRate[] = [
  {
    id: "rate_001",
    currencyPair: "USD/LYD",
    rate: 4.85,
    lastUpdated: "2024-05-20T10:00:00Z",
  },
  {
    id: "rate_002",
    currencyPair: "EUR/LYD",
    rate: 5.25,
    lastUpdated: "2024-05-20T10:00:00Z",
  },
  {
    id: "rate_003",
    currencyPair: "USD/EGP",
    rate: 46.80,
    lastUpdated: "2024-05-20T10:00:00Z",
  },
  {
    id: "rate_004",
    currencyPair: "EUR/EGP",
    rate: 50.95,
    lastUpdated: "2024-05-20T10:00:00Z",
  },
    {
    id: "rate_005",
    currencyPair: "LYD/EGP",
    rate: 9.65,
    lastUpdated: "2024-05-20T10:00:00Z",
  },
];
