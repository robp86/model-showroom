import fs from "fs/promises";
import { models } from "../src/data/models.js";

const badImagesPath = new URL("./bad-images.json", import.meta.url);
const outputPath = new URL("../src/data/models.js", import.meta.url);
const reportPath = new URL("./bad-image-cleanup-report.json", import.meta.url);

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const badImageNames = JSON.parse(await fs.readFile(badImagesPath, "utf8"));

const cleared = [];
const notFound = [];
const matchedModelIndexes = new Set();

function findMatchingModelIndex(badName) {
  const normalizedBadName = normalizeName(badName);

  // 1. Exact match first
  let exactIndex = models.findIndex(
    (home) => normalizeName(home.name) === normalizedBadName
  );

  if (exactIndex !== -1) {
    return exactIndex;
  }

  // 2. Then try partial match
  let partialIndex = models.findIndex((home) => {
    const normalizedHomeName = normalizeName(home.name);

    return (
      normalizedHomeName.includes(normalizedBadName) ||
      normalizedBadName.includes(normalizedHomeName)
    );
  });

  return partialIndex;
}

const updatedModels = models.map((home) => ({ ...home }));

for (const badName of badImageNames) {
  const matchIndex = findMatchingModelIndex(badName);

  if (matchIndex === -1) {
    notFound.push(badName);
    continue;
  }

  const matchedHome = updatedModels[matchIndex];

  matchedModelIndexes.add(matchIndex);

  if (matchedHome.image) {
    cleared.push({
      requestedName: badName,
      matchedName: matchedHome.name,
      removedImage: matchedHome.image,
    });
  }

  updatedModels[matchIndex] = {
    ...matchedHome,
    image: "",
  };
}

const fileContent = `// Auto-generated model inventory
// Floor plan/wrong images were cleared using scripts/bad-images.json.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");

await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      requestedToClear: badImageNames.length,
      clearedCount: cleared.length,
      notFoundCount: notFound.length,
      cleared,
      notFound,
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Requested to clear: ${badImageNames.length}`);
console.log(`Images cleared: ${cleared.length}`);
console.log(`Names not found: ${notFound.length}`);
console.log("Updated src/data/models.js");
console.log("Created scripts/bad-image-cleanup-report.json");