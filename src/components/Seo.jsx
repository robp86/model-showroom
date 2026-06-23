import { useEffect } from "react";
import { SITE_URL } from "../data/business";

// Per-page SEO + social tags. Updates the existing <head> tags in place (the
// defaults live in index.html) so there's exactly one of each — no duplicate
// titles/canonicals. JSON-LD is swapped per page under a fixed id. Crawlers and
// AI answer engines read both the meta and the JSON-LD.

function upsertMeta(attr, key, content) {
  if (content == null || content === "") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function Seo({
  title,
  description,
  path = "",
  image,
  type = "website",
  jsonLd,
  noindex = false,
}) {
  const ldStr = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const fullTitle = title
      ? `${title} | Native Sun Homes`
      : "Native Sun Homes — Manufactured & Modular Homes in Florida";
    const url = SITE_URL + path;
    const img = image
      ? image.startsWith("http")
        ? image
        : SITE_URL + image
      : SITE_URL + "/images/Logo.jpg";

    document.title = fullTitle;
    if (description) upsertMeta("name", "description", description);
    upsertLink("canonical", url);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:title", fullTitle);
    if (description) upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:site_name", "Native Sun Homes LLC");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    if (description) upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", img);

    let ld = document.getElementById("seo-jsonld");
    if (ldStr) {
      if (!ld) {
        ld = document.createElement("script");
        ld.type = "application/ld+json";
        ld.id = "seo-jsonld";
        document.head.appendChild(ld);
      }
      ld.textContent = ldStr;
    } else if (ld) {
      ld.remove();
    }
  }, [title, description, path, image, type, noindex, ldStr]);

  return null;
}
