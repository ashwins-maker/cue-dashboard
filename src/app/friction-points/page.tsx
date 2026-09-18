import { FrictionPointsView } from "@/components/app/friction-points-view";
import { loadDashboardData } from "@/lib/dashboard-data";

export default async function FrictionPointsPage() {
  const data = await loadDashboardData();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <FrictionPointsView points={data.frictionPoints} />
    </div>
  );
}
