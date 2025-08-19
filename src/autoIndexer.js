import { generateAllContent } from "./webSearchAI.js";
import { listProducts, updateProductDescription, upsertProductMetafield, getDescriptionHash } from "./shopify.js";
import { sanitizeDescriptionHtml } from "./textSanitizer.js";
import pLimit from "p-limit";
import fs from "fs";
import crypto from "crypto";

const limit = pLimit(1);
const INDEXED_PRODUCTS_FILE = ".indexed_products.json";
const CHECK_INTERVAL_SECONDS = 30; // Check every 30 seconds

// Load indexed products from file
function loadIndexedProducts() {
  if (fs.existsSync(INDEXED_PRODUCTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(INDEXED_PRODUCTS_FILE, "utf8"));
    } catch (error) {
      console.log("Could not load indexed products, starting fresh");
    }
  }
  return {};
}

// Save indexed products to file
function saveIndexedProducts(indexedProducts) {
  fs.writeFileSync(INDEXED_PRODUCTS_FILE, JSON.stringify(indexedProducts, null, 2));
}

// Check if product needs indexing
function needsIndexing(product, indexedProducts) {
  const productId = product.id;
  
  // If product not in indexed list, it needs indexing
  if (!indexedProducts[productId]) {
    return {
      needsIndexing: true,
      reason: "new_product",
      details: "New product detected"
    };
  }
  
  // If title changed, re-index
  if (product.title !== indexedProducts[productId].title) {
    return {
      needsIndexing: true,
      reason: "title_changed",
      details: `Title changed from "${indexedProducts[productId].title}" to "${product.title}"`
    };
  }
  
  // If description is missing or too short, re-index
  const currentDesc = product.body_html || "";
  const cleanDesc = currentDesc.replace(/<[^>]*>/g, "").trim();
  
  if (!cleanDesc || cleanDesc.length < 50) {
    return {
      needsIndexing: true,
      reason: "missing_description",
      details: `Description missing or too short (${cleanDesc.length} chars)`
    };
  }
  
  return {
    needsIndexing: false,
    reason: "already_indexed",
    details: "Product already properly indexed"
  };
}

// Index a single product
async function indexProduct(product, reason) {
  console.log(`🔍 Indexing: ${product.title} (${reason})`);
  
  try {
    // Generate content with Ultimate AI
    const content = await generateAllContent(product.title, product.vendor);
    
    if (!content || !content.detailedDescription) {
      console.log(`⚠️  No content generated for ${product.title}`);
      return false;
    }
    
    // Sanitize and hash the content
    const safeHtml = sanitizeDescriptionHtml(content.detailedDescription);
    const newHash = crypto.createHash("sha256").update(safeHtml).digest("hex");
    
    // Check if content has changed
    const currentHash = await getDescriptionHash(product.id);
    if (currentHash === newHash) {
      console.log(`⏭️  Content unchanged for ${product.title}`);
      return true;
    }
    
    // Update product description
    await updateProductDescription(product.id, safeHtml);
    
    // Store new hash
    try {
      await upsertProductMetafield(product.id, "agent", "desc_hash", newHash, "single_line_text_field");
    } catch (error) {
      console.warn(`Hash storage failed for ${product.title}: ${error.message}`);
    }
    
    // Save meta description
    if (content.metaDescription) {
      try {
        await upsertProductMetafield(
          product.id,
          "global",
          "description_tag",
          content.metaDescription,
          "single_line_text_field"
        );
        
        const titleTag = `${product.title}`.slice(0, 60);
        await upsertProductMetafield(
          product.id,
          "global",
          "title_tag",
          titleTag,
          "single_line_text_field"
        );
      } catch (error) {
        console.warn(`Meta description update failed for ${product.title}: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully indexed: ${product.title}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to index ${product.title}:`, error.message);
    return false;
  }
}

// Main auto-indexing function
async function autoIndex() {
  console.log(`🤖 Auto-Indexer running at ${new Date().toISOString()}`);
  
  const indexedProducts = loadIndexedProducts();
  let pageInfo = null;
  let totalScanned = 0;
  let totalIndexed = 0;
  let newProducts = 0;
  let updatedProducts = 0;
  
  const allProducts = [];
  
  // Collect all products
  while (true) {
    try {
      const { products, nextPageInfo } = await listProducts({
        limit: 100,
        pageInfo
      });
      
      allProducts.push(...products);
      totalScanned += products.length;
      
      if (!nextPageInfo) break;
      pageInfo = nextPageInfo;
    } catch (error) {
      console.error("Error fetching products:", error.message);
      break;
    }
  }
  
  console.log(`📊 Scanned ${totalScanned} products`);
  
  // Check each product for indexing needs
  const productsToIndex = [];
  
  for (const product of allProducts) {
    const indexingAnalysis = needsIndexing(product, indexedProducts);
    
    if (indexingAnalysis.needsIndexing) {
      productsToIndex.push({
        product,
        analysis: indexingAnalysis
      });
      
      if (indexingAnalysis.reason === "new_product") {
        newProducts++;
      } else {
        updatedProducts++;
      }
    }
  }
  
  if (productsToIndex.length > 0) {
    console.log(`🚀 Found ${productsToIndex.length} products to index:`);
    console.log(`   New products: ${newProducts}`);
    console.log(`   Updated products: ${updatedProducts}\n`);
    
    // Index products with rate limiting
    for (const { product, analysis } of productsToIndex) {
      const task = limit(async () => {
        const success = await indexProduct(product, analysis.reason);
        
        if (success) {
          // Update indexed products list
          indexedProducts[product.id] = {
            id: product.id,
            title: product.title,
            vendor: product.vendor,
            indexedAt: new Date().toISOString(),
            reason: analysis.reason
          };
          totalIndexed++;
        }
        
        // Small delay between products
        await new Promise(r => setTimeout(r, 500));
      });
      
      await task;
    }
    
    // Save updated indexed products list
    saveIndexedProducts(indexedProducts);
    
    console.log(`\n🎉 Auto-indexing complete!`);
    console.log(`📈 Indexed ${totalIndexed} products`);
  } else {
    console.log(`✅ All products are properly indexed!`);
  }
  
  console.log(`⏰ Next check in ${CHECK_INTERVAL_SECONDS} seconds\n`);
}

// Continuous auto-indexing loop
async function startAutoIndexer() {
  console.log("🚀 Starting Auto-Indexer...");
  console.log(`⏱️  Check interval: ${CHECK_INTERVAL_SECONDS} seconds`);
  console.log("🔄 Continuous monitoring enabled\n");
  
  while (true) {
    try {
      await autoIndex();
    } catch (error) {
      console.error("❌ Auto-indexing error:", error.message);
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_SECONDS * 1000));
  }
}

// Export functions for manual use
export { autoIndex, startAutoIndexer };

// Start auto-indexer if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startAutoIndexer().catch(error => {
    console.error("Fatal error in auto-indexer:", error);
    process.exit(1);
  });
}
