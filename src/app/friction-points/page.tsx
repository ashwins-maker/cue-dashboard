import { ConnectionBanner } from "@/components/app/connection-banner";
import { FrictionPointsView } from "@/components/app/friction-points-view";
import { loadDashboardData } from "@/lib/dashboard-data";

export default async function FrictionPointsPage() {
  const data = await loadDashboardData();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <ConnectionBanner live={data.live} />
      <FrictionPointsView points={data.frictionPoints} />
    </div>
  );
}
