import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import ModelGrid from "../components/models/ModelGrid";
import { useModels } from "../hooks/useModels";

const STEPS = [
  {
    key: "beds",
    q: "How many bedrooms do you need?",
    options: [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4 or more", value: "4" },
    ],
  },
  {
    key: "baths",
    q: "How many bathrooms?",
    options: [
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3 or more", value: "3" },
      { label: "No preference", value: "" },
    ],
  },
  {
    key: "size",
    q: "What size range are you considering?",
    options: [
      { label: "Under 1,000 sq ft", value: "0-999" },
      { label: "1,000–1,499 sq ft", value: "1000-1499" },
      { label: "1,500–1,999 sq ft", value: "1500-1999" },
      { label: "2,000+ sq ft", value: "2000-9999" },
    ],
  },
  {
    key: "land",
    q: "Do you already own land?",
    options: [
      { label: "Yes, I own land", value: "yes" },
      { label: "Not yet", value: "no" },
      { label: "Not sure", value: "unsure" },
    ],
  },
  {
    key: "availability",
    q: "What are you looking for?",
    options: [
      { label: "Move-in ready", value: "move-in-ready" },
      { label: "Customizable", value: "customizable" },
      { label: "Just exploring", value: "any" },
    ],
  },
  {
    key: "priority",
    q: "What matters most to you?",
    options: [
      { label: "Price", value: "price" },
      { label: "Space", value: "space" },
      { label: "Speed", value: "speed" },
      { label: "Style / photos", value: "style" },
      { label: "Virtual tour", value: "tour" },
    ],
  },
  {
    key: "timeline",
    q: "What's your timeline?",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "1–3 months", value: "1-3" },
      { label: "3–6 months", value: "3-6" },
      { label: "Just browsing", value: "browsing" },
    ],
  },
];

function scoreModel(m, a) {
  let s = m.media.mediaScore / 10; // complete profiles surface naturally
  if (a.beds) {
    if (a.beds === "4" ? m.beds >= 4 : m.beds === Number(a.beds)) s += 6;
  }
  if (a.baths) {
    if (a.baths === "3" ? m.baths >= 3 : Math.floor(m.baths) === Number(a.baths)) s += 3;
  }
  if (a.size && m.sqft) {
    const [lo, hi] = a.size.split("-").map(Number);
    if (m.sqft >= lo && m.sqft <= hi) s += 6;
  }
  if (a.availability === "move-in-ready" && m.businessTags.moveInReady) s += 8;
  if (a.availability === "customizable" && m.businessTags.customizable) s += 3;

  if (a.priority === "price" && m.buyerTags.includes("budget-friendly")) s += 6;
  if (a.priority === "space" && m.sqft >= 1800) s += 6;
  if (a.priority === "speed" && m.businessTags.moveInReady) s += 6;
  if (a.priority === "style" && m.media.hasPhotos) s += 5;
  if (a.priority === "tour" && m.media.hasVirtualTour) s += 10;

  if ((a.timeline === "asap" || a.timeline === "1-3") && m.businessTags.moveInReady) s += 3;
  return s;
}

export default function FinderPage() {
  const { models } = useModels();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const done = step >= STEPS.length;

  const results = useMemo(() => {
    if (!done) return [];
    return [...models]
      .map((m) => ({ m, s: scoreModel(m, answers) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.m);
  }, [done, models, answers]);

  function choose(value) {
    const key = STEPS[step].key;
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep((s) => s + 1);
  }

  const progress = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);

  return (
    <div className="container section">
      <Seo
        title="Find a Home"
        path="/find"
        description="Answer a few quick questions and Native Sun Homes will suggest manufactured & modular homes that fit your needs and budget. Serving all of Florida."
      />
      <div className="finder">
        <p className="eyebrow center">Home Finder</p>
        <h1 className="center">Not sure where to start?</h1>
        <p className="lead center">Answer a few quick questions and we'll suggest homes that fit.</p>

        <div className="finder__progress" style={{ marginTop: 20 }}>
          <span style={{ width: `${done ? 100 : progress}%` }} />
        </div>

        {!done ? (
          <div className="card-panel">
            <p className="muted" style={{ marginBottom: 4 }}>
              Question {step + 1} of {STEPS.length}
            </p>
            <h2 style={{ fontSize: "1.4rem" }}>{STEPS[step].q}</h2>
            <div className="finder__options">
              {STEPS[step].options.map((o) => (
                <button
                  key={o.label}
                  className="finder__option"
                  onClick={() => choose(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button
                className="btn btn--ghost btn--sm"
                style={{ marginTop: 16 }}
                onClick={() => setStep((s) => s - 1)}
              >
                ← Back
              </button>
            )}
          </div>
        ) : (
          <div className="center">
            <h2>Your top matches</h2>
            <p className="muted">Based on your answers — most complete profiles first.</p>
            <div className="btn-row" style={{ justifyContent: "center", gap: 12, marginBottom: 24 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => { setStep(0); setAnswers({}); }}>
                Start over
              </button>
              <Link className="btn btn--primary btn--sm" to="/contact">
                Get help choosing
              </Link>
            </div>
          </div>
        )}
      </div>

      {done && (
        <div style={{ marginTop: 24 }}>
          <ModelGrid models={results} />
        </div>
      )}
    </div>
  );
}
