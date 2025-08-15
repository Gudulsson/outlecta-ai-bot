import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";
import { listProducts, updateProductDescription } from "./shopify.js";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true"
} = process.env;

const DRY = DRY_RUN === "true";
const limit = pLimit(1);

// Lista över kända konkurrentnamn som förekommer i texterna
const COMPETITOR_NAMES = [
  "HBM",
  "Vishay",
  "TML",
  "Flintec",
  "Advantech",
  "Beckhoff",
  "Siemens",
  "Allen Bradley",
  "Kontron",
  "National Instruments",
  "Keysight",
  "Tektronix",
  "Agilent"
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const competitorWordRegex = new RegExp(`\\b(${COMPETITOR_NAMES.map(escapeRegex).join("|")})\\b`, "gi");

function sanitizeDescriptionHtml(html = "") {
  if (!html) return html;
  let out = html;

  // 1) Ersätt fraser som namnger konkurrenter efter "like"/"such as"
  out = out.replace(/outperform(s)?[^.]*?(?:like|such as)[^.]*\./gi, (m) => {
    // Bevara punkt i slutet
    const endsWithPeriod = m.trim().endsWith(".");
    const replacement = "outperforms competing solutions" + (endsWithPeriod ? "." : "");
    return replacement;
  });

  // 2) Ta bort återstående direkta namnreferenser till konkurrenter
  out = out.replace(competitorWordRegex, "leading alternatives");

  // 3) Städa upp eventuella dubbla ord/blanksteg som kan uppstå
  out = out.replace(/\s{2,}/g, " ");

  return out;
}

async function processAllProducts() {
  let pageInfo = null;
  let scanned = 0;
  let changed = 0;

  console.log(`Starting competitor cleanup...`);
  console.log(`DRY RUN: ${DRY}`);

  while (true) {
    const { products, nextPageInfo } = await listProducts({
      limit: Number(PAGE_SIZE),
      pageInfo
    });

    for (const product of products) {
      scanned++;
      const before = product.body_html || "";
      const after = sanitizeDescriptionHtml(before);

      if (before !== after) {
        if (DRY) {
          console.log(`[DRY] Would sanitize product ${product.id} — "${product.title}"`);
          changed++;
        } else {
          await limit(async () => {
            await updateProductDescription(product.id, after);
            console.log(`[OK] Sanitized product ${product.id} — "${product.title}"`);
            changed++;
            await new Promise((r) => setTimeout(r, 250));
          });
        }
      }
    }

    if (!nextPageInfo) break;
    pageInfo = nextPageInfo;
  }

  console.log(`Cleanup done. Scanned: ${scanned}, Changed: ${changed}.`);
}

processAllProducts().catch((err) => {
  console.error("Fatal:", err?.response?.data || err);
  process.exit(1);
});


