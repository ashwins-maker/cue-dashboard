import { ConnectionBanner } from "@/components/app/connection-banner";
import { OverviewView } from "@/components/app/overview-view";
import { loadDashboardData } from "@/lib/dashboard-data";

export default async function OverviewPage() {
  const data = await loadDashboardData();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <ConnectionBanner live={data.live} />
      <OverviewView points={data.frictionPoints} />
    </div>
  );
}
