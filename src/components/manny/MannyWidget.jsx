// Manny — the showroom bot. Suggests models from the generated dataset based on
// location (zoning DB) + preferences. Picks up Sunny's handoff context from
// URL params (?via=sunny&county=...&product=...) so funneled visitors never
// repeat themselves. Guided flow only — no free-form chat.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useModels } from "../../hooks/useModels";
import "./manny.css";

const DB_URL = "/data/fl-zoning-db.json";

function readCtx() {
  const p = new URLSearchParams(window.location.search);
  return {
    viaSunny: p.get("via") === "sunny",
    county: p.get("county") || "",
    city: p.get("city") || "",
    product: p.get("product") || "", // adu | primary
    juris: p.get("juris") || "",
    hoa: p.get("hoa") || "",
  };
}

function norm(s) {
  return String(s).toLowerCase().replace(/\bcounty\b/g, "").replace(/[^a-z]/g, "");
}

function findCounty(db, name) {
  if (!db || !name) return null;
  return (
    db.counties.find((c) => norm(c.county) === norm(name)) ||
    db.counties.find((c) => norm(c.county).startsWith(norm(name)) && norm(name).length >= 3) ||
    null
  );
}

// Pull a usable numeric cap out of descriptive strings like
// "750 sq ft or 35% of primary, whichever is less".
function parseAduCap(s) {
  if (!s) return { cap: null, formula: false };
  const nums = (String(s).replace(/,/g, "").match(/\b(\d{3,4})\s*sq\s*ft\b/gi) || [])
    .map((x) => parseInt(x, 10))
    .filter((n) => n >= 300 && n <= 3000);
  const formula = /%|whichever/i.test(s);
  return { cap: nums.length ? Math.max(...nums) : null, formula };
}

const BED_FILTERS = {
  "1–2 beds": (m) => m.beds <= 2,
  "3 beds": (m) => m.beds === 3,
  "4+ beds": (m) => m.beds >= 4,
  "Any beds": () => true,
};
const SIZE_FILTERS = {
  "Cozy (under 1,200 sqft)": (m) => m.sqft < 1200,
  "Family (1,200–1,800)": (m) => m.sqft >= 1200 && m.sqft <= 1800,
  "Big (1,800+)": (m) => m.sqft > 1800,
  "Any size": () => true,
};

export default function MannyWidget() {
  const { models } = useModels(); // already best-match sorted
  const [open, setOpen] = useState(false);
  const [db, setDb] = useState(null);
  const dbRef = useRef(null); // handlers close over stale `db` state; always read via ref
  const [thread, setThread] = useState([]); // {who:'manny'|'user', html}
  const [step, setStep] = useState(null); // {type:..., ...}
  const [shown, setShown] = useState(4);
  const ans = useRef({ ...readCtx() });
  const bodyRef = useRef(null);
  const booted = useRef(false);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread, step, shown]);

  // Auto-open once when Sunny sent them over.
  useEffect(() => {
    if (ans.current.viaSunny && !sessionStorage.getItem("manny-greeted")) {
      sessionStorage.setItem("manny-greeted", "1");
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!dbRef.current) {
      fetch(DB_URL).then((r) => r.json())
        .then((j) => { dbRef.current = j; setDb(j); })
        .catch(() => { dbRef.current = { counties: [], _meta: {} }; setDb(dbRef.current); });
    }
    if (!booted.current) { booted.current = true; start(); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function say(html) { setThread((t) => [...t, { who: "manny", html }]); }
  function said(text) { setThread((t) => [...t, { who: "user", html: text }]); }

  function start() {
    setThread([]); setStep(null); setShown(4);
    const c = ans.current;
    if (c.viaSunny && c.county) {
      say(
        `Well hey — <b>Sunny called ahead</b> ☀️ I'm <b>Manny</b>, I run the showroom. ` +
        `So: ${c.product === "adu" ? "a <b>backyard ADU</b>" : "a <b>home for your own land</b>"} in <b>${esc(c.county)} County</b>` +
        `${c.city ? " (" + esc(c.city) + ")" : ""}. Let's find it.`
      );
      askBeds();
    } else {
      say(
        `I'm <b>Manny</b> — I run this showroom. <b>${models.length} homes</b> on the floor. ` +
        `Answer me a couple quick questions and I'll shortlist the right ones.`
      );
      askProduct();
    }
  }

  function askProduct() {
    say("What kind of home are we looking for?");
    setStep({
      type: "options",
      items: [
        { label: "➕ A backyard ADU", go: () => { ans.current.product = "adu"; ans.current.county ? askBeds() : askCounty(); } },
        { label: "🏡 A home for my own land", go: () => { ans.current.product = "primary"; askBeds(); } },
        { label: "Just browsing", go: browse },
      ],
    });
  }

  function browse() {
    say(
      `Browse away — the floor's all yours. <a href="/homes">All homes</a> · <a href="/find">Home finder</a> · <a href="/floor-plans">Floor plans</a>` +
      `<span class="manny-small">Tip: if you tell me where your land is, I can filter out homes that won't fit your county's rules. ` +
      `For the full zoning check — permits, size caps, who to call — <a href="https://nativesunhomes.com/">ask my buddy Sunny ☀️</a> on our main site.</span>`
    );
    setStep({ type: "options", items: [{ label: "OK — check my county", go: () => { ans.current.product = "adu"; askCounty(); } }, { label: "↩ Start over", go: start }] });
  }

  function askCounty() {
    say("Which Florida <b>county</b> is the property in? (ADU size limits change county to county.)");
    setStep({ type: "county" });
  }

  function askBeds() {
    say("How many <b>bedrooms</b>?");
    setStep({
      type: "options",
      items: Object.keys(BED_FILTERS).map((label) => ({
        label,
        go: () => { ans.current.beds = label; ans.current.product === "primary" ? askSize() : picks(); },
      })),
    });
  }

  function askSize() {
    say("What <b>size</b> feels right?");
    setStep({
      type: "options",
      items: Object.keys(SIZE_FILTERS).map((label) => ({ label, go: () => { ans.current.size = label; picks(); } })),
    });
  }

  function picks() {
    const a = ans.current;
    let list = models.filter(BED_FILTERS[a.beds] || (() => true));
    const notes = [];
    const zdb = dbRef.current;
    const rec = findCounty(zdb, a.county);
    const cityRec = rec && a.city ? (rec.municipalities || []).find((m) => norm(m.city) === norm(a.city)) : null;
    const zone3 = zdb?._meta?.manufactured_home_wind_zones?.zone_III_counties || [];

    if (a.product === "adu") {
      const src = cityRec || rec;
      const { cap, formula } = parseAduCap(src?.max_adu_size_sqft);
      const limit = cap || 1000;
      list = list.filter((m) => m.sqft <= limit);
      if (cap) {
        notes.push(`${esc(placeName(a, cityRec))} caps ADUs around <b>${cap.toLocaleString()} sq ft</b>${formula ? " (exact limit can depend on your main home's size)" : ""} — these fit.`);
      } else {
        notes.push(`No fixed ADU size cap found for ${esc(placeName(a, cityRec))} — showing homes under <b>1,000 sq ft</b>, the classic ADU range.`);
      }
      if (src && src.adu_allowed === "no") {
        notes.push(`⚠️ Straight talk: ${esc(placeName(a, cityRec))} doesn't allow rentable ADUs by right <i>yet</i> — state law forces the update by <b>Dec 1, 2026</b>. Worth planning now, confirming before ordering.`);
      }
      if (rec && norm(rec.county) === "marion") {
        list = list.filter((m) => m.sectionType !== "single-wide");
        notes.push(`Marion County requires a 20 ft minimum body width — I've left the single-wides off your list.`);
      }
    } else if (a.size) {
      list = list.filter(SIZE_FILTERS[a.size] || (() => true));
    }
    if (rec && zone3.includes(rec.county)) {
      notes.push(`🌀 ${esc(rec.county)} is a <b>Wind Zone III</b> county — every home we deliver there is factory-built to that hurricane spec. Included, not extra.`);
    }

    if (!list.length) {
      say(`Hmm — nothing on the floor matches that exact combo. Loosen one filter and I'll have options for you.`);
      setStep({ type: "options", items: [{ label: "↩ Change my answers", go: start }, { label: "See all homes", go: browse }] });
      return;
    }
    say(
      `Here's what I'd show you first — <b>${list.length} home${list.length > 1 ? "s" : ""}</b> fit${notes.length ? "<br><br>" + notes.join("<br><br>") : ""}` +
      `<span class="manny-small">Tap a home for photos, floor plan and 3D tour.</span>`
    );
    setShown(4);
    setStep({ type: "picks", list });
  }

  function placeName(a, cityRec) {
    return cityRec ? cityRec.city : a.county ? a.county + " County" : "your area";
  }

  function submitLead(e) {
    e.preventDefault();
    const f = e.target;
    const a = ans.current;
    const body = new URLSearchParams({
      "form-name": "contact",
      name: f.name.value,
      email: f.email.value,
      phone: f.phone.value,
      model: (step?.prevList || []).slice(0, 3).map((m) => m.name).join(", "),
      interest: `Manny bot — ${a.product === "adu" ? "ADU" : "own land"}${a.county ? " in " + a.county + " County" : ""}${a.beds ? ", " + a.beds : ""}`,
      message: `Sent by Manny (showroom bot).${a.viaSunny ? " Arrived via Sunny handoff." : ""}${a.city ? " City: " + a.city + "." : ""}${a.hoa ? " HOA: " + a.hoa + "." : ""}`,
    }).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
      .then(done).catch(done);
    function done() {
      said(f.name.value);
      say(`Got it, <b>${esc(f.name.value)}</b> — the team will reach out shortly. In the meantime the floor's open. 🤝`);
      setStep({ type: "options", items: [{ label: "↩ Start over", go: start }] });
    }
    return false;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function pickOption(o) { setStep(null); said(o.label); o.go(); }

  function submitCounty(e) {
    e.preventDefault();
    const v = e.target.county.value.trim();
    if (!v) return;
    const rec = findCounty(dbRef.current, v);
    if (!rec) { said(v); say("I don't recognize that county — try the list that pops up as you type."); return; }
    setStep(null); said(rec.county + " County");
    ans.current.county = rec.county;
    askBeds();
  }

  if (!open) {
    return (
      <button id="manny-launch" onClick={() => setOpen(true)} aria-label="Open Manny, the showroom helper">
        <span className="manny-face">🏡</span> Ask Manny — find your home
      </button>
    );
  }

  return (
    <div id="manny-panel" role="dialog" aria-label="Manny, the showroom helper">
      <div className="manny-head">
        <div className="manny-face">🏡</div>
        <div>
          <h3>Manny</h3>
          <p>Native Sun Homes · showroom floor</p>
        </div>
        <button className="manny-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>
      <div className="manny-body" ref={bodyRef}>
        {thread.map((m, i) => (
          <div key={i} className={"manny-msg" + (m.who === "user" ? " user" : "")} dangerouslySetInnerHTML={{ __html: m.html }} />
        ))}

        {step?.type === "options" && (
          <div className="manny-opts">
            {step.items.map((o, i) => (
              <button key={i} onClick={() => pickOption(o)}>{o.label}</button>
            ))}
          </div>
        )}

        {step?.type === "county" && (
          <form className="manny-inputrow" onSubmit={submitCounty}>
            <input name="county" list="manny-counties" placeholder="Start typing a county…" autoFocus autoComplete="off" />
            <button type="submit">Go</button>
            <datalist id="manny-counties">
              {(db?.counties || []).map((c) => <option key={c.county} value={c.county} />)}
            </datalist>
          </form>
        )}

        {step?.type === "picks" && (
          <>
            <div className="manny-cards">
              {step.list.slice(0, shown).map((m) => (
                <Link className="manny-card" key={m.id} to={`/model/${m.id}`}>
                  {m.media?.heroImage
                    ? <img src={m.media.heroImage} alt={m.name} loading="lazy" />
                    : <div className="manny-noimg">🏠</div>}
                  <div>
                    <h4>{m.name}</h4>
                    <p>{m.beds} bed · {m.baths} bath · {m.sqft.toLocaleString()} sqft</p>
                    <p>{m.series}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="manny-opts">
              {step.list.length > shown && (
                <button onClick={() => setShown((n) => n + 4)}>Show {Math.min(4, step.list.length - shown)} more</button>
              )}
              <button onClick={() => { const l = step.list; said("Talk to the team"); setStep({ type: "lead", prevList: l }); say("Leave your info and the team will call with real availability and pricing on these."); }}>
                📞 Talk to the team
              </button>
              <button onClick={() => { said("Start over"); start(); }}>↩ Start over</button>
            </div>
          </>
        )}

        {step?.type === "lead" && (
          <form className="manny-lead" onSubmit={submitLead}>
            <input name="name" placeholder="Name *" required />
            <input name="email" type="email" placeholder="Email *" required />
            <input name="phone" type="tel" placeholder="Phone (optional)" />
            <button type="submit">Send to the Native Sun team</button>
          </form>
        )}
      </div>
    </div>
  );
}
