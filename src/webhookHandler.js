import { generateAllContent } from "./geminiProductAgent.js";
import dotenv from "dotenv";
dotenv.config();
import { updateProductDescription, upsertProductMetafield, getDescriptionHash } from "./shopify.js";
import { sanitizeDescriptionHtml } from "./textSanitizer.js";
import crypto from "crypto";

const DRY = process.env.DRY_RUN === "true";

// Process a single product update from webhook
export async function processProductUpdate(productId, productTitle, vendor, variantTitle = "") {
  console.log(`🔄 Processing webhook update for: ${productTitle} (ID: ${productId})`);
  
  try {
    // Check if content is unchanged
    const currentHash = await getDescriptionHash(productId);
    
    const content = await generateAllContent(productTitle, variantTitle, vendor);
    
    if (content.detailedDescription) {
      const safeHtml = sanitizeDescriptionHtml(content.detailedDescription);
      const newHash = crypto.createHash("sha256").update(safeHtml).digest("hex");
      
      // Skip if same hash already stored
      if (currentHash === newHash) {
        console.log(`[SKIP] ${productTitle} - Description not changed.`);
        return { skipped: true, reason: "unchanged" };
      }
      
      if (DRY) {
        console.log(`[DRY] Would update ${productTitle}`);
        return { updated: true, dry: true };
      }
      
      // Store new hash
      try {
        await upsertProductMetafield(productId, "agent", "desc_hash", newHash, "single_line_text_field");
      } catch { /* ignore upsert failure for hash */ }
      
      // Update description
      await updateProductDescription(productId, safeHtml);
      
      // Update SEO metafields
      if (content.metaDescription) {
        try {
          await upsertProductMetafield(
            productId,
            "global",
            "description_tag",
            content.metaDescription,
            "single_line_text_field"
          );
          
          const titleTag = `${productTitle}`.slice(0, 60);
          await upsertProductMetafield(
            productId,
            "global",
            "title_tag",
            titleTag,
            "single_line_text_field"
          );
        } catch (e) {
          console.warn(`Metafield upsert failed for ${productTitle}: ${e.message}`);
        }
      }
      
      console.log(`[OK] Updated ${productTitle}`);
      return { updated: true };
    }
    
    return { skipped: true, reason: "no_content" };
    
  } catch (error) {
    console.error(`❌ Error processing ${productTitle}:`, error.message);
    return { error: error.message };
  }
}

// Simple webhook endpoint handler (for GitHub Actions or serverless)
export async function handleWebhook(req, res) {
  const { product_id, title, vendor } = req.body;
  
  if (!product_id || !title) {
    return res.status(400).json({ error: "Missing product_id or title" });
  }
  
  const result = await processProductUpdate(product_id, title, vendor);
  return res.json(result);
}
