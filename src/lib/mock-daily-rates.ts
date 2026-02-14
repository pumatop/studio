import type { DailyRate } from "@/lib/types";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Mock data for the last 7 days for LYD/EGP
export const mockDailyRates: DailyRate[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() - (6 - i));
  let rate;
  switch (i) {
    case 0: rate = 9.50; break;
    case 1: rate = 9.55; break;
    case 2: rate = 9.52; break;
    case 3: rate = 9.60; break;
    case 4: rate = 9.62; break;
    case 5: rate = 9.60; break;
    case 6: rate = 9.65; break;
    default: rate = 9.50;
  }
  return {
    date: date.toISOString().split('T')[0],
    rate: rate,
  };
});
