import { models } from "./data/models";
import "./App.css";

function App() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Model Showroom</h1>
        <p>This site currently has {models.length} models loaded.</p>
      </section>

      <section className="model-grid">
        {models.map((home) => (
          <article className="model-card" key={home.id}>
            <div className="model-image-placeholder">
              {home.name}
            </div>

            <div className="model-info">
              <h2>{home.name}</h2>
              <p className="category">{home.category}</p>
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