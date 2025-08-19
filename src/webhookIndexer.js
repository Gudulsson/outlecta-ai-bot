import { generateAllContent } from "./webSearchAI.js";
import { updateProductDescription, upsertProductMetafield, getDescriptionHash } from "./shopify.js";
import { sanitizeDescriptionHtml } from "./textSanitizer.js";
import crypto from "crypto";

// Webhook handler for immediate product indexing
export async function handleProductWebhook(webhookData) {
  try {
    const { id, title, vendor, body_html } = webhookData;
    
    console.log(`🔔 Webhook received for product: ${title} (ID: ${id})`);
    
    // Check if product needs immediate indexing
    const currentDesc = body_html || "";
    const cleanDesc = currentDesc.replace(/<[^>]*>/g, "").trim();
    
    if (!cleanDesc || cleanDesc.length < 50) {
      console.log(`📝 Product needs indexing - description too short (${cleanDesc.length} chars)`);
      
      // Generate content with Ultimate AI
      const content = await generateAllContent(title, vendor);
      
      if (!content || !content.detailedDescription) {
        console.log(`⚠️  No content generated for ${title}`);
        return { success: false, reason: "no_content_generated" };
      }
      
      // Sanitize and hash the content
      const safeHtml = sanitizeDescriptionHtml(content.detailedDescription);
      const newHash = crypto.createHash("sha256").update(safeHtml).digest("hex");
      
      // Check if content has changed
      const currentHash = await getDescriptionHash(id);
      if (currentHash === newHash) {
        console.log(`⏭️  Content unchanged for ${title}`);
        return { success: true, reason: "content_unchanged" };
      }
      
      // Update product description immediately
      await updateProductDescription(id, safeHtml);
      
      // Store new hash
      try {
        await upsertProductMetafield(id, "agent", "desc_hash", newHash, "single_line_text_field");
      } catch (error) {
        console.warn(`Hash storage failed for ${title}: ${error.message}`);
      }
      
      // Save meta description
      if (content.metaDescription) {
        try {
          await upsertProductMetafield(
            id,
            "global",
            "description_tag",
            content.metaDescription,
            "single_line_text_field"
          );
          
          const titleTag = `${title}`.slice(0, 60);
          await upsertProductMetafield(
            id,
            "global",
            "title_tag",
            titleTag,
            "single_line_text_field"
          );
        } catch (error) {
          console.warn(`Meta description update failed for ${title}: ${error.message}`);
        }
      }
      
      console.log(`✅ Successfully indexed via webhook: ${title}`);
      return { 
        success: true, 
        reason: "indexed",
        category: content.analysis?.complexity || "unknown"
      };
      
    } else {
      console.log(`✅ Product already has description (${cleanDesc.length} chars)`);
      return { success: true, reason: "already_has_description" };
    }
    
  } catch (error) {
    console.error(`❌ Webhook indexing failed:`, error.message);
    return { success: false, reason: "error", error: error.message };
  }
}

// Batch webhook handler for multiple products
export async function handleBatchWebhook(webhookDataArray) {
  console.log(`🔔 Batch webhook received for ${webhookDataArray.length} products`);
  
  const results = [];
  
  for (const webhookData of webhookDataArray) {
    try {
      const result = await handleProductWebhook(webhookData);
      results.push({
        productId: webhookData.id,
        productTitle: webhookData.title,
        ...result
      });
      
      // Small delay between products to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      results.push({
        productId: webhookData.id,
        productTitle: webhookData.title,
        success: false,
        reason: "error",
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const indexedCount = results.filter(r => r.reason === "indexed").length;
  
  console.log(`📊 Batch webhook results: ${successCount}/${results.length} successful, ${indexedCount} indexed`);
  
  return {
    total: results.length,
    successful: successCount,
    indexed: indexedCount,
    results
  };
}

// Webhook verification function
export function verifyWebhookSignature(payload, signature, secret) {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
