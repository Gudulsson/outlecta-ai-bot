import BlogPublisher from './blogPublisher.js';
import { requestWithRetry } from './shopify.js';
import fs from 'fs';
import path from 'path';

/**
 * Intelligent artikel-rensare som upptäcker och tar bort duplicerade artiklar
 */
class ArticleCleaner {
  constructor() {
    this.publisher = new BlogPublisher();
    this.duplicateThreshold = 70; // % likhet för att betraktas som duplicerat
    this.archiveDir = 'archived_articles';
  }

  // Hitta och ta bort duplicerade artiklar
  async cleanDuplicateArticles() {
    console.log("🧹 Starting intelligent article cleanup...");
    
    try {
      // Hämta alla artiklar från Shopify
      const shopifyArticles = await this.getAllShopifyArticles();
      console.log(`📄 Found ${shopifyArticles.length} articles on Shopify`);
      
      // Analysera för duplicering
      const duplicateGroups = this.findDuplicateGroups(shopifyArticles);
      
      if (duplicateGroups.length === 0) {
        console.log("✅ No duplicate articles found!");
        return { deleted: 0, archived: 0 };
      }
      
      console.log(`⚠️ Found ${duplicateGroups.length} groups of duplicate articles`);
      
      let deletedCount = 0;
      let archivedCount = 0;
      
      // Bearbeta varje grupp av duplicerade artiklar
      for (const group of duplicateGroups) {
        const result = await this.processDuplicateGroup(group);
        deletedCount += result.deleted;
        archivedCount += result.archived;
      }
      
      console.log(`\n🎉 Cleanup completed!`);
      console.log(`🗑️ Deleted: ${deletedCount} articles`);
      console.log(`📦 Archived: ${archivedCount} articles`);
      
      return { deleted: deletedCount, archived: archivedCount };
      
    } catch (error) {
      console.error("❌ Error in article cleanup:", error.message);
      throw error;
    }
  }

  // Hämta alla artiklar från Shopify
  async getAllShopifyArticles() {
    try {
      const blog = await this.publisher.getOrCreateBlog();
      const response = await requestWithRetry('get', `${this.publisher.shopifyApi.baseUrl}/blogs/${blog.id}/articles.json?limit=250`);
      return response.data.articles || [];
    } catch (error) {
      console.error("❌ Error fetching Shopify articles:", error.message);
      return [];
    }
  }

  // Hitta grupper av duplicerade artiklar
  findDuplicateGroups(articles) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < articles.length; i++) {
      if (processed.has(articles[i].id)) continue;
      
      const currentArticle = articles[i];
      const duplicates = [currentArticle];
      processed.add(currentArticle.id);
      
      // Jämför med alla andra artiklar
      for (let j = i + 1; j < articles.length; j++) {
        if (processed.has(articles[j].id)) continue;
        
        const compareArticle = articles[j];
        const similarity = this.calculateSimilarity(currentArticle, compareArticle);
        
        if (similarity >= this.duplicateThreshold) {
          duplicates.push(compareArticle);
          processed.add(compareArticle.id);
          
          console.log(`🔍 Found duplicate: "${currentArticle.title}" vs "${compareArticle.title}" (${similarity.toFixed(1)}% similar)`);
        }
      }
      
      // Om fler än 1 artikel i gruppen, är det duplicering
      if (duplicates.length > 1) {
        groups.push(duplicates);
      }
    }
    
    return groups;
  }

  // Beräkna likhet mellan två artiklar
  calculateSimilarity(article1, article2) {
    let similarityScore = 0;
    let totalChecks = 0;
    
    // Kontrollera titel-likhet
    const titleSimilarity = this.calculateTextSimilarity(article1.title, article2.title);
    similarityScore += titleSimilarity * 0.4; // 40% vikt för titel
    totalChecks += 0.4;
    
    // Kontrollera innehålls-likhet
    if (article1.body_html && article2.body_html) {
      const contentSimilarity = this.calculateTextSimilarity(
        this.stripHtml(article1.body_html), 
        this.stripHtml(article2.body_html)
      );
      similarityScore += contentSimilarity * 0.3; // 30% vikt för innehåll
      totalChecks += 0.3;
    }
    
    // Kontrollera tag-likhet
    if (article1.tags && article2.tags) {
      const tags1 = article1.tags.split(',').map(t => t.trim().toLowerCase());
      const tags2 = article2.tags.split(',').map(t => t.trim().toLowerCase());
      const tagSimilarity = this.calculateArraySimilarity(tags1, tags2);
      similarityScore += tagSimilarity * 0.2; // 20% vikt för tags
      totalChecks += 0.2;
    }
    
    // Kontrollera handle-likhet
    const handleSimilarity = this.calculateTextSimilarity(article1.handle, article2.handle);
    similarityScore += handleSimilarity * 0.1; // 10% vikt för handle
    totalChecks += 0.1;
    
    return totalChecks > 0 ? (similarityScore / totalChecks) * 100 : 0;
  }

  // Beräkna text-likhet med Levenshtein-distance
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const cleanText1 = text1.toLowerCase().trim();
    const cleanText2 = text2.toLowerCase().trim();
    
    if (cleanText1 === cleanText2) return 1;
    
    const distance = this.levenshteinDistance(cleanText1, cleanText2);
    const maxLength = Math.max(cleanText1.length, cleanText2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  // Levenshtein distance algorithm
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Beräkna array-likhet
  calculateArraySimilarity(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;
    
    const intersection = arr1.filter(item => arr2.includes(item));
    const union = [...new Set([...arr1, ...arr2])];
    
    return intersection.length / union.length;
  }

  // Ta bort HTML-taggar
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // Bearbeta en grupp av duplicerade artiklar
  async processDuplicateGroup(articles) {
    console.log(`\n🔍 Processing duplicate group of ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`  ${index + 1}. "${article.title}" (ID: ${article.id}, Created: ${article.created_at})`);
    });
    
    // Sortera efter datum (behåll den senaste)
    articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const keepArticle = articles[0]; // Behåll den senaste
    const deleteArticles = articles.slice(1); // Ta bort resten
    
    console.log(`✅ Keeping newest: "${keepArticle.title}" (${keepArticle.created_at})`);
    
    let deleted = 0;
    let archived = 0;
    
    for (const article of deleteArticles) {
      try {
        console.log(`🗑️ Deleting: "${article.title}" (ID: ${article.id})`);
        
        // Arkivera innan borttagning
        await this.archiveArticle(article);
        archived++;
        
        // Ta bort från Shopify
        await this.publisher.deleteArticle(article.id);
        deleted++;
        
        console.log(`✅ Successfully deleted article ID: ${article.id}`);
        
        // Vänta lite mellan borttagningar för att inte överbelasta API:et
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to delete article ID ${article.id}:`, error.message);
      }
    }
    
    return { deleted, archived };
  }

  // Arkivera artikel innan borttagning
  async archiveArticle(article) {
    try {
      // Skapa arkiv-mapp om den inte finns
      if (!fs.existsSync(this.archiveDir)) {
        fs.mkdirSync(this.archiveDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${timestamp}_deleted_${article.id}_${this.sanitizeFilename(article.title)}.json`;
      const filepath = path.join(this.archiveDir, filename);
      
      const archiveData = {
        ...article,
        deletedAt: new Date().toISOString(),
        reason: 'duplicate_detected'
      };
      
      fs.writeFileSync(filepath, JSON.stringify(archiveData, null, 2));
      console.log(`📦 Archived: ${filename}`);
      
    } catch (error) {
      console.warn(`⚠️ Could not archive article ${article.id}:`, error.message);
    }
  }

  // Sanera filnamn
  sanitizeFilename(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Rensa även lokala duplicerade filer
  async cleanLocalDuplicates() {
    console.log("\n🧹 Cleaning local duplicate files...");
    
    const localBlogDir = 'local_blog_articles';
    const generatedBlogDir = 'generated_blogs';
    
    let cleaned = 0;
    
    for (const dir of [localBlogDir, generatedBlogDir]) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const titleMap = new Map();
        
        // Gruppera filer efter titel
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filepath = path.join(dir, file);
              const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
              const title = data.title;
              
              if (!titleMap.has(title)) {
                titleMap.set(title, []);
              }
              titleMap.get(title).push({ file, filepath, data });
              
            } catch (error) {
              console.warn(`⚠️ Could not read ${file}:`, error.message);
            }
          }
        }
        
        // Ta bort duplicerade filer (behåll den senaste)
        for (const [title, fileGroup] of titleMap) {
          if (fileGroup.length > 1) {
            // Sortera efter fil-datum
            fileGroup.sort((a, b) => {
              const statA = fs.statSync(a.filepath);
              const statB = fs.statSync(b.filepath);
              return statB.mtime - statA.mtime;
            });
            
            // Ta bort alla utom den senaste
            for (let i = 1; i < fileGroup.length; i++) {
              try {
                fs.unlinkSync(fileGroup[i].filepath);
                console.log(`🗑️ Deleted duplicate local file: ${fileGroup[i].file}`);
                cleaned++;
              } catch (error) {
                console.warn(`⚠️ Could not delete ${fileGroup[i].file}:`, error.message);
              }
            }
          }
        }
      }
    }
    
    console.log(`✅ Cleaned ${cleaned} local duplicate files`);
    return cleaned;
  }
}

export default ArticleCleaner;
