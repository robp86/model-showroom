import ModelCard from "./ModelCard";
import TickerRow from "./TickerRow";

export default function ModelGrid({ models, scroll = false, ticker = false }) {
  const cards = models.map((m) => <ModelCard key={m.id} model={m} />);
  if (ticker) return <TickerRow>{cards}</TickerRow>;
  return <div className={scroll ? "row-scroll" : "model-grid"}>{cards}</div>;
}
