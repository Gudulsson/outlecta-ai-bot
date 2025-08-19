import { generateDescription, needsDescriptionUpdate } from "./generateDescription.js";
import dotenv from "dotenv";
dotenv.config();
import { listProducts, updateProductDescription } from "./shopify.js";
import pLimit from "p-limit";
import fs from "fs";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true",
  RESUME_FILE = ".description_resume.json"
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
    const { id: productId, title, vendor, variants = [] } = p;
    scanned++;

    if (!needsDescriptionUpdate(p)) {
      console.log(`[SKIP] Product ${productId} already has good description`);
      continue;
    }

    const task = limit(async () => {
      // Använd första varianten som fallback
      const variantTitle = variants[0]?.title || null;

      const description = await generateDescription({
        productTitle: title,
        variantTitle,
        vendor
      });

      if (DRY) {
        console.log(`[DRY] Would update description for product ${productId} => "${description}"`);
        changed++;
        return;
      }

      await updateProductDescription(productId, description);
      console.log(`[OK] Description updated for product ${productId}`);
      changed++;
      
      // Liten paus för att vara snäll mot API:t
      await new Promise(r => setTimeout(r, 200));
    });

    await task;
  }

  return { nextPageInfo, changed, scanned };
}

async function main() {
  const resume = loadResume();
  let pageInfo = resume.pageInfo;
  let totalChanged = resume.changed || 0;
  let totalScanned = resume.scanned || 0;

  console.log(`Starting product description generation...`);
  console.log(`DRY RUN: ${DRY}`);
  console.log(`Resume from: ${pageInfo ? 'previous session' : 'beginning'}`);

  while (true) {
    const { nextPageInfo, changed, scanned } = await processBatch(pageInfo);
    totalChanged += changed;
    totalScanned += scanned;

    saveResume({ 
      pageInfo: nextPageInfo, 
      changed: totalChanged, 
      scanned: totalScanned, 
      done: !nextPageInfo 
    });

    console.log(`Batch done. Scanned: +${scanned}, Changed: +${changed}. Total scanned: ${totalScanned}, total changed: ${totalChanged}.`);

    if (!nextPageInfo) break;
  }

  console.log(DRY ? "Dry-run complete." : "Description update complete.");
  console.log(`Final stats: ${totalScanned} products scanned, ${totalChanged} descriptions updated.`);
}

main().catch(err => {
  console.error("Fatal:", err?.response?.data || err);
  process.exit(1);
});
