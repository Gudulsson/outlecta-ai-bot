import { generateAllContent } from "./aiProductAgent.js";
import dotenv from "dotenv";
dotenv.config();
import { listProducts, updateProductDescription } from "./shopify.js";
import pLimit from "p-limit";
import fs from "fs";

const {
  PAGE_SIZE = "100",
  DRY_RUN = "true",
  RESUME_FILE = ".advanced_ai_resume.json"
} = process.env;

const limit = pLimit(1); // Sänk till 1 för AI-generering
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

    const task = limit(async () => {
      // Använd första varianten som fallback
      const variantTitle = variants[0]?.title || null;

      console.log(`\n🚀 Processing: ${title}`);
      
      try {
        const content = await generateAllContent(title, variantTitle, vendor);
        
        if (DRY) {
          console.log(`[DRY] SEO Description (${content.seoDescription?.length || 0} chars):`);
          console.log(`"${content.seoDescription}"`);
          console.log(`\n[DRY] Detailed Description (${content.detailedDescription?.length || 0} chars):`);
          console.log(`"${content.detailedDescription}"`);
          console.log(`\n[DRY] Meta Description (${content.metaDescription?.length || 0} chars):`);
          console.log(`"${content.metaDescription}"`);
          changed++;
          return;
        }

        // Uppdatera produktbeskrivning med den detaljerade versionen
        if (content.detailedDescription) {
          await updateProductDescription(productId, content.detailedDescription);
          console.log(`[OK] Updated detailed description for product ${productId}`);
        }
        
        // Här kan du också spara meta-beskrivningen till en separat fil eller databas
        if (content.metaDescription) {
          const metaData = {
            productId,
            title,
            metaDescription: content.metaDescription,
            seoDescription: content.seoDescription,
            searchAnalysis: content.searchAnalysis
          };
          
          // Spara till fil för senare användning
          const metaFile = `meta_descriptions/${productId}.json`;
          if (!fs.existsSync('meta_descriptions')) {
            fs.mkdirSync('meta_descriptions');
          }
          fs.writeFileSync(metaFile, JSON.stringify(metaData, null, 2));
        }
        
        changed++;
        
        // Längre paus för AI-generering
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${title}:`, error.message);
      }
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

  console.log(`🤖 Starting Advanced AI Product Agent...`);
  console.log(`🔧 DRY RUN: ${DRY}`);
  console.log(`📂 Resume from: ${pageInfo ? 'previous session' : 'beginning'}`);
  console.log(`⚡ Features: Search Analysis, SEO Optimization, Competitor Analysis\n`);

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

    console.log(`\n📊 Batch Summary:`);
    console.log(`   Scanned: +${scanned}, Changed: +${changed}`);
    console.log(`   Total scanned: ${totalScanned}, total changed: ${totalChanged}`);

    if (!nextPageInfo) break;
  }

  console.log(`\n🎉 ${DRY ? "Dry-run complete." : "Advanced AI update complete."}`);
  console.log(`📈 Final stats: ${totalScanned} products analyzed, ${totalChanged} descriptions generated.`);
  console.log(`💡 Check the 'meta_descriptions' folder for SEO metadata.`);
}

main().catch(err => {
  console.error("Fatal:", err?.response?.data || err);
  process.exit(1);
});
