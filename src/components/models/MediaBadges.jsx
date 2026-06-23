import Badge from "../common/Badge";
import { getModelBadges } from "../../utils/modelDisplay";

export default function MediaBadges({ model, limit }) {
  const badges = getModelBadges(model);
  const shown = limit ? badges.slice(0, limit) : badges;
  if (shown.length === 0) return null;
  return (
    <div className="badge-row model-card__badges">
      {shown.map((x, i) => (
        <Badge key={i} variant={x.variant}>
          {x.label}
        </Badge>
      ))}
    </div>
  );
}
