#!/usr/bin/env node

import BlogScheduler from './src/blogScheduler.js';
import BlogPublisher from './src/blogPublisher.js';

/**
 * Lokal schemaläggare för utveckling
 * Kör kontinuerlig schemaläggning med daglig kontroll
 */

console.log("🚀 Starting Outlecta Blog Generator - Local Scheduler");
console.log("📅 Will run bi-weekly on Monday and Thursday");
console.log("🔄 Checking daily for missed runs");

const scheduler = new BlogScheduler();
const publisher = new BlogPublisher();

// Huvudfunktion
async function runLocalScheduler() {
  try {
    // Initialisera
    await scheduler.initialize();
    
    // Kontrollera om vi ska köra idag
    if (scheduler.shouldRunToday()) {
      console.log("\n🎯 Blog generation needed today!");
      
      // Kör bi-weekly generering
      const article = await scheduler.runBiWeeklyBlogGeneration();
      
      if (article) {
        console.log("\n📤 Publishing to Shopify...");
        
        // Publicera om flaggan är satt
        const shouldPublish = process.env.PUBLISH_TO_SHOPIFY === 'true';
        
        if (shouldPublish) {
          try {
            const publishedArticle = await publisher.publishArticle(article);
            console.log(`✅ Article published to Shopify: ${publishedArticle.shopifyId}`);
          } catch (error) {
            console.log(`⚠️ Could not publish to Shopify: ${error.message}`);
            console.log("📄 Article saved locally instead");
          }
        } else {
          console.log("⏭️ Skipping Shopify publication (PUBLISH_TO_SHOPIFY not set to 'true')");
        }
        
        console.log("\n🎉 Blog generation completed successfully!");
      } else {
        console.log("\n⏭️ No article generated today");
      }
    } else {
      console.log("\n⏭️ No blog generation needed today");
      
      // Visa nästa schemalagda körning
      const lastRun = scheduler.loadLastRun();
      if (lastRun && lastRun.nextRun) {
        const nextRun = new Date(lastRun.nextRun);
        console.log(`📅 Next scheduled run: ${nextRun.toLocaleString('sv-SE')}`);
      }
    }
    
    // Visa statistik
    const stats = scheduler.getBlogStats();
    console.log("\n📊 Blog Statistics:");
    console.log(`📄 Total articles: ${stats.totalArticles}`);
    console.log(`📝 Total words: ${stats.totalWords.toLocaleString()}`);
    console.log(`📊 Average words per article: ${stats.averageWordsPerArticle}`);
    console.log(`🏷️ Categories: ${stats.categories.join(', ')}`);
    
    if (stats.lastArticle) {
      console.log(`📰 Last article: ${stats.lastArticle.title}`);
    }
    
  } catch (error) {
    console.error("\n❌ Error in local scheduler:", error.message);
    process.exit(1);
  }
}

// Kör kontinuerlig schemaläggning om --continuous flagga används
if (process.argv.includes('--continuous')) {
  console.log("\n🔄 Starting continuous mode (checking every 24 hours)");
  
  // Kör nu
  await runLocalScheduler();
  
  // Sedan varje 24:e timme
  setInterval(async () => {
    console.log("\n⏰ Running scheduled check...");
    await runLocalScheduler();
  }, 24 * 60 * 60 * 1000);
  
} else {
  // Kör en gång
  await runLocalScheduler();
}
