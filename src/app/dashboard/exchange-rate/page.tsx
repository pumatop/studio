import { mockExchangeRates } from "@/lib/mock-exchange-rate";
import { ExchangeRateDataTable } from "./data-table";

export default function ExchangeRatePage() {
  return (
    <div>
      <ExchangeRateDataTable initialData={mockExchangeRates} />
    </div>
  );
}
