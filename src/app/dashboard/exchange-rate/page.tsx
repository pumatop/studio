import { ExchangeControlCard } from "./exchange-control-card";
import { ExchangeRateChartCard } from "./exchange-rate-chart-card";
import { ChangeLogCard } from "./change-log-card";

export default function ExchangeRatePage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1">
        <ExchangeControlCard />
      </div>
      <div className="xl:col-span-2">
        <ExchangeRateChartCard />
      </div>
      <div className="xl:col-span-3">
        <ChangeLogCard />
      </div>
    </div>
  );
}
