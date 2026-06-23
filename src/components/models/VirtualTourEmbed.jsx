import MissingMediaNotice from "./MissingMediaNotice";

export default function VirtualTourEmbed({ tours, name }) {
  if (!tours || tours.length === 0) {
    return (
      <MissingMediaNotice
        title="3D tour unavailable"
        message="A virtual tour isn't posted for this home yet. Ask us about scheduling an in-person or video walkthrough."
        modelName={name}
      />
    );
  }

  return (
    <div>
      {tours.map((src, i) => (
        <iframe
          key={i}
          className="tour-frame"
          src={src}
          title={`${name} 3D virtual tour ${i + 1}`}
          allow="fullscreen; xr-spatial-tracking"
          allowFullScreen
          loading="lazy"
          style={{ marginBottom: 12 }}
        />
      ))}
    </div>
  );
}
