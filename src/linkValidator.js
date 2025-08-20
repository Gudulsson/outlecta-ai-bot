import { requestWithRetry } from './shopify.js';
import axios from 'axios';

/**
 * Intelligent link validator that checks if internal links actually exist
 * Prevents 401 errors and broken links in articles
 */
class LinkValidator {
  constructor() {
    this.baseUrl = `https://${process.env.SHOP_DOMAIN}`;
    this.validInternalLinks = new Map(); // Cache valid links
    this.invalidLinks = new Set(); // Cache invalid links
    this.lastCacheUpdate = null;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get all valid internal links from the website
  async getValidInternalLinks() {
    // Check if cache is still valid
    if (this.lastCacheUpdate && (Date.now() - this.lastCacheUpdate) < this.cacheExpiry) {
      console.log(`🔗 Using cached internal links (${this.validInternalLinks.size} valid links)`);
      return this.validInternalLinks;
    }

    console.log("🔍 Scanning website for valid internal links...");
    
    try {
      const validLinks = new Map();
      
      // 1. Get all products from Shopify
      const products = await this.getShopifyProducts();
      products.forEach(product => {
        const productUrl = `/products/${product.handle}`;
        validLinks.set(productUrl, {
          title: product.title,
          type: 'product',
          exists: true
        });
      });
      
      // 2. Get all blog articles
      const articles = await this.getShopifyArticles();
      articles.forEach(article => {
        const articleUrl = `/blogs/news/${article.handle}`;
        validLinks.set(articleUrl, {
          title: article.title,
          type: 'article',
          exists: true
        });
      });
      
      // 3. Get static pages
      const staticPages = await this.getStaticPages();
      staticPages.forEach(page => {
        validLinks.set(page.url, {
          title: page.title,
          type: 'page',
          exists: true
        });
      });
      
      // 4. Test each link to ensure it actually works
      const verifiedLinks = await this.verifyLinks(validLinks);
      
      // Update cache
      this.validInternalLinks = verifiedLinks;
      this.lastCacheUpdate = Date.now();
      
      console.log(`✅ Found ${verifiedLinks.size} valid internal links`);
      return verifiedLinks;
      
    } catch (error) {
      console.error("❌ Error scanning internal links:", error.message);
      return this.validInternalLinks; // Return cached links if available
    }
  }

  // Get all products from Shopify
  async getShopifyProducts() {
    try {
      const response = await requestWithRetry('get', '/products.json?limit=250');
      return response.data.products || [];
    } catch (error) {
      console.warn("⚠️ Could not fetch products for link validation:", error.message);
      return [];
    }
  }

  // Get all blog articles from Shopify
  async getShopifyArticles() {
    try {
      const response = await requestWithRetry('get', '/blogs/news/articles.json?limit=250');
      return response.data.articles || [];
    } catch (error) {
      console.warn("⚠️ Could not fetch articles for link validation:", error.message);
      return [];
    }
  }

  // Get static pages (about, contact, etc.)
  async getStaticPages() {
    const staticPages = [
      { url: '/pages/about-us', title: 'About Us' },
      { url: '/pages/contact', title: 'Contact' },
      { url: '/pages/shipping-returns', title: 'Shipping & Returns' },
      { url: '/pages/privacy-policy', title: 'Privacy Policy' },
      { url: '/pages/terms-of-service', title: 'Terms of Service' },
      { url: '/collections/all', title: 'All Products' },
      { url: '/blogs/news', title: 'Blog' }
    ];
    
    return staticPages;
  }

  // Verify that links actually work by testing them
  async verifyLinks(links) {
    console.log("🔍 Verifying internal links...");
    const verifiedLinks = new Map();
    const testPromises = [];
    
    for (const [url, linkInfo] of links) {
      const testPromise = this.testLink(url).then(exists => {
        if (exists) {
          verifiedLinks.set(url, linkInfo);
        } else {
          console.log(`❌ Invalid link: ${url}`);
          this.invalidLinks.add(url);
        }
      });
      testPromises.push(testPromise);
    }
    
    // Test links in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < testPromises.length; i += batchSize) {
      const batch = testPromises.slice(i, i + batchSize);
      await Promise.all(batch);
      // Small delay between batches to be respectful
      if (i + batchSize < testPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return verifiedLinks;
  }

  // Test if a single link works
  async testLink(url) {
    try {
      const fullUrl = `${this.baseUrl}${url}`;
      const response = await axios.head(fullUrl, {
        timeout: 5000,
        validateStatus: status => status < 400 // Accept 2xx and 3xx
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get relevant internal links for a specific topic
  async getRelevantInternalLinks(keywords, maxLinks = 3) {
    const validLinks = await this.getValidInternalLinks();
    const relevantLinks = [];
    
    for (const [url, linkInfo] of validLinks) {
      const relevanceScore = this.calculateRelevanceScore(keywords, linkInfo);
      if (relevanceScore > 0.3) { // Minimum relevance threshold
        relevantLinks.push({
          url,
          title: linkInfo.title,
          type: linkInfo.type,
          relevanceScore
        });
      }
    }
    
    // Sort by relevance and return top links
    return relevantLinks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxLinks);
  }

  // Calculate relevance score between keywords and link
  calculateRelevanceScore(keywords, linkInfo) {
    const linkText = `${linkInfo.title} ${linkInfo.type}`.toLowerCase();
    const keywordText = keywords.join(' ').toLowerCase();
    
    let score = 0;
    for (const keyword of keywords) {
      if (linkText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    return score / keywords.length;
  }

  // Validate and fix internal links in content
  async validateAndFixInternalLinks(content, keywords) {
    console.log("🔗 Validating and fixing internal links in content...");
    
    // Get relevant internal links
    const relevantLinks = await this.getRelevantInternalLinks(keywords, 5);
    
    if (relevantLinks.length === 0) {
      console.log("⚠️ No relevant internal links found - removing internal link suggestions");
      return content;
    }
    
    // Replace generic internal link placeholders with actual valid links
    let fixedContent = content;
    
    // Replace common internal link patterns
    const linkPatterns = [
      /\[internal-link:products\]/gi,
      /\[internal-link:articles\]/gi,
      /\[internal-link:pages\]/gi,
      /\[internal-link:related\]/gi
    ];
    
    let linkIndex = 0;
    for (const pattern of linkPatterns) {
      if (linkIndex < relevantLinks.length) {
        const link = relevantLinks[linkIndex];
        const linkHtml = `<a href="${link.url}" title="${link.title}">${link.title}</a>`;
        fixedContent = fixedContent.replace(pattern, linkHtml);
        linkIndex++;
      }
    }
    
    // Remove any remaining internal link placeholders
    fixedContent = fixedContent.replace(/\[internal-link:[^\]]+\]/gi, '');
    
    console.log(`✅ Added ${linkIndex} valid internal links to content`);
    return fixedContent;
  }

  // Check if a specific URL is valid
  async isValidUrl(url) {
    if (this.invalidLinks.has(url)) {
      return false;
    }
    
    if (this.validInternalLinks.has(url)) {
      return true;
    }
    
    // Test the URL
    const isValid = await this.testLink(url);
    if (!isValid) {
      this.invalidLinks.add(url);
    }
    
    return isValid;
  }

  // Get link statistics
  getLinkStats() {
    return {
      validLinks: this.validInternalLinks.size,
      invalidLinks: this.invalidLinks.size,
      lastUpdated: this.lastCacheUpdate ? new Date(this.lastCacheUpdate).toISOString() : null
    };
  }
}

export default LinkValidator;
