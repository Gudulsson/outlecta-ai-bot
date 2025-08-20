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

  // Generate VASTLY diverse blog ideas based on products
  generateBlogIdeas() {
    const ideas = [];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[new Date().getMonth()];
    const randomId = Date.now(); // Unique identifier
    
    // 1. CASE STUDY articles (real-world applications)
    const caseStudyTopics = [
      { industry: 'Automotive Manufacturing', challenge: 'Quality Control Optimization', solution: 'Advanced Measurement Systems' },
      { industry: 'Aerospace Engineering', challenge: 'Precision Testing Standards', solution: 'High-Accuracy Load Cells' },
      { industry: 'Renewable Energy', challenge: 'Structural Monitoring', solution: 'Strain Gauge Networks' },
      { industry: 'Food Processing', challenge: 'Safety Compliance', solution: 'Industrial Automation' },
      { industry: 'Oil & Gas', challenge: 'Pipeline Integrity', solution: 'Pressure Monitoring Systems' },
      { industry: 'Construction', challenge: 'Structural Health Assessment', solution: 'Wireless Sensor Networks' },
      { industry: 'Marine Engineering', challenge: 'Corrosion Monitoring', solution: 'Environmental Sensors' }
    ];
    
    caseStudyTopics.slice(0, 3).forEach((topic, index) => {
      ideas.push({
        type: "case-study",
        title: `Case Study: How ${topic.industry} Solved ${topic.challenge} with ${topic.solution}`,
        keywords: [topic.industry.toLowerCase(), topic.challenge.toLowerCase(), topic.solution.toLowerCase(), 'case study', 'real world'],
        category: `case-study-${index}`,
        priority: "high",
        unique: `case-${randomId}-${index}`
      });
    });
    
    // 2. COMPARISON articles (technology vs technology)
    const comparisonPairs = [
      { tech1: 'Digital Load Cells', tech2: 'Analog Load Cells', context: 'Modern Manufacturing' },
      { tech1: 'Wireless Sensors', tech2: 'Wired Sensors', context: 'Industrial IoT' },
      { tech1: 'Strain Gauges', tech2: 'LVDT Sensors', context: 'Precision Measurement' },
      { tech1: 'Pneumatic Systems', tech2: 'Hydraulic Systems', context: 'Industrial Automation' },
      { tech1: 'Fiber Optic Sensors', tech2: 'Traditional Sensors', context: 'Harsh Environments' }
    ];
    
    comparisonPairs.slice(0, 2).forEach((pair, index) => {
      ideas.push({
        type: "comparison",
        title: `${pair.tech1} vs ${pair.tech2}: Which is Better for ${pair.context}?`,
        keywords: [pair.tech1.toLowerCase(), pair.tech2.toLowerCase(), 'comparison', 'vs', pair.context.toLowerCase()],
        category: `comparison-${index}`,
        priority: "high",
        unique: `comp-${randomId}-${index}`
      });
    });
    
    // 3. PROBLEM-SOLVING articles (specific challenges)
    const problemSolutions = [
      { problem: 'Vibration in Measurement Systems', solution: 'Isolation Techniques', industry: 'Manufacturing' },
      { problem: 'Temperature Drift in Sensors', solution: 'Compensation Methods', industry: 'Aerospace' },
      { problem: 'Signal Noise in Data Acquisition', solution: 'Filtering Strategies', industry: 'Research' },
      { problem: 'Calibration Frequency Optimization', solution: 'Predictive Maintenance', industry: 'Quality Control' },
      { problem: 'Data Security in IoT Sensors', solution: 'Encryption Protocols', industry: 'Smart Manufacturing' }
    ];
    
    problemSolutions.slice(0, 3).forEach((item, index) => {
      ideas.push({
        type: "problem-solving",
        title: `Solving ${item.problem}: ${item.solution} for ${item.industry}`,
        keywords: [item.problem.toLowerCase(), item.solution.toLowerCase(), 'troubleshooting', 'solutions', item.industry.toLowerCase()],
        category: `troubleshooting-${index}`,
        priority: "medium",
        unique: `prob-${randomId}-${index}`
      });
    });
    
    // 4. FUTURE-FOCUSED articles (emerging tech)
    const futureTrends = [
      { trend: 'AI-Powered Predictive Maintenance', impact: 'Industrial Equipment Longevity', timeframe: '2025-2030' },
      { trend: 'Quantum Sensors', impact: 'Ultra-High Precision Measurements', timeframe: 'Next Decade' },
      { trend: 'Digital Twin Technology', impact: 'Virtual Testing and Simulation', timeframe: `${this.currentYear}-2027` },
      { trend: 'Edge Computing in Manufacturing', impact: 'Real-Time Data Processing', timeframe: 'Current Trends' },
      { trend: 'Blockchain for Supply Chain Monitoring', impact: 'Traceability and Trust', timeframe: 'Emerging Now' }
    ];
    
    futureTrends.slice(0, 2).forEach((trend, index) => {
      ideas.push({
        type: "future-tech",
        title: `The Future of ${trend.trend}: ${trend.impact} in ${trend.timeframe}`,
        keywords: [trend.trend.toLowerCase(), 'future', 'emerging technology', trend.impact.toLowerCase(), this.currentYear.toString()],
        category: `innovation-${index}`,
        priority: "high",
        unique: `future-${randomId}-${index}`
      });
    });
    
    // 5. INDUSTRY-SPECIFIC deep dives
    const industrySpecific = [
      { industry: 'Medical Device Manufacturing', focus: 'FDA Compliance and Measurement Standards', challenge: 'Regulatory Requirements' },
      { industry: 'Chemical Processing', focus: 'Process Control and Safety Systems', challenge: 'Hazardous Environments' },
      { industry: 'Mining Operations', focus: 'Remote Monitoring Technologies', challenge: 'Extreme Conditions' },
      { industry: 'Nuclear Power', focus: 'Radiation-Resistant Sensors', challenge: 'Safety Critical Applications' }
    ];
    
    industrySpecific.slice(0, 2).forEach((item, index) => {
      ideas.push({
        type: "industry-specific",
        title: `${item.focus} in ${item.industry}: Overcoming ${item.challenge}`,
        keywords: [item.industry.toLowerCase(), item.focus.toLowerCase(), item.challenge.toLowerCase(), 'industry standards'],
        category: `industry-${index}`,
        priority: "medium",
        unique: `ind-${randomId}-${index}`
      });
    });
    
    // 6. SEASONAL/TIMELY articles
    const seasonalTopics = [
      { season: currentMonth, topic: 'Equipment Maintenance Planning', reason: 'Seasonal Preparation' },
      { season: 'End-of-Year', topic: 'Technology Investment Strategies', reason: 'Budget Planning' },
      { season: 'Spring', topic: 'System Upgrades and Modernization', reason: 'Renewal Season' }
    ];
    
    seasonalTopics.slice(0, 2).forEach((item, index) => {
      ideas.push({
        type: "seasonal",
        title: `${item.season} ${this.currentYear}: ${item.topic} for ${item.reason}`,
        keywords: [item.season.toLowerCase(), item.topic.toLowerCase(), this.currentYear.toString(), 'planning', 'seasonal'],
        category: `seasonal-${index}`,
        priority: "medium",
        unique: `season-${randomId}-${index}`,
        timeSensitive: true
      });
    });
    
    // 7. COST-OPTIMIZATION articles (business focus)
    const costTopics = [
      { area: 'Measurement System ROI', metric: 'Cost per Test', benefit: 'Reduced Quality Costs' },
      { area: 'Preventive Maintenance Strategies', metric: 'Downtime Reduction', benefit: 'Increased Productivity' },
      { area: 'Energy-Efficient Sensor Networks', metric: 'Power Consumption', benefit: 'Lower Operating Costs' }
    ];
    
    costTopics.slice(0, 2).forEach((topic, index) => {
      ideas.push({
        type: "cost-optimization",
        title: `Maximizing ${topic.area}: How to Improve ${topic.metric} and Achieve ${topic.benefit}`,
        keywords: [topic.area.toLowerCase(), 'cost reduction', topic.metric.toLowerCase(), 'ROI', 'efficiency'],
        category: `business-${index}`,
        priority: "high",
        unique: `cost-${randomId}-${index}`
      });
    });
    
    // 8. EDUCATIONAL SERIES (multi-part potential)
    const educationalSeries = [
      { series: 'Measurement Fundamentals', part: 'Understanding Accuracy vs Precision', level: 'Beginner' },
      { series: 'Signal Processing Essentials', part: 'Digital vs Analog Signal Conversion', level: 'Intermediate' },
      { series: 'Advanced Calibration', part: 'Uncertainty Analysis and Traceability', level: 'Expert' },
      { series: 'Industrial Standards Guide', part: 'ISO 9001 Compliance for Measurement Systems', level: 'Professional' }
    ];
    
    educationalSeries.slice(0, 2).forEach((item, index) => {
      ideas.push({
        type: "educational",
        title: `${item.series}: ${item.part} (${item.level} Guide)`,
        keywords: [item.series.toLowerCase(), item.part.toLowerCase(), item.level.toLowerCase(), 'education', 'training'],
        category: `education-${index}`,
        priority: "medium",
        unique: `edu-${randomId}-${index}`,
        seriesTitle: item.series
      });
    });
    
    this.blogIdeas = ideas;
    
    console.log("💡 Generated DIVERSE blog ideas:");
    ideas.slice(0, 8).forEach((idea, index) => {
      console.log(`   ${index + 1}. ${idea.title} (${idea.type})`);
    });
  }

  // Get trending keywords
  get trendingKeywords() {
    return this.trendingTopics;
  }

  // Get best blog idea for this week
  getBestBlogIdea(blogHistory = []) {
    // Prefer diverse content types (prioritize variety)
    const preferenceOrder = ["case-study", "comparison", "future-tech", "problem-solving", "cost-optimization", "industry-specific", "seasonal", "educational"]; 
    
    // Filter out ideas that have already been written about
    const availableIdeas = this.blogIdeas.filter(idea => {
      // Check if we've already written about this topic
      return !blogHistory.some(published => {
        // Check if exact unique ID matches
        if (idea.unique && published.unique && idea.unique === published.unique) {
          return true;
        }
        
        // Check if same category (stronger filter)
        if (published.category === idea.category) {
          return true;
        }
        
        // Check if keywords overlap significantly
        const keywordOverlap = idea.keywords.filter(keyword => 
          published.keywords && published.keywords.includes(keyword)
        ).length;
        
        // Check if similar title
        const similarTitle = published.title && idea.title && (
          published.title.toLowerCase().includes(idea.keywords[0]?.toLowerCase() || '') || 
          idea.title.toLowerCase().includes(published.keywords?.[0]?.toLowerCase() || '')
        );
        
        // Very strict duplicate detection for diverse content
        return keywordOverlap >= 3 || similarTitle;
      });
    });
    
    if (availableIdeas.length === 0) {
      // Generate completely unique fallback ideas if all are used
      console.log("⚠️ All diverse ideas have been used, generating unique fallback ideas...");
      return this.generateUniqueFallbackIdea();
    }
    
    // Sort by preference order and priority
    const sortedIdeas = availableIdeas.sort((a, b) => {
      const aPreference = preferenceOrder.indexOf(a.type);
      const bPreference = preferenceOrder.indexOf(b.type);
      
      if (aPreference !== bPreference && aPreference !== -1 && bPreference !== -1) {
        return aPreference - bPreference;
      }
      
      // If same type or not in preference order, prefer higher priority
      const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
      return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
    });
    
    return sortedIdeas[0];
  }

  // Generate completely unique fallback idea when all regular ideas are used
  generateUniqueFallbackIdea() {
    const timestamp = Date.now();
    const randomTopics = [
      'Emerging Sensor Technologies',
      'Next-Generation Manufacturing',
      'Smart Factory Implementation',
      'Sustainable Industrial Practices',
      'Digital Transformation Strategies',
      'Industry 4.0 Applications',
      'Advanced Materials Testing',
      'Robotics Integration',
      'Cybersecurity in Manufacturing',
      'Green Technology Solutions'
    ];
    
    const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
    
    return {
      type: "unique-fallback",
      title: `${randomTopic}: Latest Developments and Future Implications for ${this.currentYear}`,
      keywords: [randomTopic.toLowerCase(), 'development', 'future', 'implications', this.currentYear.toString()],
      category: `unique-${timestamp}`,
      priority: "medium",
      unique: `fallback-${timestamp}`,
      generated: true
    };
  }
}

export default BlogAnalyzer;