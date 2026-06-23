import { Link } from "react-router-dom";

export default function MissingMediaNotice({
  title = "Not available yet",
  message = "We're still gathering this for the listing.",
  modelName,
}) {
  return (
    <div className="missing-note">
      <span className="placeholder__sun" aria-hidden="true" style={{ margin: "0 auto 10px" }} />
      <h3>{title}</h3>
      <p className="muted">{message}</p>
      <Link
        className="btn btn--primary btn--sm"
        to={`/contact${modelName ? `?model=${encodeURIComponent(modelName)}` : ""}`}
      >
        Contact us for the latest details
      </Link>
    </div>
  );
}
