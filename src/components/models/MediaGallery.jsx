import { useState } from "react";
import MissingMediaNotice from "./MissingMediaNotice";

export default function MediaGallery({ photos, name }) {
  const [lightbox, setLightbox] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <MissingMediaNotice
        title="Photos coming soon"
        message="This home doesn't have a photo gallery yet — we can send current photos on request."
        modelName={name}
      />
    );
  }

  return (
    <>
      <div className="gallery">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${name} ${i + 1}`}
            loading="lazy"
            decoding="async"
            onClick={() => setLightbox(src)}
          />
        ))}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button aria-label="Close">×</button>
          <img src={lightbox} alt={name} />
        </div>
      )}
    </>
  );
}
