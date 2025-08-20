import { requestWithRetry, uploadFileBase64 } from "./shopify.js";
import fs from "fs";
import path from "path";

// Blog publisher - publishes generated articles to Shopify blog or saves locally
class BlogPublisher {
  constructor() {
    this.shopifyApi = {
      baseUrl: `https://${process.env.SHOP_DOMAIN}/admin/api/2024-01`,
      headers: {
        'X-Shopify-Access-Token': process.env.SHOP_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };
    this.localBlogDir = "local_blog_articles";
  }

  // Publish article to Shopify blog or save locally
  async publishArticle(articleData) {
    console.log(`📤 Publishing article: ${articleData.title}`);
    
    // Quality control check before publishing
    const qualityCheck = await this.performQualityCheck(articleData);
    
    if (!qualityCheck.passed) {
      console.log(`❌ Quality check failed: ${qualityCheck.issues.join(', ')}`);
      console.log(`📝 Article preview saved to: ${qualityCheck.previewPath}`);
      throw new Error(`Article failed quality check: ${qualityCheck.issues.join(', ')}`);
    }
    
    console.log(`✅ Quality check passed! Quality score: ${articleData.qualityScore}/100`);
    
    // Show preview option
    await this.showPreview(articleData);
    
    try {
      // First, try to publish to Shopify
      const shopifyArticle = await this.createShopifyArticle(articleData);
      
      // Update local article with Shopify data
      const updatedArticle = {
        ...articleData,
        shopifyId: shopifyArticle.id,
        shopifyHandle: shopifyArticle.handle,
        publishedAt: shopifyArticle.published_at,
        status: "published"
      };
      
      // Save updated article
      await this.updateArticleFile(updatedArticle);
      
      console.log(`✅ Article published successfully to Shopify!`);
      console.log(`🔗 Shopify ID: ${shopifyArticle.id}`);
      console.log(`🔗 Handle: ${shopifyArticle.handle}`);
      
      return updatedArticle;
      
    } catch (error) {
      console.log(`⚠️ Could not publish to Shopify: ${error.message}`);
      console.log(`📄 Saving article locally instead...`);
      
      // Fallback: Save locally
      const localArticle = await this.saveArticleLocally(articleData);
      
      console.log(`✅ Article saved locally: ${localArticle.filename}`);
      console.log(`📁 Location: ${localArticle.filepath}`);
      
      return localArticle;
    }
  }

  // Perform quality check before publishing
  async performQualityCheck(articleData) {
    const check = {
      passed: true,
      issues: [],
      previewPath: null
    };

    // Check for critical issues
    if (articleData.content.includes('Default Title')) {
      check.passed = false;
      check.issues.push('Contains placeholder content');
    }

    if (articleData.content.includes('industrial in industrial')) {
      check.passed = false;
      check.issues.push('Contains nonsensical content');
    }

    if (articleData.wordCount < 500) {
      check.issues.push('Article is very short');
    }

    if (articleData.qualityScore < 70) {
      check.issues.push('Quality score below threshold');
    }

    // Check for outdated dates
    const currentYear = new Date().getFullYear();
    if (articleData.content.includes('2024') && currentYear > 2024) {
      check.issues.push('Contains outdated year references');
    }

    // Create preview file
    check.previewPath = await this.createPreviewFile(articleData);

    return check;
  }

  // Create preview file
  async createPreviewFile(articleData) {
    const previewDir = "article_previews";
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const cleanTitle = articleData.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}_${cleanTitle}_preview.html`;
    const filepath = path.join(previewDir, filename);

    const previewHtml = this.generatePreviewHTML(articleData);
    fs.writeFileSync(filepath, previewHtml);

    return path.resolve(filepath);
  }

  // Generate preview HTML
  generatePreviewHTML(articleData) {
    const { title, content, excerpt, tags, seoTitle, metaDescription, qualityScore, wordCount } = articleData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        h2 { color: #007cba; margin-top: 30px; }
        h3 { color: #555; }
        p { margin-bottom: 15px; }
        ul, ol { margin-bottom: 15px; }
        li { margin-bottom: 5px; }
        .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .quality-score { background: #e8f5e8; border: 1px solid #4caf50; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .content { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="quality-score">
        <h3>📊 Quality Metrics</h3>
        <p><strong>Quality Score:</strong> ${qualityScore}/100</p>
        <p><strong>Word Count:</strong> ${wordCount} words</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="meta">
        <h3>📝 Article Metadata</h3>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>SEO Title:</strong> ${seoTitle}</p>
        <p><strong>Meta Description:</strong> ${metaDescription}</p>
        <p><strong>Tags:</strong> ${tags.join(', ')}</p>
        <p><strong>Excerpt:</strong> ${excerpt}</p>
    </div>

    <div class="content">
        <h1>${title}</h1>
        ${content}
    </div>

    <div class="warning">
        <h3>⚠️ Preview Notice</h3>
        <p>This is a preview of the article before publishing. Review the content and quality metrics above.</p>
        <p>If everything looks good, the article will be published to Shopify.</p>
    </div>
</body>
</html>`;
  }

  // Show preview and ask for confirmation
  async showPreview(articleData) {
    console.log(`\n📖 ARTICLE PREVIEW:`);
    console.log(`📄 Title: ${articleData.title}`);
    console.log(`📊 Word Count: ${articleData.wordCount} words`);
    console.log(`🎯 Quality Score: ${articleData.qualityScore}/100`);
    console.log(`📝 Excerpt: ${articleData.excerpt.substring(0, 150)}...`);
    console.log(`🏷️ Tags: ${articleData.tags.join(', ')}`);
    
    if (articleData.thumbnail) {
      console.log(`🖼️ Thumbnail: Generated (${articleData.thumbnail.alt})`);
    }
    
    console.log(`\n✅ Article ready for publishing!`);
  }

  // Save article locally with publishing instructions
  async saveArticleLocally(articleData) {
    // Create local blog directory if it doesn't exist
    if (!fs.existsSync(this.localBlogDir)) {
      fs.mkdirSync(this.localBlogDir);
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${this.sanitizeFilename(articleData.title)}.html`;
    const filepath = path.join(this.localBlogDir, filename);
    
    // Create HTML file with the article
    const htmlContent = this.generateHTMLArticle(articleData);
    
    fs.writeFileSync(filepath, htmlContent);
    
    // Also save JSON metadata
    const jsonFilename = `${timestamp}_${this.sanitizeFilename(articleData.title)}.json`;
    const jsonFilepath = path.join(this.localBlogDir, jsonFilename);
    
    const articleMetadata = {
      ...articleData,
      filename,
      filepath,
      jsonFilepath,
      generatedAt: new Date().toISOString(),
      status: "local",
      publishingInstructions: this.getPublishingInstructions()
    };
    
    fs.writeFileSync(jsonFilepath, JSON.stringify(articleMetadata, null, 2));
    
    return articleMetadata;
  }

  // Generate HTML article with proper formatting
  generateHTMLArticle(articleData) {
    const { title, content, excerpt, tags, seoTitle, metaDescription, publishDate } = articleData;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoTitle || title}</title>
    <meta name="description" content="${metaDescription}">
    <meta name="keywords" content="${tags.join(', ')}">
    <meta name="author" content="Outlecta.com">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${excerpt}">
    <meta property="og:type" content="article">
    <meta property="article:published_time" content="${publishDate}">
    <meta property="article:tag" content="${tags.join(', ')}">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        h2 { color: #007cba; margin-top: 30px; }
        h3 { color: #555; }
        p { margin-bottom: 15px; }
        ul, ol { margin-bottom: 15px; }
        li { margin-bottom: 5px; }
        .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .tags { margin-top: 20px; }
        .tag { background: #007cba; color: white; padding: 5px 10px; border-radius: 15px; margin-right: 5px; display: inline-block; }
        .publishing-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="publishing-info">
        <h3>📝 Publishing Instructions</h3>
        <p>This article was generated by Outlecta's AI Blog Generator. To publish this article:</p>
        <ol>
            <li>Copy the content below</li>
            <li>Create a new blog post on your website</li>
            <li>Paste the content and format as needed</li>
            <li>Add the SEO title and meta description</li>
            <li>Publish the article</li>
        </ol>
    </div>

    <article>
        <header>
            <h1>${title}</h1>
            <div class="meta">
                <p><strong>Published:</strong> ${new Date(publishDate).toLocaleDateString()}</p>
                <p><strong>Word Count:</strong> ${articleData.wordCount} words</p>
                <p><strong>Category:</strong> ${articleData.category}</p>
                <p><strong>Type:</strong> ${articleData.type}</p>
            </div>
        </header>

        <div class="content">
            ${content}
        </div>

        <footer>
            <div class="tags">
                <strong>Tags:</strong>
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            
            <div class="meta">
                <h3>SEO Information</h3>
                <p><strong>SEO Title:</strong> ${seoTitle || title}</p>
                <p><strong>Meta Description:</strong> ${metaDescription}</p>
                <p><strong>Keywords:</strong> ${tags.join(', ')}</p>
            </div>
        </footer>
    </article>
</body>
</html>`;
  }

  // Get publishing instructions
  getPublishingInstructions() {
    return {
      steps: [
        "Copy the HTML content from the generated file",
        "Create a new blog post on your website",
        "Paste the content and format as needed",
        "Add the SEO title and meta description",
        "Publish the article",
        "Share on social media"
      ],
      platforms: [
        "WordPress",
        "Shopify Blog",
        "Medium",
        "LinkedIn Articles",
        "Company website"
      ],
      tips: [
        "Optimize images for web",
        "Add internal links to your products",
        "Include call-to-action buttons",
        "Share on social media platforms",
        "Monitor engagement metrics"
      ]
    };
  }

  // Create article in Shopify
  async createShopifyArticle(articleData) {
    const { title, content, excerpt, tags, seoTitle, metaDescription, thumbnail } = articleData;
    
    // Generate handle from title
    const handle = this.generateHandle(title);
    
    // Prepare article data for Shopify
    const shopifyArticleData = {
      article: {
        title: title,
        body_html: content,
        summary_html: excerpt,
        tags: tags.join(', '),
        handle: handle,
        seo: {
          title: seoTitle,
          description: metaDescription
        },
        published: true,
        published_at: new Date().toISOString()
      }
    };
    
    // Get or create blog
    const blog = await this.getOrCreateBlog();
    
    // Create article first
    const response = await requestWithRetry('post', `/blogs/${blog.id}/articles.json`, shopifyArticleData);
    const article = response.data.article;

    // Set thumbnail as featured image for blog listing (simple approach)
    if (thumbnail?.imageBase64) {
      try {
        console.log(`📸 Setting thumbnail as featured image...`);
        
        const featuredImageData = {
          article: {
            id: article.id,
            image: {
              attachment: thumbnail.imageBase64,
              alt: thumbnail.alt,
              filename: thumbnail.filename || `${handle}-thumbnail.png`
            }
          }
        };
        
        const featuredResponse = await requestWithRetry('put', `/blogs/${blog.id}/articles/${article.id}.json`, featuredImageData);
        
        if (featuredResponse.data.article.image) {
          article.image = featuredResponse.data.article.image;
          console.log(`✅ Featured image set for blog listing!`);
          console.log(`🔗 Featured Image URL: ${article.image.src}`);
        }
        
        // Also save thumbnail locally as backup
        const thumbnailInfo = await this.saveThumbnailLocally(thumbnail, title);
        console.log(`📸 Thumbnail also saved locally: ${thumbnailInfo.filepath}`);
        
      } catch (e) {
        console.log(`⚠️ Could not upload thumbnail to Shopify: ${e.message}`);
        if (e.message.includes('SSL') || e.message.includes('timeout')) {
          console.log(`📸 SSL/Network issue detected - saving thumbnail locally as fallback...`);
        } else {
          console.log(`📸 Saving thumbnail locally as fallback...`);
        }
        
        try {
          const thumbnailInfo = await this.saveThumbnailLocally(thumbnail, title);
          console.log(`📸 Thumbnail saved locally: ${thumbnailInfo.filepath}`);
          console.log(`📝 To manually add thumbnail to article:`);
          console.log(`   1. Go to Shopify Admin > Content > Blog posts`);
          console.log(`   2. Find article: "${title}"`);
          console.log(`   3. Click "Edit" and add image from: ${thumbnailInfo.filepath}`);
          console.log(`   4. Set ALT text: "${thumbnail.alt}"`);
          
          article.thumbnailInfo = thumbnailInfo;
        } catch (fallbackError) {
          console.log(`⚠️ Could not save thumbnail locally either: ${fallbackError.message}`);
        }
      }
    }
    
    return article;
  }

  // Save thumbnail locally with clear filename
  async saveThumbnailLocally(thumbnail, title) {
    // Create thumbnails directory if it doesn't exist
    const thumbnailsDir = "blog_thumbnails";
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir);
    }
    
    // Create clean filename
    const timestamp = new Date().toISOString().split('T')[0];
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}_${cleanTitle}_thumbnail.png`;
    const filepath = path.join(thumbnailsDir, filename);
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(thumbnail.imageBase64, 'base64');
    fs.writeFileSync(filepath, imageBuffer);
    
    return {
      filename,
      filepath: path.resolve(filepath),
      alt: thumbnail.alt,
      size: imageBuffer.length,
      dimensions: "1200x630"
    };
  }

  // Get or create blog
  async getOrCreateBlog() {
    try {
      // Try to get existing blog
      const response = await requestWithRetry('get', '/blogs.json');
      
      const blogs = response.data.blogs;
      
      // Look for Outlecta blog or any existing blog
      const outlectaBlog = blogs.find(blog => 
        blog.title.toLowerCase().includes('outlecta') || 
        blog.handle === 'outlecta-blog' ||
        blog.handle === 'news'
      );
      
      // If no specific Outlecta blog found, use the first available blog
      if (!outlectaBlog && blogs.length > 0) {
        console.log(`📝 Using existing blog: ${blogs[0].title}`);
        return blogs[0];
      }
      
      if (outlectaBlog) {
        console.log(`📝 Found existing blog: ${outlectaBlog.title}`);
        return outlectaBlog;
      }
      
      // Create new blog if not found
      console.log("📝 Creating new Outlecta blog...");
      const createResponse = await requestWithRetry('post', '/blogs.json', {
        blog: {
          title: "Outlecta Industrial Blog",
          handle: "outlecta-blog",
          commentable: "moderate",
          feedburner: "",
          feedburner_location: "",
          template_suffix: "",
          tags: "industrial, measurement, automation, sensors"
        }
      });
      
      console.log(`✅ Created new blog: ${createResponse.data.blog.title}`);
      return createResponse.data.blog;
      
    } catch (error) {
      console.error("❌ Error getting/creating blog:", error.message);
      throw error;
    }
  }

  // Generate clean, short handle from title
  generateHandle(title) {
    // Clean and shorten title significantly
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^(the|a|an)-/, '') // Remove common article prefixes
      .replace(/-?(guide|tips|how-to|complete)-?/g, '') // Remove common blog words
      .replace(/-?(in|for|with|and|or|to|of)-/g, '-') // Remove common small words
      .replace(/-+/g, '-') // Remove multiple dashes
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .substring(0, 40); // Much shorter limit
      
    return cleanTitle || 'blog-post'; // Fallback if title becomes empty
  }

  // Sanitize filename
  sanitizeFilename(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Update article file with new data
  async updateArticleFile(articleData) {
    const filepath = articleData.filepath;
    
    if (filepath && fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(articleData, null, 2));
      console.log(`📄 Updated article file: ${articleData.filename}`);
    }
  }

  // Publish all unpublished articles
  async publishAllUnpublished() {
    console.log("📤 Publishing all unpublished articles...");
    
    const blogDir = "generated_blogs";
    
    if (!fs.existsSync(blogDir)) {
      console.log("📁 No generated blogs directory found");
      return [];
    }
    
    const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.json'));
    const publishedArticles = [];
    
    for (const file of files) {
      const filepath = path.join(blogDir, file);
      const articleData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      if (articleData.status === "generated") {
        try {
          const publishedArticle = await this.publishArticle(articleData);
          publishedArticles.push(publishedArticle);
          
          // Small delay between publications
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Failed to publish ${file}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Published ${publishedArticles.length} articles`);
    return publishedArticles;
  }

  // Get published articles from Shopify
  async getPublishedArticles(limit = 10) {
    try {
      const blog = await this.getOrCreateBlog();
      
      const response = await requestWithRetry({
        method: 'GET',
        url: `${this.shopifyApi.baseUrl}/blogs/${blog.id}/articles.json?limit=${limit}`,
        headers: this.shopifyApi.headers
      });
      
      return response.data.articles;
      
    } catch (error) {
      console.error("❌ Error getting published articles:", error.message);
      return [];
    }
  }

  // Get local articles
  getLocalArticles() {
    if (!fs.existsSync(this.localBlogDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.localBlogDir).filter(file => file.endsWith('.json'));
    return files.map(file => {
      const filepath = path.join(this.localBlogDir, file);
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    });
  }

  // Delete article from Shopify
  async deleteArticle(articleId) {
    try {
      const blog = await this.getOrCreateBlog();
      
      await requestWithRetry({
        method: 'DELETE',
        url: `${this.shopifyApi.baseUrl}/blogs/${blog.id}/articles/${articleId}.json`,
        headers: this.shopifyApi.headers
      });
      
      console.log(`🗑️ Deleted article: ${articleId}`);
      
    } catch (error) {
      console.error("❌ Error deleting article:", error.message);
      throw error;
    }
  }

  // Update article in Shopify
  async updateArticle(articleId, articleData) {
    try {
      const blog = await this.getOrCreateBlog();
      
      const { title, content, excerpt, tags, seoTitle, metaDescription } = articleData;
      
      const updateData = {
        article: {
          title: title,
          body_html: content,
          summary_html: excerpt,
          tags: tags.join(', '),
          seo: {
            title: seoTitle,
            description: metaDescription
          }
        }
      };
      
      const response = await requestWithRetry({
        method: 'PUT',
        url: `${this.shopifyApi.baseUrl}/blogs/${blog.id}/articles/${articleId}.json`,
        headers: this.shopifyApi.headers,
        data: updateData
      });
      
      console.log(`✅ Updated article: ${articleId}`);
      return response.data.article;
      
    } catch (error) {
      console.error("❌ Error updating article:", error.message);
      throw error;
    }
  }

  // Get blog statistics
  async getBlogStats() {
    try {
      const blog = await this.getOrCreateBlog();
      
      const response = await requestWithRetry({
        method: 'GET',
        url: `${this.shopifyApi.baseUrl}/blogs/${blog.id}/articles/count.json`,
        headers: this.shopifyApi.headers
      });
      
      return {
        blogId: blog.id,
        blogTitle: blog.title,
        totalArticles: response.data.count,
        blogUrl: `https://${process.env.SHOP_DOMAIN}/blogs/${blog.handle}`
      };
      
    } catch (error) {
      console.error("❌ Error getting blog stats:", error.message);
      return null;
    }
  }
}

export default BlogPublisher;
