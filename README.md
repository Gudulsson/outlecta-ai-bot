# 🤖 Outlecta - AI-Driven Blog Generator

**Advanced AI-powered blog content generator for industrial technology websites**

## 🚀 Features

### ✨ **Human-Like Content Generation**
- **Natural, conversational tone** that sounds like a real writer
- **Engaging storytelling** with hooks and real-world examples
- **Varied writing styles** (conversational, technical, analytical, storytelling)
- **Context-aware content** that matches product complexity
- **No more robotic, repetitive language** - truly human-like articles

### 🎯 **Smart Content Types**
- **Trend Analysis** - Industry insights and future predictions
- **How-To Guides** - Practical, step-by-step instructions
- **Technical Deep-Dives** - Detailed technical explanations
- **Product Comparisons** - Balanced, informative comparisons
- **Product Spotlights** - Engaging product showcases

### 🔧 **Core Functionality**
- ✅ **Automatic product analysis** from Shopify store
- ✅ **SEO-optimized content** with meta descriptions
- ✅ **Quality scoring** (readability & engagement metrics)
- ✅ **Multiple writing styles** for different content types
- ✅ **Background scheduling** for automated generation
- ✅ **Shopify integration** for direct publishing

## 🏗️ Architecture

```
src/
├── blogGenerator.js        # 🧠 Human-like content generator
├── blogAnalyzer.js         # 📊 Product analysis engine
├── blogScheduler.js        # ⏰ Content scheduling
├── blogPublisher.js        # 📤 Shopify publishing
├── blogDb.js              # 💾 Local database
├── runBlogGenerator.js     # 🚀 Main runner
└── webSearchAI.js         # 🔍 AI content enhancement
```

## 🚀 Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Set Environment Variables**
```bash
# Required for Shopify integration
SHOP_DOMAIN=your-store.myshopify.com
SHOP_ACCESS_TOKEN=shpat_your_access_token
BRAND_NAME=Your Brand
CATEGORY_TAGLINE=Your Category Tagline

# Optional
PAGE_SIZE=100
DRY_RUN=false
PUBLISH_TO_SHOPIFY=true
```

### 3. **Run the Blog Generator**
```bash
# Generate complete blog article
npm run blog:generate

# Analyze products only
npm run blog:analyze

# Force generate and publish
npm run blog:force

# Get blog statistics
npm run blog:stats

# Publish all unpublished articles
npm run blog:publish

# Run weekly scheduling
npm run blog:weekly
```

## 📊 Content Quality Metrics

### **Readability Score (0-100)**
- Measures how easy the content is to read
- Optimized for target audience comprehension
- Natural sentence structure and flow

### **Engagement Score (0-100)**
- Tracks interactive elements (questions, examples)
- Measures direct address and inclusive language
- Evaluates storytelling and narrative flow

### **Writing Styles**
- **Conversational**: Personal, friendly, direct address
- **Technical**: Precise, detailed, professional
- **Analytical**: Data-driven, logical, evidence-based
- **Storytelling**: Narrative flow, real scenarios, emotional connection

## 🔄 Workflow

### **1. Product Analysis**
- Scans all Shopify products
- Extracts keywords and trends
- Identifies content opportunities

### **2. Content Generation**
- Selects appropriate writing style
- Creates engaging hooks and introductions
- Generates natural, flowing content
- Adds practical examples and insights

### **3. Quality Control**
- Calculates readability and engagement scores
- Validates content structure
- Ensures SEO optimization

### **4. Publishing**
- Saves articles locally
- Optionally publishes to Shopify
- Tracks performance metrics

## 📝 Content Examples

### **Before (Old Generator)**
```
"The industrial landscape is undergoing unprecedented transformation, driven by technological innovation and evolving market demands. This comprehensive guide explores the key trends shaping modern industrial operations."
```

### **After (New Human-Like Generator)**
```
"Picture this: It's 3 AM, your production line is down, and you're desperately trying to figure out why your load cell isn't performing as expected. Sound familiar? Let's dive into what's really happening in the world of industrial measurement technology."
```

## 🛠️ Advanced Features

### **Writing Style Selection**
```javascript
// Automatically selects style based on content type
how-to → conversational
trend → analytical  
technical → technical
spotlight → storytelling
```

### **Quality Metrics**
- **Readability**: Flesch Reading Ease approximation
- **Engagement**: Interactive elements and direct address
- **SEO**: Keyword integration and meta descriptions

### **Content Variation**
- Multiple hook options per style
- Varied conclusion approaches
- Natural language patterns
- Real-world examples and scenarios

## 📈 Performance

### **Speed**
- **Complete article generation**: ~30 seconds
- **Quality scoring**: Real-time calculation
- **Background scheduling**: Automated runs

### **Quality**
- **Readability scores**: 60-100/100
- **Engagement scores**: 70-95/100
- **Human-like language**: Natural flow and tone

## 🚀 Deployment

### **Local Development**
```bash
npm run blog:generate
```

### **Production**
```bash
# Set environment variables
# Run scheduled generation
npm run blog:weekly
```

## 🔍 Monitoring

### **Logs**
- Real-time generation logs
- Quality metrics tracking
- Error reporting and debugging

### **Analytics**
- Articles generated per run
- Quality score trends
- Publishing success rates

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make improvements
4. Submit pull request

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: GitHub Issues tab
- **Discussions**: GitHub Discussions

---

**🎉 Your AI blog generator now creates truly human-like, engaging content!**
