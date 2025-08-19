import BlogAnalyzer from "./blogAnalyzer.js";
import BlogGenerator from "./blogGenerator.js";
import fs from "fs";
import path from "path";

// Blog scheduler - automatically generates and publishes blog articles
class BlogScheduler {
  constructor() {
    this.analyzer = new BlogAnalyzer();
    this.generator = new BlogGenerator();
    this.blogHistoryFile = ".blog_history.json";
    this.lastRunFile = ".last_blog_run.json";
    this.blogOutputDir = "generated_blogs";
  }

  // Initialize blog scheduler
  async initialize() {
    console.log("🚀 Initializing Blog Scheduler...");
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.blogOutputDir)) {
      fs.mkdirSync(this.blogOutputDir);
      console.log(`📁 Created blog output directory: ${this.blogOutputDir}`);
    }
    
    // Load blog history
    this.blogHistory = this.loadBlogHistory();
    
    console.log("✅ Blog Scheduler initialized");
  }

  // Main scheduling function - runs weekly
  async runWeeklyBlogGeneration() {
    console.log("📅 Running weekly blog generation...");
    
    try {
      // Check if we should run this week
      if (!this.shouldRunThisWeek()) {
        console.log("⏭️ Blog generation not due this week");
        return;
      }
      
      // Analyze all products
      console.log("🔍 Analyzing products for blog ideas...");
      const analysis = await this.analyzer.analyzeAllProducts();
      
      // Get best blog idea
      const bestIdea = this.analyzer.getBestBlogIdea();
      console.log(`💡 Selected blog idea: ${bestIdea.title}`);
      
      // Check if we've already written about this topic
      if (this.hasWrittenAboutTopic(bestIdea)) {
        console.log("⚠️ Already wrote about this topic, selecting alternative...");
        const alternativeIdea = this.getAlternativeBlogIdea(bestIdea);
        if (alternativeIdea) {
          Object.assign(bestIdea, alternativeIdea);
        }
      }
      
      // Generate blog article
      console.log("📝 Generating blog article...");
      const article = await this.generator.generateBlogArticle(bestIdea);
      
      // Save article
      const savedArticle = await this.saveArticle(article);
      
      // Update history
      this.updateBlogHistory(savedArticle);
      
      // Mark as run this week
      this.markAsRunThisWeek();
      
      console.log("🎉 Weekly blog generation completed successfully!");
      console.log(`📄 Article saved: ${savedArticle.filename}`);
      console.log(`📊 Word count: ${article.wordCount} words`);
      
      return savedArticle;
      
    } catch (error) {
      console.error("❌ Error in weekly blog generation:", error.message);
      throw error;
    }
  }

  // Check if we should run this week
  shouldRunThisWeek() {
    const lastRun = this.loadLastRun();
    
    if (!lastRun) {
      return true; // First time running
    }
    
    const lastRunDate = new Date(lastRun.lastRun);
    const now = new Date();
    const daysSinceLastRun = (now - lastRunDate) / (1000 * 60 * 60 * 24);
    
    // Run if it's been 7+ days since last run
    return daysSinceLastRun >= 7;
  }

  // Check if we've already written about this topic
  hasWrittenAboutTopic(blogIdea) {
    const { keywords, category } = blogIdea;
    
    return this.blogHistory.some(article => {
      // Check if keywords overlap significantly
      const keywordOverlap = keywords.filter(keyword => 
        article.keywords.includes(keyword)
      ).length;
      
      // Check if same category
      const sameCategory = article.category === category;
      
      return keywordOverlap >= 2 || sameCategory;
    });
  }

  // Get alternative blog idea
  getAlternativeBlogIdea(originalIdea) {
    const allIdeas = this.analyzer.blogIdeas;
    const alternatives = allIdeas.filter(idea => 
      idea.title !== originalIdea.title && 
      !this.hasWrittenAboutTopic(idea)
    );
    
    if (alternatives.length === 0) {
      // Generate a fallback idea
      return {
        type: "general",
        title: "Industrial Measurement Solutions: Complete Guide",
        keywords: ["industrial", "measurement", "solutions", "guide"],
        category: "general",
        priority: "medium"
      };
    }
    
    // Return the first alternative
    return alternatives[0];
  }

  // Save article to file
  async saveArticle(article) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${this.sanitizeFilename(article.title)}.json`;
    const filepath = path.join(this.blogOutputDir, filename);
    
    const articleData = {
      ...article,
      filename,
      filepath,
      generatedAt: new Date().toISOString(),
      status: "generated"
    };
    
    fs.writeFileSync(filepath, JSON.stringify(articleData, null, 2));
    
    return articleData;
  }

  // Sanitize filename
  sanitizeFilename(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Load blog history
  loadBlogHistory() {
    if (fs.existsSync(this.blogHistoryFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.blogHistoryFile, 'utf8'));
      } catch (error) {
        console.warn("Could not load blog history, starting fresh");
      }
    }
    return [];
  }

  // Update blog history
  updateBlogHistory(article) {
    this.blogHistory.push({
      title: article.title,
      filename: article.filename,
      keywords: article.keywords,
      category: article.category,
      type: article.type,
      publishDate: article.publishDate,
      wordCount: article.wordCount
    });
    
    // Keep only last 52 articles (1 year)
    if (this.blogHistory.length > 52) {
      this.blogHistory = this.blogHistory.slice(-52);
    }
    
    fs.writeFileSync(this.blogHistoryFile, JSON.stringify(this.blogHistory, null, 2));
  }

  // Load last run info
  loadLastRun() {
    if (fs.existsSync(this.lastRunFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.lastRunFile, 'utf8'));
      } catch (error) {
        console.warn("Could not load last run info");
      }
    }
    return null;
  }

  // Mark as run this week
  markAsRunThisWeek() {
    const runInfo = {
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    fs.writeFileSync(this.lastRunFile, JSON.stringify(runInfo, null, 2));
  }

  // Get blog statistics
  getBlogStats() {
    const totalArticles = this.blogHistory.length;
    const totalWords = this.blogHistory.reduce((sum, article) => sum + (article.wordCount || 0), 0);
    const categories = [...new Set(this.blogHistory.map(article => article.category))];
    const types = [...new Set(this.blogHistory.map(article => article.type))];
    
    return {
      totalArticles,
      totalWords,
      averageWordsPerArticle: totalArticles > 0 ? Math.round(totalWords / totalArticles) : 0,
      categories,
      types,
      lastArticle: this.blogHistory.length > 0 ? this.blogHistory[this.blogHistory.length - 1] : null
    };
  }

  // Get recent articles
  getRecentArticles(limit = 5) {
    return this.blogHistory.slice(-limit).reverse();
  }

  // Force generate article (for testing)
  async forceGenerateArticle() {
    console.log("🔧 Force generating blog article...");
    
    try {
      // Analyze all products
      const analysis = await this.analyzer.analyzeAllProducts();
      
      // Get best blog idea
      const bestIdea = this.analyzer.getBestBlogIdea();
      console.log(`💡 Selected blog idea: ${bestIdea.title}`);
      
      // Generate blog article
      const article = await this.generator.generateBlogArticle(bestIdea);
      
      // Save article
      const savedArticle = await this.saveArticle(article);
      
      // Update history
      this.updateBlogHistory(savedArticle);
      
      console.log("🎉 Force blog generation completed!");
      console.log(`📄 Article saved: ${savedArticle.filename}`);
      
      return savedArticle;
      
    } catch (error) {
      console.error("❌ Error in force blog generation:", error.message);
      throw error;
    }
  }

  // Start continuous scheduling (for production)
  async startContinuousScheduling() {
    console.log("🔄 Starting continuous blog scheduling...");
    console.log("📅 Will check for new blog generation every day");
    
    await this.initialize();
    
    // Run immediately if needed
    await this.runWeeklyBlogGeneration();
    
    // Set up daily check
    setInterval(async () => {
      try {
        await this.runWeeklyBlogGeneration();
      } catch (error) {
        console.error("❌ Error in scheduled blog generation:", error.message);
      }
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }
}

export default BlogScheduler;
