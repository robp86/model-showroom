import { useMemo, useState } from "react";
import { models } from "./data/models";
import "./App.css";

const sizeGroups = [
  "All Homes",
  "Compact Homes",
  "Efficient Homes",
  "Classic Family Homes",
  "Popular Family Homes",
  "Spacious Homes",
  "Large Family Homes",
  "Estate / Grand Homes",
];

const sortOptions = [
  "Name A-Z",
  "Name Z-A",
  "Smallest to Largest",
  "Largest to Smallest",
  "Bedrooms Low to High",
  "Bedrooms High to Low",
  "Bathrooms Low to High",
  "Bathrooms High to Low",
];

function getSizeGroup(sqft) {
  const size = Number(sqft);

  if (size < 1000) return "Compact Homes";
  if (size < 1200) return "Efficient Homes";
  if (size < 1400) return "Classic Family Homes";
  if (size < 1600) return "Popular Family Homes";
  if (size < 1800) return "Spacious Homes";
  if (size < 2000) return "Large Family Homes";
  return "Estate / Grand Homes";
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSizeGroup, setSelectedSizeGroup] = useState("All Homes");
  const [selectedBedrooms, setSelectedBedrooms] = useState("Any Bedrooms");
  const [selectedBathrooms, setSelectedBathrooms] = useState("Any Bathrooms");
  const [sortBy, setSortBy] = useState("Name A-Z");

  const modelsWithGroups = useMemo(() => {
    return models.map((home) => ({
      ...home,
      bedrooms: Number(home.bedrooms),
      bathrooms: Number(home.bathrooms),
      sqft: Number(home.sqft),
      sizeGroup: getSizeGroup(home.sqft),
    }));
  }, []);

  const bedroomOptions = useMemo(() => {
    const uniqueBedrooms = [...new Set(modelsWithGroups.map((home) => home.bedrooms))];
    return uniqueBedrooms.sort((a, b) => a - b);
  }, [modelsWithGroups]);

  const bathroomOptions = useMemo(() => {
    const uniqueBathrooms = [...new Set(modelsWithGroups.map((home) => home.bathrooms))];
    return uniqueBathrooms.sort((a, b) => a - b);
  }, [modelsWithGroups]);

  const filteredModels = useMemo(() => {
    const filtered = modelsWithGroups.filter((home) => {
      const matchesSearch = home.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSizeGroup =
        selectedSizeGroup === "All Homes" ||
        home.sizeGroup === selectedSizeGroup;

      const matchesBedrooms =
        selectedBedrooms === "Any Bedrooms" ||
        home.bedrooms === Number(selectedBedrooms);

      const matchesBathrooms =
        selectedBathrooms === "Any Bathrooms" ||
        home.bathrooms === Number(selectedBathrooms);

      return (
        matchesSearch &&
        matchesSizeGroup &&
        matchesBedrooms &&
        matchesBathrooms
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "Name A-Z") return a.name.localeCompare(b.name);
      if (sortBy === "Name Z-A") return b.name.localeCompare(a.name);
      if (sortBy === "Smallest to Largest") return a.sqft - b.sqft;
      if (sortBy === "Largest to Smallest") return b.sqft - a.sqft;
      if (sortBy === "Bedrooms Low to High") return a.bedrooms - b.bedrooms;
      if (sortBy === "Bedrooms High to Low") return b.bedrooms - a.bedrooms;
      if (sortBy === "Bathrooms Low to High") return a.bathrooms - b.bathrooms;
      if (sortBy === "Bathrooms High to Low") return b.bathrooms - a.bathrooms;
      return 0;
    });
  }, [
    modelsWithGroups,
    searchTerm,
    selectedSizeGroup,
    selectedBedrooms,
    selectedBathrooms,
    sortBy,
  ]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedSizeGroup("All Homes");
    setSelectedBedrooms("Any Bedrooms");
    setSelectedBathrooms("Any Bathrooms");
    setSortBy("Name A-Z");
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>Model Showroom</h1>
        <p>This site currently has {models.length} models loaded.</p>
      </section>

      <section className="controls">
        <input
          type="text"
          placeholder="Search by model name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={selectedSizeGroup}
          onChange={(event) => setSelectedSizeGroup(event.target.value)}
        >
          {sizeGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          value={selectedBedrooms}
          onChange={(event) => setSelectedBedrooms(event.target.value)}
        >
          <option>Any Bedrooms</option>
          {bedroomOptions.map((bedroom) => (
            <option key={bedroom} value={bedroom}>
              {bedroom} Bedroom{bedroom === 1 ? "" : "s"}
            </option>
          ))}
        </select>

        <select
          value={selectedBathrooms}
          onChange={(event) => setSelectedBathrooms(event.target.value)}
        >
          <option>Any Bathrooms</option>
          {bathroomOptions.map((bathroom) => (
            <option key={bathroom} value={bathroom}>
              {bathroom} Bath{bathroom === 1 ? "" : "s"}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button className="reset-button" onClick={resetFilters}>
          Reset Filters
        </button>
      </section>

      <p className="results-count">
        Showing {filteredModels.length} of {models.length} homes
      </p>

      <section className="model-grid">
        {filteredModels.map((home) => (
          <article className="model-card" key={home.id}>
            {home.image ? (
  <img className="model-image" src={home.image} alt={home.name} />
) : (
  <div className="model-image-placeholder">{home.name}</div>
)}

            <div className="model-info">
              <h2>{home.name}</h2>
              <p className="category">{home.category}</p>
              <p className="size-group">{home.sizeGroup}</p>
              <p className="details">
                {home.bedrooms} beds • {home.bathrooms} baths • {home.sqft} sqft
              </p>
              <button>View Model</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;