import { ExchangeControlCard } from "./exchange-control-card";
import { ExchangeRateChartCard } from "./exchange-rate-chart-card";
import { ChangeLogCard } from "./change-log-card";

export default function ExchangeRatePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="lg:col-span-1">
        <ExchangeControlCard />
      </div>
      <div className="lg:col-span-1 space-y-6">
        <ExchangeRateChartCard />
        <ChangeLogCard />
      </div>
    </div>
  );
}
