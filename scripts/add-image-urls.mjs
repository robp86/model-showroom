import fs from "fs/promises";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getManufacturerUrl(home) {
  return (
    home.manufacturerUrl ||
    home.url ||
    home.imageUrl ||
    home.modelUrl ||
    ""
  );
}

function findChampionImage(html) {
  const matches =
    html.match(/https:\/\/s7d9\.scene7\.com\/is\/image\/championhomes\/[^"'\\\s<)]+/g) || [];

  const filtered = matches.filter((url) => {
    const lower = url.toLowerCase();

    return (
      !lower.includes("logo") &&
      !lower.includes("icon") &&
      !lower.includes("favicon") &&
      !lower.includes("calculator") &&
      !lower.includes("video") &&
      !lower.includes("floorplan") &&
      !lower.includes("floor-plan")
    );
  });

  return filtered[0] || "";
}

async function getImageForModel(home) {
  const manufacturerUrl = getManufacturerUrl(home);

  if (!manufacturerUrl) {
    console.log(`Skipped ${home.name}: no manufacturer URL`);
    return "";
  }

  try {
    const response = await fetch(manufacturerUrl);

    if (!response.ok) {
      console.log(`Skipped ${home.name}: page returned ${response.status}`);
      return "";
    }

    const html = await response.text();
    const image = findChampionImage(html);

    if (!image) {
      console.log(`No image found for ${home.name}`);
    }

    return image;
  } catch (error) {
    console.log(`Skipped ${home.name}: ${error.message}`);
    return "";
  }
}

const updatedModels = [];

for (let index = 0; index < models.length; index++) {
  const home = models[index];

  console.log(`Checking ${index + 1}/${models.length}: ${home.name}`);

  const existingImage =
    home.image && home.image.startsWith("http") ? home.image : "";

  const image = existingImage || (await getImageForModel(home));

  updatedModels.push({
    ...home,
    image,
  });

  await wait(300);
}

const fileContent = `// Auto-generated model inventory
// Image URLs were pulled from manufacturer model pages when available.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Found images for ${foundCount} of ${models.length} models.`);
console.log("Updated src/data/models.js");