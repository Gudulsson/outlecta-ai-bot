import { generateAllContent } from "./webSearchAI.js";
import dotenv from "dotenv";
dotenv.config();
import { listProducts, updateProductDescription, upsertProductMetafield, getDescriptionHash } from "./shopify.js";
import pLimit from "p-limit";
import fs from "fs";
import { sanitizeDescriptionHtml } from "./textSanitizer.js";
import crypto from "crypto";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true",
  RESUME_FILE = ".scheduled_ai_resume.json",
  PRODUCT_SNAPSHOT_FILE = ".product_snapshot.json",
  CHECK_INTERVAL_HOURS = "24"
} = process.env;

const limit = pLimit(1);
const DRY = DRY_RUN === "true";

// Ladda produkt-snapshot för att jämföra med tidigare körning
function loadProductSnapshot() {
  if (fs.existsSync(PRODUCT_SNAPSHOT_FILE)) {
    try { 
      return JSON.parse(fs.readFileSync(PRODUCT_SNAPSHOT_FILE, "utf8")); 
    } catch (error) {
      console.log("Could not load product snapshot, starting fresh");
    }
  }
  return {};
}

// Spara produkt-snapshot för nästa körning
function saveProductSnapshot(products) {
  const snapshot = {};
  products.forEach(product => {
    snapshot[product.id] = {
      title: product.title,
      vendor: product.vendor,
      body_html: product.body_html,
      updated_at: product.updated_at,
      created_at: product.created_at,
      status: product.status,
      tags: product.tags,
      product_type: product.product_type
    };
  });
  fs.writeFileSync(PRODUCT_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
}

// AI-funktion för att avgöra om en produkt behöver uppdateras
function needsUpdate(product, previousSnapshot) {
  const productId = product.id;
  const previous = previousSnapshot[productId];
  
  // Om produkt inte fanns tidigare - ny produkt
  if (!previous) {
    return { 
      needsUpdate: true, 
      reason: "new_product",
      priority: "high",
      details: "New product detected"
    };
  }
  
  // Kontrollera om titeln ändrats
  if (product.title !== previous.title) {
    return { 
      needsUpdate: true, 
      reason: "title_changed",
      priority: "high",
      details: `Title changed from "${previous.title}" to "${product.title}"`
    };
  }
  
  // Kontrollera om vendor ändrats
  if (product.vendor !== previous.vendor) {
    return { 
      needsUpdate: true, 
      reason: "vendor_changed",
      priority: "medium",
      details: `Vendor changed from "${previous.vendor}" to "${product.vendor}"`
    };
  }
  
  // Kontrollera om beskrivningen saknas eller är för kort
  const currentDesc = product.body_html || "";
  const cleanDesc = currentDesc.replace(/<[^>]*>/g, "").trim();
  
  if (!cleanDesc || cleanDesc.length < 100) {
    return { 
      needsUpdate: true, 
      reason: "missing_description",
      priority: "high",
      details: `Description missing or too short (${cleanDesc.length} chars)`
    };
  }
  
  // Kontrollera om beskrivningen är gammal (mer än 30 dagar)
  const lastUpdate = new Date(product.updated_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (lastUpdate < thirtyDaysAgo) {
    return { 
      needsUpdate: true, 
      reason: "outdated_description",
      priority: "medium",
      details: `Description not updated since ${lastUpdate.toISOString().split('T')[0]}`
    };
  }
  
  // Kontrollera om beskrivningen innehåller SEO-nyckelord
  const title = product.title.toLowerCase();
  const desc = cleanDesc.toLowerCase();
  
  // Enkel SEO-kontroll baserat på produkttyp
  const seoKeywords = {
    "kyowa": ["strain gauge", "load cell", "force sensor", "measurement"],
    "telac": ["touch screen", "industrial", "hmi", "display"],
    "mcc": ["data acquisition", "daq", "usb", "measurement"],
    "panel pc": ["panel pc", "industrial computer", "touch screen"],
    "monitran": ["vibration sensor", "condition monitoring"],
    "sensocar": ["weight indicator", "industrial scale"]
  };
  
  let hasRelevantKeywords = false;
  for (const [brand, keywords] of Object.entries(seoKeywords)) {
    if (title.includes(brand)) {
      hasRelevantKeywords = keywords.some(keyword => desc.includes(keyword));
      break;
    }
  }
  
  if (!hasRelevantKeywords) {
    return { 
      needsUpdate: true, 
      reason: "poor_seo",
      priority: "medium",
      details: "Description lacks relevant SEO keywords"
    };
  }
  
  // Kontrollera om beskrivningen är för generisk
  const genericPhrases = [
    "professional industrial solution",
    "industrial equipment",
    "high quality",
    "reliable performance"
  ];
  
  const isTooGeneric = genericPhrases.every(phrase => 
    desc.includes(phrase.toLowerCase())
  );
  
  if (isTooGeneric) {
    return { 
      needsUpdate: true, 
      reason: "generic_description",
      priority: "low",
      details: "Description is too generic and lacks specific details"
    };
  }
  
  return { 
    needsUpdate: false, 
    reason: "up_to_date",
    priority: "none",
    details: "Product description is current and optimized"
  };
}

// Huvudfunktion för schemalagd körning
async function scheduledRun() {
  console.log(`🤖 Starting Scheduled AI Product Agent...`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🔧 DRY RUN: ${DRY}`);
  console.log(`📊 Checking for new/updated products...\n`);
  
  const previousSnapshot = loadProductSnapshot();
  let pageInfo = null;
  let totalScanned = 0;
  let totalUpdated = 0;
  let newProducts = 0;
  let changedProducts = 0;
  let outdatedProducts = 0;
  let seoIssues = 0;
  
  const allProducts = [];
  
  // Samla alla produkter först
  while (true) {
    const { products, nextPageInfo } = await listProducts({
      limit: Number(PAGE_SIZE),
      pageInfo
    });
    
    allProducts.push(...products);
    totalScanned += products.length;
    
    if (!nextPageInfo) break;
    pageInfo = nextPageInfo;
  }
  
  console.log(`📈 Found ${totalScanned} total products`);
  
  // Analysera varje produkt
  const productsToUpdate = [];
  
  for (const product of allProducts) {
    const updateAnalysis = needsUpdate(product, previousSnapshot);
    
    if (updateAnalysis.needsUpdate) {
      productsToUpdate.push({
        product,
        analysis: updateAnalysis
      });
      
      // Logga vad som behöver uppdateras
      console.log(`🔍 ${product.title} (ID: ${product.id})`);
      console.log(`   Reason: ${updateAnalysis.reason}`);
      console.log(`   Priority: ${updateAnalysis.priority}`);
      console.log(`   Details: ${updateAnalysis.details}\n`);
      
      // Räkna olika typer av uppdateringar
      switch (updateAnalysis.reason) {
        case "new_product":
          newProducts++;
          break;
        case "title_changed":
        case "vendor_changed":
          changedProducts++;
          break;
        case "outdated_description":
          outdatedProducts++;
          break;
        case "missing_description":
        case "poor_seo":
        case "generic_description":
          seoIssues++;
          break;
      }
    }
  }
  
  console.log(`📊 Analysis Summary:`);
  console.log(`   New products: ${newProducts}`);
  console.log(`   Changed products: ${changedProducts}`);
  console.log(`   Outdated descriptions: ${outdatedProducts}`);
  console.log(`   SEO issues: ${seoIssues}`);
  console.log(`   Total needing updates: ${productsToUpdate.length}\n`);
  
  // Sortera efter prioritet
  const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
  productsToUpdate.sort((a, b) => 
    priorityOrder[b.analysis.priority] - priorityOrder[a.analysis.priority]
  );
  
  // Uppdatera produkter
  if (productsToUpdate.length > 0) {
    console.log(`🚀 Starting updates for ${productsToUpdate.length} products...\n`);
    
    for (const { product, analysis } of productsToUpdate) {
      const task = limit(async () => {
        console.log(`🔄 Updating: ${product.title} (${analysis.reason})`);
        
        try {
          const currentHash = await getDescriptionHash(product.id);
          const content = await generateAllContent(
            product.title, 
            product.vendor
          );
          
          if (DRY) {
            console.log(`[DRY] Would update ${product.title}`);
            console.log(`[DRY] New description: ${content.detailedDescription?.substring(0, 100)}...`);
            totalUpdated++;
            return;
          }
          
          if (content.detailedDescription) {
            const safeHtml = sanitizeDescriptionHtml(content.detailedDescription);
            const newHash = crypto.createHash("sha256").update(safeHtml).digest("hex");

            // Skip if same hash already stored
            if (currentHash === newHash) {
              console.log(`[SKIP] ${product.title} (ID: ${product.id}) - Description not changed.`);
              totalUpdated++;
              return;
            }

            // Store new hash
            try {
              await upsertProductMetafield(product.id, "agent", "desc_hash", newHash, "single_line_text_field");
            } catch { /* ignore upsert failure for hash */ }

            await updateProductDescription(product.id, safeHtml);
            console.log(`[OK] Updated ${product.title}`);
            totalUpdated++;
          }
          
          // Spara meta-data
          if (content.metaDescription) {
            const metaData = {
              productId: product.id,
              title: product.title,
              metaDescription: content.metaDescription,
              seoDescription: content.seoDescription,
              searchAnalysis: content.searchAnalysis,
              updateReason: analysis.reason,
              updatedAt: new Date().toISOString()
            };
            
            const metaFile = `meta_descriptions/${product.id}.json`;
            if (!fs.existsSync('meta_descriptions')) {
              fs.mkdirSync('meta_descriptions');
            }
            fs.writeFileSync(metaFile, JSON.stringify(metaData, null, 2));

            // Push meta description to Shopify metafield for SEO (if desired by theme)
            try {
              await upsertProductMetafield(
                product.id,
                "global",
                "description_tag",
                content.metaDescription,
                "single_line_text_field"
              );
              // Also provide a concise SEO title tag variant (truncate ~60 chars)
              const titleTag = `${product.title}`.slice(0, 60);
              await upsertProductMetafield(
                product.id,
                "global",
                "title_tag",
                titleTag,
                "single_line_text_field"
              );
            } catch (e) {
              console.warn(`Metafield upsert failed for ${product.title}: ${e.message}`);
            }
          }
          
          // Paus mellan uppdateringar
          await new Promise(r => setTimeout(r, 1000));
          
        } catch (error) {
          console.error(`❌ Error updating ${product.title}:`, error.message);
        }
      });
      
      await task;
    }
  } else {
    console.log(`✅ All products are up to date!`);
  }
  
  // Spara ny snapshot
  saveProductSnapshot(allProducts);
  
  console.log(`\n🎉 Scheduled run complete!`);
  console.log(`📈 Final stats:`);
  console.log(`   Products scanned: ${totalScanned}`);
  console.log(`   Products updated: ${totalUpdated}`);
  console.log(`   New products: ${newProducts}`);
  console.log(`   Changed products: ${changedProducts}`);
  console.log(`   Outdated descriptions: ${outdatedProducts}`);
  console.log(`   SEO issues fixed: ${seoIssues}`);
  console.log(`\n⏰ Next scheduled run in ${CHECK_INTERVAL_HOURS} hours`);
}

// Kör schemalagd körning
scheduledRun().catch(err => {
  console.error("Fatal error in scheduled run:", err?.response?.data || err);
  process.exit(1);
});
