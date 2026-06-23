import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import Showroom from "../components/models/Showroom";
import { useModels } from "../hooks/useModels";

export default function ShowroomPage() {
  const { models, total } = useModels();
  const [params] = useSearchParams();

  const initialFilters = {
    query: params.get("q") || "",
    beds: params.get("beds") || "",
    baths: params.get("baths") || "",
    minSqft: params.get("min") || "",
    maxSqft: params.get("max") || "",
    series: params.get("series") || "",
  };

  return (
    <>
      <Seo
        title="Our Homes"
        path="/homes"
        description={`Browse all ${total} manufactured & modular home models from Native Sun Homes. Filter by series, size, bedrooms, and bathrooms. Serving all of Florida.`}
      />
      <Showroom
        key={params.toString()}
        baseModels={models}
        title="Our Homes"
        subtitle="Browse every home — filter by series, size, bedrooms, and bathrooms."
        initialFilters={initialFilters}
      />
    </>
  );
}
