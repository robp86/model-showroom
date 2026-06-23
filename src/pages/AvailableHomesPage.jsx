import { useMemo } from "react";
import Showroom from "../components/models/Showroom";
import { useModels } from "../hooks/useModels";

export default function AvailableHomesPage() {
  const { models } = useModels();
  const available = useMemo(
    () => models.filter((m) => m.businessTags.moveInReady),
    [models]
  );

  return (
    <Showroom
      baseModels={available}
      title="Move-In Ready Homes"
      subtitle="Homes ready to deliver and live in soon. Contact us for the latest availability and timelines."
    />
  );
}
