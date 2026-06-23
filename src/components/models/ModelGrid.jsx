import ModelCard from "./ModelCard";

export default function ModelGrid({ models, scroll = false }) {
  return (
    <div className={scroll ? "row-scroll" : "model-grid"}>
      {models.map((m) => (
        <ModelCard key={m.id} model={m} />
      ))}
    </div>
  );
}
