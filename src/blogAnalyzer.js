import { listProducts } from "./shopify.js";
import { generateAllContent } from "./webSearchAI.js";
import BlogCacheDB from "./blogDb.js";

// Blog analyzer - extracts keywords and topics from all products
class BlogAnalyzer {
  constructor() {
    this.productData = [];
    this.keywordFrequency = {};
    this.categoryStats = {};
    this.trendingTopics = [];
    this.blogIdeas = [];
    this.currentYear = new Date().getFullYear();
    this.db = new BlogCacheDB();
  }

  // Analyze all products to extract keywords and trends
  async analyzeAllProducts() {
    console.log("🔍 Analyzing all products for blog content ideas...");
    
    let pageInfo = null;
    let totalProducts = 0;
    
    // Collect all products
    while (true) {
      try {
        const { products, nextPageInfo } = await listProducts({
          limit: 100,
          pageInfo
        });
        
        for (const product of products) {
          await this.analyzeProduct(product);
          totalProducts++;
        }
        
        if (!nextPageInfo) break;
        pageInfo = nextPageInfo;
      } catch (error) {
        console.error("Error fetching products:", error.message);
        break;
      }
    }
    
    console.log(`📊 Analyzed ${totalProducts} products`);
    
    // Generate insights
    this.generateKeywordInsights();
    this.generateCategoryInsights();
    this.generateBlogIdeas();
    
    return {
      totalProducts,
      keywordFrequency: this.keywordFrequency,
      categoryStats: this.categoryStats,
      trendingTopics: this.trendingTopics,
      blogIdeas: this.blogIdeas
    };
  }

  // Analyze individual product
  async analyzeProduct(product) {
    const { title, vendor, body_html, tags, product_type } = product;
    const productId = product.id;
    // Simple content hash to detect change
    const contentHash = this.computeHash(`${title}|${vendor}|${product_type}|${(body_html||'').slice(0, 500)}`);
    const cached = this.db.getProductById(productId);
    const cachedAnalysis = this.db.getAnalysis(productId);
    
    let aiAnalysis = cachedAnalysis?.analysis;
    const isChanged = !cached || cached.last_hash !== contentHash;
    
    if (isChanged || !cachedAnalysis) {
      aiAnalysis = await generateAllContent(title, vendor);
      this.db.saveProduct(product, contentHash);
      this.db.saveAnalysis(productId, aiAnalysis || {});
    }
    
    // Extract keywords from title
    const titleKeywords = this.extractKeywords(title);
    
    // Extract keywords from description
    const descKeywords = this.extractKeywords(body_html || "");
    
    // Get AI analysis for better categorization
    // Store product data
    this.productData.push({
      id: productId,
      title,
      vendor,
      category: aiAnalysis?.analysis?.complexity || cachedAnalysis?.category || "unknown",
      keywords: [...titleKeywords, ...descKeywords],
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      productType: product_type
    });
    
    // Update keyword frequency
    [...titleKeywords, ...descKeywords].forEach(keyword => {
      this.keywordFrequency[keyword] = (this.keywordFrequency[keyword] || 0) + 1;
    });
  }

  // Simple non-crypto hash
  computeHash(input) {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = Math.imul(31, h) + input.charCodeAt(i) | 0;
    }
    return String(h >>> 0);
  }

  // Extract keywords from text
  extractKeywords(text) {
    if (!text) return [];
    
    // Clean text
    const cleanText = text.toLowerCase()
      .replace(/<[^>]*>/g, '') // Remove HTML
      .replace(/[^\w\s-]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Split into words
    const words = cleanText.split(' ');
    
    // Filter relevant keywords (3+ chars, not common words)
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'this', 'that', 'these', 'those', 'a', 'an', 'as', 'from', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off',
      'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
      'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'can', 'just', 'now', 'also', 'well', 'very'
    ]);
    
    return words
      .filter(word => word.length >= 3 && !commonWords.has(word))
      .filter(word => /^[a-z]+$/.test(word)) // Only letters
      .slice(0, 10); // Limit to top 10 keywords per product
  }

  // Generate keyword insights
  generateKeywordInsights() {
    // Sort keywords by frequency
    const sortedKeywords = Object.entries(this.keywordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50); // Top 50 keywords
    
    console.log("🎯 Top keywords found:");
    sortedKeywords.slice(0, 10).forEach(([keyword, count]) => {
      console.log(`   ${keyword}: ${count} products`);
    });
    
    this.trendingTopics = sortedKeywords
      .filter(([, count]) => count >= 3) // Keywords appearing in 3+ products
      .map(([keyword]) => keyword);
  }

  // Generate category insights
  generateCategoryInsights() {
    const categories = {};
    
    this.productData.forEach(product => {
      const category = product.category;
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          products: [],
          keywords: new Set()
        };
      }
      
      categories[category].count++;
      categories[category].products.push(product.title);
      product.keywords.forEach(keyword => categories[category].keywords.add(keyword));
    });
    
    this.categoryStats = Object.entries(categories).map(([category, data]) => ({
      category,
      count: data.count,
      products: data.products.slice(0, 5), // Top 5 products
      keywords: Array.from(data.keywords).slice(0, 10) // Top 10 keywords
    }));
    
    console.log("📊 Category analysis:");
    this.categoryStats.forEach(({ category, count, keywords }) => {
      console.log(`   ${category}: ${count} products, keywords: ${keywords.slice(0, 5).join(', ')}`);
    });
  }

  // Generate blog ideas based on analysis
  generateBlogIdeas() {
    const ideas = [];

    // 1. How-to guides based on popular keywords (non-promotional)
    const howToKeywords = this.trendingTopics.filter(keyword => 
      keyword.includes('gauge') || keyword.includes('sensor') || keyword.includes('cell')
    );
    
    howToKeywords.slice(0, 3).forEach(keyword => {
      ideas.push({
        type: "how-to",
        title: `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Selection and Implementation in ${this.currentYear}`,
        keywords: [keyword, 'selection', 'guide', 'industrial', 'implementation', this.currentYear.toString()],
        category: "guide",
        priority: "medium"
      });
    });
    
    // 2. Industry trend articles (neutral, informative)
    const industryKeywords = this.trendingTopics.filter(keyword =>
      keyword.includes('industrial') || keyword.includes('automation') || keyword.includes('measurement')
    );
    
    if (industryKeywords.length > 0) {
      ideas.push({
        type: "trend",
        title: `Industrial Automation Trends ${this.currentYear}: A Comprehensive Analysis of Emerging Technologies`,
        keywords: [...industryKeywords.slice(0, 5), this.currentYear.toString(), 'trends', 'analysis'],
        category: "industry",
        priority: "high"
      });
    }
    
    // 3. Technical deep-dive articles (concepts, not products)
    const technicalKeywords = this.trendingTopics.filter(keyword =>
      keyword.includes('strain') || keyword.includes('load') || keyword.includes('data')
    );
    
    technicalKeywords.slice(0, 2).forEach(keyword => {
      ideas.push({
        type: "technical",
        title: `Understanding ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Technology: Principles, Applications, and Best Practices for ${this.currentYear}`,
        keywords: [keyword, 'technology', 'technical', 'industrial', 'principles', this.currentYear.toString()],
        category: "technical",
        priority: "medium"
      });
    });

    // 4. Explainer articles (non-promotional education)
    this.trendingTopics.slice(0, 5).forEach(keyword => {
      ideas.push({
        type: "explainer",
        title: `What is ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}? A Complete Guide to Industrial Applications in ${this.currentYear}`,
        keywords: [keyword, 'principles', 'applications', 'best practices', 'industrial', this.currentYear.toString()],
        category: "explainer",
        priority: "high"
      });
    });

    // 5. Beginner guides (entry-level, broad interest)
    this.trendingTopics.slice(0, 3).forEach(keyword => {
      ideas.push({
        type: "beginner",
        title: `Getting Started with ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Fundamentals for Industrial Engineers in ${this.currentYear}`,
        keywords: [keyword, 'beginner', 'guide', 'fundamentals', 'engineering', this.currentYear.toString()],
        category: "beginner",
        priority: "medium"
      });
    });

    // 6. Current year specific articles
    ideas.push({
      type: "trend",
      title: `Top Industrial Technology Innovations in ${this.currentYear}: What Engineers Need to Know`,
      keywords: ['industrial', 'technology', 'innovations', this.currentYear.toString(), 'engineering'],
      category: "innovation",
      priority: "high"
    });

    ideas.push({
      type: "technical",
      title: `Industrial Measurement Standards and Best Practices for ${this.currentYear}`,
      keywords: ['measurement', 'standards', 'best practices', this.currentYear.toString(), 'industrial'],
      category: "standards",
      priority: "medium"
    });
    
    this.blogIdeas = ideas;
    
    console.log("💡 Generated blog ideas:");
    ideas.slice(0, 5).forEach((idea, index) => {
      console.log(`   ${index + 1}. ${idea.title} (${idea.type})`);
    });
  }

  // Get trending keywords
  get trendingKeywords() {
    return this.trendingTopics;
  }

  // Get best blog idea for this week
  getBestBlogIdea(blogHistory = []) {
    // Prefer neutral, educational content types
    const preferenceOrder = ["trend", "explainer", "technical", "how-to", "beginner"]; 
    
    // Filter out ideas that have already been written about
    const availableIdeas = this.blogIdeas.filter(idea => {
      // Check if we've already written about this topic
      return !blogHistory.some(published => {
        // Check if keywords overlap significantly
        const keywordOverlap = idea.keywords.filter(keyword => 
          published.keywords && published.keywords.includes(keyword)
        ).length;
        
        // Check if same category and similar title
        const sameCategory = published.category === idea.category;
        const similarTitle = published.title && 
          (published.title.includes(idea.keywords[0]) || 
           idea.title.includes(published.keywords?.[0] || ''));
        
        return keywordOverlap >= 2 || (sameCategory && similarTitle);
      });
    });
    
    // If no available ideas, generate some fallback ideas
    if (availableIdeas.length === 0) {
      console.log("⚠️ All blog ideas have been used, generating fallback ideas...");
      return this.generateFallbackIdea(blogHistory);
    }
    
    // Try to find the best available idea
    for (const type of preferenceOrder) {
      const candidates = availableIdeas.filter(idea => idea.type === type)
        .sort((a, b) => (a.priority === 'high' ? -1 : 1));
      if (candidates.length > 0) return candidates[0];
    }
    
    // Fallback to first available idea
    return availableIdeas[0];
  }

  // Generate fallback idea when all regular ideas are used
  generateFallbackIdea(blogHistory) {
    const currentYear = new Date().getFullYear();
    const month = new Date().toLocaleString('en-US', { month: 'long' });
    
    // Generate ideas based on what hasn't been covered
    const fallbackIdeas = [
      {
        type: "trend",
        title: `${month} ${currentYear} Industrial Technology Update: Latest Developments and Insights`,
        keywords: ['industrial', 'technology', 'developments', month.toLowerCase(), currentYear.toString()],
        category: "monthly-update",
        priority: "high"
      },
      {
        type: "explainer",
        title: `Essential Industrial Measurement Tools: A Comprehensive Overview for ${currentYear}`,
        keywords: ['industrial', 'measurement', 'tools', 'overview', currentYear.toString()],
        category: "tools-overview",
        priority: "high"
      },
      {
        type: "technical",
        title: `Advanced Industrial Automation Solutions: Technical Deep Dive for ${currentYear}`,
        keywords: ['industrial', 'automation', 'solutions', 'technical', currentYear.toString()],
        category: "automation",
        priority: "medium"
      },
      {
        type: "how-to",
        title: `Optimizing Industrial Processes: Best Practices and Implementation Guide for ${currentYear}`,
        keywords: ['industrial', 'processes', 'optimization', 'best practices', currentYear.toString()],
        category: "optimization",
        priority: "medium"
      }
    ];
    
    // Filter out fallback ideas that have already been used
    const availableFallbacks = fallbackIdeas.filter(idea => {
      return !blogHistory.some(published => {
        const keywordOverlap = idea.keywords.filter(keyword => 
          published.keywords && published.keywords.includes(keyword)
        ).length;
        return keywordOverlap >= 2;
      });
    });
    
    return availableFallbacks.length > 0 ? availableFallbacks[0] : fallbackIdeas[0];
  }
}

export default BlogAnalyzer;
