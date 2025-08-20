/**
 * Article Updater - Fixes existing bad articles on Outlecta.com
 * Detects and improves repetitive content in published articles
 */

import BlogPublisher from "./blogPublisher.js";
import ContentAnalyzer from "./contentAnalyzer.js";
import fs from "fs";
import path from "path";
import 'dotenv/config';

class ArticleUpdater {
  constructor() {
    this.publisher = new BlogPublisher();
    this.contentAnalyzer = new ContentAnalyzer();
    this.processedArticles = [];
    this.badArticlesFound = [];
  }

  async updateAllBadArticles() {
    console.log("🔍 Starting scan for bad articles on Outlecta.com...");
    
    try {
      // Get all published articles from Shopify
      const articles = await this.publisher.fetchAllArticles();
      console.log(`📄 Found ${articles.length} published articles to analyze`);

      let badArticlesCount = 0;
      let fixedArticlesCount = 0;

      for (const article of articles) {
        console.log(`\n🔍 Analyzing: ${article.title}`);
        
        // Analyze the article content for problems
        const analysis = await this.contentAnalyzer.analyzeContent(article.body_html, {
          title: article.title,
          keywords: this.extractKeywordsFromTitle(article.title)
        });

        if (analysis.needsRewrite) {
          badArticlesCount++;
          console.log(`❌ BAD ARTICLE FOUND: ${article.title}`);
          console.log(`   - Repetitions: ${analysis.repetitions.length}`);
          console.log(`   - Quality Issues: ${analysis.qualityIssues.length}`);
          console.log(`   - Uniqueness: ${(analysis.uniqueness * 100).toFixed(1)}%`);
          console.log(`   - Issues: ${analysis.issues.join(', ')}`);

          this.badArticlesFound.push({
            id: article.id,
            title: article.title,
            handle: article.handle,
            analysis: analysis,
            url: `https://www.outlecta.com/blogs/news/${article.handle}`
          });

          // Fix the article
          const shouldFix = await this.shouldFixArticle(article, analysis);
          if (shouldFix) {
            console.log(`🔧 Fixing article: ${article.title}`);
            const success = await this.fixArticle(article, analysis);
            if (success) {
              fixedArticlesCount++;
              console.log(`✅ Successfully fixed: ${article.title}`);
            } else {
              console.log(`❌ Failed to fix: ${article.title}`);
            }
          }
        } else {
          console.log(`✅ Good article: ${article.title}`);
        }
      }

      // Generate report
      await this.generateReport(badArticlesCount, fixedArticlesCount);

    } catch (error) {
      console.error("❌ Error updating articles:", error.message);
    }
  }

  async shouldFixArticle(article, analysis) {
    // Only fix articles with severe problems
    const hasCriticalIssues = analysis.qualityIssues.some(issue => issue.severity === 'critical');
    const hasExcessiveRepetitions = analysis.repetitions.length > 500;
    const hasVeryLowUniqueness = analysis.uniqueness < 0.3;

    return hasCriticalIssues || hasExcessiveRepetitions || hasVeryLowUniqueness;
  }

  async fixArticle(article, analysis) {
    try {
      console.log(`🔄 Rewriting content for: ${article.title}`);
      
      // Create blog idea from existing article
      const blogIdea = {
        title: article.title,
        keywords: this.extractKeywordsFromTitle(article.title),
        category: 'comparison', // Default category
        description: article.summary || 'Industrial technology article'
      };

      // Rewrite the content
      const improvedContent = await this.contentAnalyzer.rewriteContent(
        article.body_html, 
        blogIdea
      );

      // Update the article on Shopify
      const updateData = {
        article: {
          id: article.id,
          title: article.title,
          body_html: improvedContent,
          summary: article.summary,
          tags: article.tags,
          updated_at: new Date().toISOString()
        }
      };

      const success = await this.publisher.updateExistingArticle(article.id, updateData);
      
      if (success) {
        this.processedArticles.push({
          id: article.id,
          title: article.title,
          handle: article.handle,
          beforeAnalysis: analysis,
          status: 'fixed'
        });
        return true;
      }

      return false;

    } catch (error) {
      console.error(`❌ Error fixing article ${article.title}:`, error.message);
      return false;
    }
  }

  async debugBlogs() {
    console.log("🔍 Debugging: Checking what blogs exist...");
    
    try {
      const { requestWithRetry } = await import('./shopify.js');
      const url = `https://${process.env.SHOP_DOMAIN}/admin/api/2024-01/blogs.json`;
      console.log(`🔗 Blogs URL: ${url}`);
      
      const response = await requestWithRetry('get', url);
      const data = response?.data || response;
      
      if (data && data.blogs) {
        console.log(`📚 Found ${data.blogs.length} blogs:`);
        data.blogs.forEach(blog => {
          console.log(`   - ${blog.title} (ID: ${blog.id}, Handle: ${blog.handle})`);
        });
        return data.blogs;
      } else {
        console.log(`⚠️ No blogs found or unexpected structure`);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching blogs:", error.message);
      return [];
    }
  }

  extractKeywordsFromTitle(title) {
    // Extract keywords from title for content generation
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    return keywords.length > 0 ? keywords : ['industrial', 'automation'];
  }

  async generateReport(badArticlesCount, fixedArticlesCount) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBadArticles: badArticlesCount,
        totalFixedArticles: fixedArticlesCount,
        successRate: badArticlesCount > 0 ? ((fixedArticlesCount / badArticlesCount) * 100).toFixed(1) : 0
      },
      badArticlesFound: this.badArticlesFound,
      processedArticles: this.processedArticles
    };

    // Save report to file
    const reportPath = `article_update_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("📊 ARTICLE UPDATE REPORT");
    console.log("=".repeat(60));
    console.log(`📄 Total bad articles found: ${badArticlesCount}`);
    console.log(`🔧 Total articles fixed: ${fixedArticlesCount}`);
    console.log(`✅ Success rate: ${report.summary.successRate}%`);
    console.log(`📋 Full report saved: ${reportPath}`);

    if (this.badArticlesFound.length > 0) {
      console.log("\n🚨 BAD ARTICLES FOUND:");
      this.badArticlesFound.forEach(article => {
        console.log(`   • ${article.title}`);
        console.log(`     URL: ${article.url}`);
        console.log(`     Issues: ${article.analysis.issues.join(', ')}`);
      });
    }

    console.log("=".repeat(60));
    return report;
  }

  // Scan and list bad articles without fixing them
  async scanOnly() {
    console.log("🔍 SCAN ONLY MODE - Finding bad articles without fixing...");
    
    // Debug environment variables
    console.log(`🔧 SHOP_DOMAIN: ${process.env.SHOP_DOMAIN ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 SHOP_ACCESS_TOKEN: ${process.env.SHOP_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    
    try {
      // First, let's check what blogs exist
      await this.debugBlogs();
      
      const articles = await this.publisher.fetchAllArticles();
      console.log(`📄 Found ${articles.length} published articles to scan`);

      let badArticlesCount = 0;

      for (const article of articles) {
        console.log(`🔍 Scanning: ${article.title}`);
        
        const analysis = await this.contentAnalyzer.analyzeContent(article.body_html, {
          title: article.title,
          keywords: this.extractKeywordsFromTitle(article.title)
        });

        if (analysis.needsRewrite) {
          badArticlesCount++;
          console.log(`❌ BAD: ${article.title}`);
          console.log(`   Repetitions: ${analysis.repetitions.length}, Issues: ${analysis.issues.join(', ')}`);
          
          this.badArticlesFound.push({
            id: article.id,
            title: article.title,
            handle: article.handle,
            analysis: analysis,
            url: `https://www.outlecta.com/blogs/news/${article.handle}`
          });
        } else {
          console.log(`✅ GOOD: ${article.title}`);
        }
      }

      console.log(`\n📊 SCAN COMPLETE: Found ${badArticlesCount} bad articles out of ${articles.length} total`);
      return this.badArticlesFound;

    } catch (error) {
      console.error("❌ Error during scan:", error.message);
      return [];
    }
  }
}

// Command line interface
async function main() {
  console.log("🚀 Starting Article Updater...");
  
  const command = process.argv[2];
  const updater = new ArticleUpdater();

  try {
    switch (command) {
      case 'scan':
        console.log("🔍 Scanning for bad articles...");
        await updater.scanOnly();
        break;
        
      case 'fix':
        console.log("🔧 Fixing all bad articles...");
        await updater.updateAllBadArticles();
        break;
        
      default:
        console.log("Usage:");
        console.log("  node src/articleUpdater.js scan  # Scan for bad articles only");
        console.log("  node src/articleUpdater.js fix   # Find and fix bad articles");
        break;
    }
  } catch (error) {
    console.error("❌ Error in main:", error.message);
    console.error(error.stack);
  }
}

// Run if this file is executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('articleUpdater.js');
if (isMainModule) {
  main().catch(console.error);
}

export default ArticleUpdater;
