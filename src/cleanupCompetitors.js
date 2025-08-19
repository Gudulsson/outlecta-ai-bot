import dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";
import { listProducts, updateProductDescription } from "./shopify.js";
import { sanitizeDescriptionHtml } from "./textSanitizer.js";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true"
} = process.env;

const DRY = DRY_RUN === "true";
const limit = pLimit(1);

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


