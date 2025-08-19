import BlogAnalyzer from "./blogAnalyzer.js";
import BlogGenerator from "./blogGenerator.js";
import BlogScheduler from "./blogScheduler.js";
import BlogPublisher from "./blogPublisher.js";
import BlogCacheDB from "./blogDb.js";
import dotenv from "dotenv";

dotenv.config();

// Main blog generation runner
class BlogRunner {
  constructor() {
    this.analyzer = new BlogAnalyzer();
    this.generator = new BlogGenerator();
    this.scheduler = new BlogScheduler();
    this.publisher = new BlogPublisher();
  }

  // Run complete blog generation and publishing
  async runCompleteBlogGeneration() {
    console.log("🚀 Starting complete blog generation process...");
    
    try {
      // Step 1: Analyze products
      console.log("\n📊 Step 1: Analyzing products...");
      const analysis = await this.analyzer.analyzeAllProducts();
      console.log(`✅ Analyzed ${analysis.totalProducts} products`);
      console.log(`🎯 Found ${analysis.blogIdeas.length} blog ideas`);
      
      // Step 2: Get best blog idea
      console.log("\n💡 Step 2: Selecting best blog idea...");
      const bestIdea = this.analyzer.getBestBlogIdea();
      console.log(`✅ Selected: ${bestIdea.title}`);
      console.log(`📝 Type: ${bestIdea.type}, Category: ${bestIdea.category}`);
      
      // Step 3: Generate article
      console.log("\n📝 Step 3: Generating blog article...");
      const article = await this.generator.generateBlogArticle(bestIdea);
      console.log(`✅ Generated article: ${article.title}`);
      console.log(`📊 Word count: ${article.wordCount} words`);
      console.log(`🏷️ Tags: ${article.tags.join(', ')}`);
      
      // Step 4: Save article
      console.log("\n💾 Step 4: Saving article...");
      const savedArticle = await this.scheduler.saveArticle(article);
      console.log(`✅ Article saved: ${savedArticle.filename}`);
      
      // Step 5: Publish to Shopify (optional)
      const shouldPublish = process.env.PUBLISH_TO_SHOPIFY === 'true';
      if (shouldPublish) {
        console.log("\n📤 Step 5: Publishing to Shopify...");
        const publishedArticle = await this.publisher.publishArticle(savedArticle);
        console.log(`✅ Article published to Shopify!`);
        console.log(`🔗 Shopify ID: ${publishedArticle.shopifyId}`);
      } else {
        console.log("\n⏭️ Step 5: Skipping Shopify publication (PUBLISH_TO_SHOPIFY not set to 'true')");
      }
      
      console.log("\n🎉 Complete blog generation process finished successfully!");
      
      return {
        analysis,
        idea: bestIdea,
        article: savedArticle,
        published: shouldPublish
      };
      
    } catch (error) {
      console.error("❌ Error in complete blog generation:", error.message);
      throw error;
    }
  }

  // Run only analysis
  async runAnalysis() {
    console.log("🔍 Running product analysis...");
    
    try {
      const analysis = await this.analyzer.analyzeAllProducts();
      
      console.log("\n📊 Analysis Results:");
      console.log(`📦 Total products: ${analysis.totalProducts}`);
      console.log(`🎯 Trending keywords: ${analysis.trendingTopics.slice(0, 10).join(', ')}`);
      console.log(`💡 Blog ideas generated: ${analysis.blogIdeas.length}`);
      
      console.log("\n💡 Top Blog Ideas:");
      analysis.blogIdeas.slice(0, 5).forEach((idea, index) => {
        console.log(`   ${index + 1}. ${idea.title} (${idea.type})`);
      });
      
      return analysis;
      
    } catch (error) {
      console.error("❌ Error in analysis:", error.message);
      throw error;
    }
  }

  // Generate article from specific idea
  async generateFromIdea(ideaIndex = 0) {
    console.log(`📝 Generating article from idea ${ideaIndex}...`);
    
    try {
      // Analyze products first
      const analysis = await this.analyzer.analyzeAllProducts();
      
      if (ideaIndex >= analysis.blogIdeas.length) {
        throw new Error(`Idea index ${ideaIndex} out of range. Only ${analysis.blogIdeas.length} ideas available.`);
      }
      
      const selectedIdea = analysis.blogIdeas[ideaIndex];
      console.log(`✅ Selected idea: ${selectedIdea.title}`);
      
      // Generate article
      const article = await this.generator.generateBlogArticle(selectedIdea);
      
      // Save article
      const savedArticle = await this.scheduler.saveArticle(article);
      
      console.log(`✅ Article generated and saved: ${savedArticle.filename}`);
      
      return savedArticle;
      
    } catch (error) {
      console.error("❌ Error generating from idea:", error.message);
      throw error;
    }
  }

  // Run weekly scheduling
  async runWeeklyScheduling() {
    console.log("📅 Running weekly blog scheduling...");
    
    try {
      await this.scheduler.initialize();
      const result = await this.scheduler.runWeeklyBlogGeneration();
      
      if (result) {
        console.log(`✅ Weekly blog generated: ${result.title}`);
        
        // Optionally publish
        const shouldPublish = process.env.PUBLISH_TO_SHOPIFY === 'true';
        if (shouldPublish) {
          console.log("📤 Publishing to Shopify...");
          await this.publisher.publishArticle(result);
        }
      } else {
        console.log("⏭️ No blog generated this week (not due yet)");
      }
      
      return result;
      
    } catch (error) {
      console.error("❌ Error in weekly scheduling:", error.message);
      throw error;
    }
  }

  // Force generate and publish
  async forceGenerateAndPublish() {
    console.log("🔧 Force generating and publishing blog article...");
    
    try {
      // Force generate
      const article = await this.scheduler.forceGenerateArticle();
      
      // Publish
      const shouldPublish = process.env.PUBLISH_TO_SHOPIFY === 'true';
      if (shouldPublish) {
        const publishedArticle = await this.publisher.publishArticle(article);
        console.log(`✅ Article published to Shopify: ${publishedArticle.shopifyId}`);
        return publishedArticle;
      } else {
        console.log("⏭️ Skipping publication (PUBLISH_TO_SHOPIFY not set to 'true')");
        return article;
      }
      
    } catch (error) {
      console.error("❌ Error in force generate and publish:", error.message);
      throw error;
    }
  }

  // Get blog statistics
  async getStats() {
    console.log("📊 Getting blog statistics...");
    
    try {
      const localStats = this.scheduler.getBlogStats();
      const shopifyStats = await this.publisher.getBlogStats();

      // Read cached metrics if available
      const db = new BlogCacheDB();
      const topicStats = db.getMetric('topic_stats');
      
      console.log("\n📊 Local Blog Statistics:");
      console.log(`📄 Total articles generated: ${localStats.totalArticles}`);
      console.log(`📝 Total words written: ${localStats.totalWords}`);
      console.log(`📊 Average words per article: ${localStats.averageWordsPerArticle}`);
      console.log(`🏷️ Categories: ${localStats.categories.join(', ')}`);
      
      if (topicStats) {
        console.log("\n🗂️ Cached Topic Stats:");
        console.log(topicStats);
      }
      
      if (shopifyStats) {
        console.log("\n📊 Shopify Blog Statistics:");
        console.log(`📝 Blog: ${shopifyStats.blogTitle}`);
        console.log(`📄 Total published articles: ${shopifyStats.totalArticles}`);
        console.log(`🔗 Blog URL: ${shopifyStats.blogUrl}`);
      }
      
      return { local: localStats, shopify: shopifyStats, cached: topicStats };
      
    } catch (error) {
      console.error("❌ Error getting stats:", error.message);
      throw error;
    }
  }

  // Publish all unpublished articles
  async publishAllUnpublished() {
    console.log("📤 Publishing all unpublished articles...");
    
    try {
      const publishedArticles = await this.publisher.publishAllUnpublished();
      
      console.log(`✅ Published ${publishedArticles.length} articles`);
      
      return publishedArticles;
      
    } catch (error) {
      console.error("❌ Error publishing unpublished articles:", error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Blog Runner...");
  console.log("Arguments:", process.argv);
  
  const runner = new BlogRunner();
  
  const command = process.argv[2] || 'complete';
  console.log("Command:", command);
  
  try {
    switch (command) {
      case 'complete':
        await runner.runCompleteBlogGeneration();
        break;
        
      case 'analysis':
        await runner.runAnalysis();
        break;
        
      case 'generate [index]':
        const ideaIndex = parseInt(process.argv[3]) || 0;
        await runner.generateFromIdea(ideaIndex);
        break;
        
      case 'weekly':
        await runner.runWeeklyScheduling();
        break;
        
      case 'force':
        await runner.forceGenerateAndPublish();
        break;
        
      case 'stats':
        await runner.getStats();
        break;
        
      case 'publish':
        await runner.publishAllUnpublished();
        break;
        
      default:
        console.log("Usage: node runBlogGenerator.js [command]");
        console.log("Commands:");
        console.log("  complete  - Run complete generation and publishing");
        console.log("  analysis  - Run only product analysis");
        console.log("  generate [index] - Generate article from specific idea");
        console.log("  weekly    - Run weekly scheduling");
        console.log("  force     - Force generate and publish");
        console.log("  stats     - Get blog statistics");
        console.log("  publish   - Publish all unpublished articles");
        break;
    }
    
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default BlogRunner;
