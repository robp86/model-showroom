import { useState } from "react";
import MissingMediaNotice from "./MissingMediaNotice";

export default function FloorPlanViewer({ floorPlans, name }) {
  const [active, setActive] = useState(0);

  if (!floorPlans || floorPlans.length === 0) {
    return (
      <MissingMediaNotice
        title="Floor plan coming soon"
        message="We can send the floor plan for this home — just ask."
        modelName={name}
      />
    );
  }

  return (
    <div className="floorplan-view">
      <img src={floorPlans[active]} alt={`${name} floor plan`} loading="lazy" />
      {floorPlans.length > 1 && (
        <div className="gallery" style={{ marginTop: 12 }}>
          {floorPlans.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${name} floor plan ${i + 1}`}
              loading="lazy"
              onClick={() => setActive(i)}
              style={{ outline: i === active ? "2px solid var(--gold)" : "none" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
