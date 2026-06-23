// Filename + folder-name classification for the local gallery scan.

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const VIDEO_EXT = [".mp4", ".mov", ".webm", ".m4v"];

// Words that signal a hero/cover shot, in priority order.
const HERO_HINTS = ["header", "hero", "exterior", "elevation", "front", "main-image"];

export function getExt(name) {
  const i = String(name).lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

export function isImageFile(name) {
  return IMAGE_EXT.includes(getExt(name));
}

export function isVideoFile(name) {
  return VIDEO_EXT.includes(getExt(name));
}

// Normalize a filename to spaced words so "floor-plan", "floor_plan",
// "floorplan" all read the same.
function flat(name) {
  return String(name).toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ");
}

export function isFloorPlanFile(name) {
  const n = flat(name);
  return (
    n.includes("floor plan") ||
    n.includes("floorplan") ||
    n.includes("site plan") ||
    n.includes("siteplan")
  );
}

// Parse signals encoded into a folder name, e.g.
// "Bozeman (Floor plan only)", "Crestpointe H4684A (No photos)", "Prime (28)".
export function parseFolderFlags(folderName) {
  const lower = String(folderName).toLowerCase();
  const floorPlanOnly = lower.includes("floor plan only");
  const noPhotos = lower.includes("no photos");
  const countMatch = lower.match(/\((\d+)\)\s*$/);
  const groupCount = countMatch ? Number(countMatch[1]) : null;
  const cleanName = String(folderName)
    .replace(/\([^)]*\)?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { floorPlanOnly, noPhotos, groupCount, cleanName };
}

// Choose the best hero from a list of photo paths.
export function pickHeroImage(photos) {
  if (!photos || photos.length === 0) return "";
  for (const hint of HERO_HINTS) {
    const match = photos.find((p) => flat(p).includes(hint));
    if (match) return match;
  }
  return photos[0];
}

// Split a folder's files into photos / floor plans / videos and pick a hero.
// `floorPlanOnly` collapses everything into the floor-plan bucket.
export function classifyFolderMedia(files, { floorPlanOnly = false } = {}) {
  const images = files.filter(isImageFile);
  const videos = files.filter(isVideoFile);

  let floorPlans;
  let photos;
  if (floorPlanOnly) {
    floorPlans = images.slice();
    photos = [];
  } else {
    floorPlans = images.filter(isFloorPlanFile);
    photos = images.filter((f) => !isFloorPlanFile(f));
  }

  const heroImage = pickHeroImage(photos) || floorPlans[0] || "";
  return { photos, floorPlans, videos, heroImage };
}
