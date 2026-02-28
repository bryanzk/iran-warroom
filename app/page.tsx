import { IncidentDashboard } from "@/components/IncidentDashboard";
import { getSeedData } from "@/lib/data";

export default function Page() {
  const data = getSeedData();
  return <IncidentDashboard data={data} />;
}
