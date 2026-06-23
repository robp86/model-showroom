import { useState } from "react";
import { BUSINESS } from "../../data/business";

// Lead-capture form wired to Netlify Forms. The hidden detection form lives in
// index.html; on submit we POST url-encoded data to "/". When the site is
// deployed to Netlify, submissions appear in the dashboard (set up an email
// notification to contactus@nativesunhomesllc.com). Locally the POST 404s, so
// we fall back to showing the phone/email.
const encode = (data) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

export default function ContactSection({ defaultModel = "", compact = false }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    model: defaultModel,
    interest: "Pricing & availability",
    message: "",
    "bot-field": "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "contact", ...form }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="card-panel center">
        <span className="placeholder__sun" aria-hidden="true" style={{ margin: "0 auto 12px" }} />
        <h3>Thanks, {form.name || "neighbor"}!</h3>
        <p className="muted">
          Your request{form.model ? ` about the ${form.model}` : ""} is in. A Native
          Sun Homes team member will reach out with pricing, availability, and
          financing options.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card-panel"
      name="contact"
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={submit}
    >
      <input type="hidden" name="form-name" value="contact" />
      <p hidden>
        <label>
          Don't fill this out: <input name="bot-field" onChange={set("bot-field")} />
        </label>
      </p>
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input name="name" value={form.name} onChange={set("name")} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={set("phone")} type="tel" />
        </div>
        <div className="field">
          <label>Email</label>
          <input name="email" value={form.email} onChange={set("email")} type="email" required />
        </div>
        <div className="field">
          <label>Model of interest</label>
          <input name="model" value={form.model} onChange={set("model")} placeholder="Any model" />
        </div>
        <div className="field field--full">
          <label>What can we help with?</label>
          <select name="interest" value={form.interest} onChange={set("interest")}>
            <option>Pricing &amp; availability</option>
            <option>Free estimate</option>
            <option>Financing help</option>
            <option>Schedule a visit</option>
            <option>Land &amp; delivery questions</option>
            <option>Something else</option>
          </select>
        </div>
        {!compact && (
          <div className="field field--full">
            <label>Message</label>
            <textarea name="message" rows={4} value={form.message} onChange={set("message")} />
          </div>
        )}
      </div>

      {status === "error" && (
        <p className="muted" style={{ marginTop: 12 }}>
          Sorry — that didn't go through. Please call{" "}
          <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> or email{" "}
          <a href={BUSINESS.emailHref}>{BUSINESS.email}</a> and we'll help right away.
        </p>
      )}

      <button
        type="submit"
        className="btn btn--primary"
        style={{ marginTop: 14 }}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send Request"}
      </button>
    </form>
  );
}
