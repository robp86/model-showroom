import { useMemo } from "react";
import Showroom from "../components/models/Showroom";
import { useModels } from "../hooks/useModels";

export default function FloorPlansPage() {
  const { models } = useModels();
  const withPlans = useMemo(
    () => models.filter((m) => m.media.hasFloorPlan),
    [models]
  );

  return (
    <Showroom
      baseModels={withPlans}
      title="Floor Plan Library"
      subtitle="Compare layouts across the lineup. Don't see a plan? Ask us — more are available from the manufacturer."
      initialSort="sqft-asc"
    />
  );
}
