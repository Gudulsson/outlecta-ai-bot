import { ruleBasedAlt, maybeAiAlt, needsAltUpdate, cleanupAlt } from "./generateAlt.js";

import dotenv from "dotenv";
dotenv.config();
import { listProducts, updateImageAlt } from "./shopify.js";
import pLimit from "p-limit";
import fs from "fs";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true",
  RESUME_FILE = ".alt_resume.json"
} = process.env;

const limit = pLimit(2); // throttla API 2 samtidiga
const DRY = DRY_RUN === "true";

function loadResume() {
  if (fs.existsSync(RESUME_FILE)) {
    try { return JSON.parse(fs.readFileSync(RESUME_FILE, "utf8")); } catch { }
  }
  return { pageInfo: null, done: false, changed: 0, scanned: 0 };
}

function saveResume(state) {
  fs.writeFileSync(RESUME_FILE, JSON.stringify(state, null, 2));
}

async function processBatch(pageInfo) {
  const { products, nextPageInfo } = await listProducts({
    limit: Number(PAGE_SIZE),
    pageInfo
  });

  let changed = 0;
  let scanned = 0;

  for (const p of products) {
    const { id: productId, title, vendor, variants = [], images = [] } = p;
    // Indexera variant-titlar via variant.image_id om möjligt
    const imgToVariant = new Map();
    for (const v of variants) {
      if (v.image_id) imgToVariant.set(v.image_id, v.title);
    }

    const tasks = images.map(img => limit(async () => {
      scanned++;
     if (!needsAltUpdate(img)) return;

// Om ALT finns men bara behöver städas → gör det utan att generera ny
const cleanedExisting = cleanupAlt(img.alt || "");
if (cleanedExisting && cleanedExisting !== (img.alt || "")) {
  if (DRY) {
    console.log(`[DRY] Would clean ALT for product ${productId}, image ${img.id} => "${cleanedExisting}"`);
    changed++;
    return;
  }
  await updateImageAlt(productId, img.id, cleanedExisting);
  console.log(`[OK] Cleaned ALT for product ${productId}, image ${img.id}`);
  changed++;
  await new Promise(r => setTimeout(r, 200));
  return;
}


      const variantTitle = imgToVariant.get(img.id) || null;
      // Först AI, annars fallback till regel
      const ai = await maybeAiAlt({
        productTitle: title, variantTitle, vendor, src: img.src
      }).catch(() => null);
      const alt = ai || ruleBasedAlt({
        productTitle: title, variantTitle, vendor, src: img.src
      });

      if (DRY) {
        console.log(`[DRY] Would set ALT for product ${productId}, image ${img.id} => "${alt}"`);
        changed++;
        return;
      }
      await updateImageAlt(productId, img.id, alt);
      console.log(`[OK] ALT set for product ${productId}, image ${img.id}`);
      changed++;
      // liten paus för att vara snäll mot API:t
      await new Promise(r => setTimeout(r, 200));
    }));

    await Promise.all(tasks);
  }

  return { nextPageInfo, changed, scanned };
}

async function main() {
  const resume = loadResume();
  let pageInfo = resume.pageInfo;
  let totalChanged = resume.changed || 0;
  let totalScanned = resume.scanned || 0;

  while (true) {
    const { nextPageInfo, changed, scanned } = await processBatch(pageInfo);
    totalChanged += changed;
    totalScanned += scanned;

    saveResume({ pageInfo: nextPageInfo, changed: totalChanged, scanned: totalScanned, done: !nextPageInfo });

    console.log(`Batch done. Scanned: +${scanned}, Changed: +${changed}. Total scanned: ${totalScanned}, total changed: ${totalChanged}.`);

    if (!nextPageInfo) break;
  }

  console.log(DRY ? "Dry-run complete." : "Update complete.");
}

main().catch(err => {
  console.error("Fatal:", err?.response?.data || err);
  process.exit(1);
});
