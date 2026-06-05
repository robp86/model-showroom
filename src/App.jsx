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

function getSizeGroup(sqft) {
  if (sqft < 1000) return "Compact Homes";
  if (sqft < 1200) return "Efficient Homes";
  if (sqft < 1400) return "Classic Family Homes";
  if (sqft < 1600) return "Popular Family Homes";
  if (sqft < 1800) return "Spacious Homes";
  if (sqft < 2000) return "Large Family Homes";
  return "Estate / Grand Homes";
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSizeGroup, setSelectedSizeGroup] = useState("All Homes");

  const modelsWithGroups = useMemo(() => {
    return models.map((home) => ({
      ...home,
      sizeGroup: getSizeGroup(home.sqft),
    }));
  }, []);

  const filteredModels = modelsWithGroups.filter((home) => {
    const matchesSearch = home.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSizeGroup =
      selectedSizeGroup === "All Homes" ||
      home.sizeGroup === selectedSizeGroup;

    return matchesSearch && matchesSizeGroup;
  });

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
      </section>

      <p className="results-count">
        Showing {filteredModels.length} of {models.length} homes
      </p>

      <section className="model-grid">
        {filteredModels.map((home) => (
          <article className="model-card" key={home.id}>
            <div className="model-image-placeholder">{home.name}</div>

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