import { Link } from "react-router-dom";

const PATHS = [
  { icon: "🎥", title: "Virtual Tour Homes", text: "Step inside in immersive 3D.", to: "/category/has-tour" },
  { icon: "🔑", title: "Move-In Ready", text: "Ready to deliver and live in.", to: "/category/move-in-ready" },
  { icon: "🎨", title: "Customizable Homes", text: "Make it yours with options.", to: "/category/customizable" },
  { icon: "📐", title: "Floor Plan Library", text: "Compare layouts side by side.", to: "/floor-plans" },
];

export default function BuyerPathCards() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="path-grid">
          {PATHS.map((p) => (
            <Link key={p.title} to={p.to} className="path-card">
              <div className="icon" aria-hidden="true">
                {p.icon}
              </div>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
