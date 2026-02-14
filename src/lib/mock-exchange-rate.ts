import type { ExchangeRate } from "@/lib/types";

export const mockExchangeRates: ExchangeRate[] = [
    {
        id: "rate_1",
        currencyPair: "LYD/EGP",
        rate: 9.65,
        lastUpdated: new Date().toISOString(),
    },
     {
        id: "rate_2",
        currencyPair: "USD/LYD",
        rate: 4.85,
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
      {
        id: "rate_3",
        currencyPair: "EUR/LYD",
        rate: 5.20,
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
