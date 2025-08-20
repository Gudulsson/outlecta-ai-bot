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
    this.blogHistory = []; // Initialize empty array
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
    
    // Initialize history from existing articles if empty
    if (this.blogHistory.length === 0) {
      this.initializeHistoryFromExistingArticles();
    }
    
    console.log("✅ Blog Scheduler initialized");
  }

  // Initialize blog history from existing generated articles
  initializeHistoryFromExistingArticles() {
    console.log("📚 Initializing blog history from existing articles...");
    
    if (!fs.existsSync(this.blogOutputDir)) {
      return;
    }
    
    const files = fs.readdirSync(this.blogOutputDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      try {
        const filepath = path.join(this.blogOutputDir, file);
        const articleData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        
        // Add to history if not already present
        const exists = this.blogHistory.some(article => 
          article.title === articleData.title || 
          article.filename === articleData.filename
        );
        
        if (!exists) {
          this.blogHistory.push({
            title: articleData.title,
            filename: articleData.filename,
            keywords: articleData.keywords || [],
            category: articleData.category,
            type: articleData.type,
            publishDate: articleData.publishDate,
            wordCount: articleData.wordCount
          });
        }
      } catch (error) {
        console.warn(`Could not load article from ${file}:`, error.message);
      }
    }
    
    // Save updated history
    if (this.blogHistory.length > 0) {
      fs.writeFileSync(this.blogHistoryFile, JSON.stringify(this.blogHistory, null, 2));
      console.log(`📚 Loaded ${this.blogHistory.length} existing articles into blog history`);
    }
  }

  // Main scheduling function - runs twice per week
  async runBiWeeklyBlogGeneration() {
    console.log("📅 Running bi-weekly blog generation...");
    
    try {
      // Check if we should run today
      if (!this.shouldRunToday()) {
        console.log("⏭️ Blog generation not due today");
        return;
      }
      
      // Analyze all products
      console.log("🔍 Analyzing products for blog ideas...");
      const analysis = await this.analyzer.analyzeAllProducts();
      
      // Get best blog idea
      const bestIdea = this.analyzer.getBestBlogIdea(this.blogHistory);
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
      
      // Mark as run today
      this.markAsRunToday();
      
      console.log("🎉 Bi-weekly blog generation completed successfully!");
      console.log(`📄 Article saved: ${savedArticle.filename}`);
      console.log(`📊 Word count: ${article.wordCount} words`);
      
      return savedArticle;
      
    } catch (error) {
      console.error("❌ Error in bi-weekly blog generation:", error.message);
      throw error;
    }
  }

  // Check if we should run today (Monday and Thursday)
  shouldRunToday() {
    const lastRun = this.loadLastRun();
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Blog publishing days: Monday (1) and Thursday (4)
    const blogDays = [1, 4];
    
    if (!lastRun) {
      console.log("🆕 First time running - will generate article");
      return true; // First time running
    }
    
    const lastRunDate = new Date(lastRun.lastRun);
    const daysSinceLastRun = Math.floor((now - lastRunDate) / (1000 * 60 * 60 * 24));
    
    // If it's a scheduled blog day and it's been at least 3 days since last run
    if (blogDays.includes(today) && daysSinceLastRun >= 3) {
      console.log(`📅 Scheduled blog day (${daysSinceLastRun} days since last run)`);
      return true;
    }
    
    // If more than 5 days since last run, generate regardless of day
    if (daysSinceLastRun > 5) {
      console.log(`⚠️ Missed scheduled runs (${daysSinceLastRun} days since last run) - generating now`);
      return true;
    }
    
    return false;
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
    
    // Keep only last 104 articles (1 year with 2 posts per week)
    if (this.blogHistory.length > 104) {
      this.blogHistory = this.blogHistory.slice(-104);
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

  // Mark as run today
  markAsRunToday() {
    const now = new Date();
    const today = now.getDay();
    
    // Calculate next blog day
    let nextBlogDay;
    if (today === 1) { // Monday
      nextBlogDay = 4; // Thursday
    } else if (today === 4) { // Thursday
      nextBlogDay = 8; // Next Monday (4 + 4 days)
    } else {
      // Fallback - next Monday
      nextBlogDay = 7 - today + 1;
    }
    
    const nextRun = new Date(Date.now() + nextBlogDay * 24 * 60 * 60 * 1000);
    
    const runInfo = {
      lastRun: now.toISOString(),
      nextRun: nextRun.toISOString(),
      schedule: "Twice per week (Monday & Thursday)"
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
      const bestIdea = this.analyzer.getBestBlogIdea(this.blogHistory);
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
    await this.runBiWeeklyBlogGeneration();
    
    // Set up daily check
    setInterval(async () => {
      try {
        await this.runBiWeeklyBlogGeneration();
      } catch (error) {
        console.error("❌ Error in scheduled blog generation:", error.message);
      }
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }
}

export default BlogScheduler;
