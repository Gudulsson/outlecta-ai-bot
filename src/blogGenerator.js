import { generateThumbnail } from "./thumbnail.js";
import LinkValidator from "./linkValidator.js";
import ContentAnalyzer from "./contentAnalyzer.js";
import fs from "fs";
import path from "path";

// Outlecta's Supreme Blog Publishing AI
// A fusion of world-class SEO strategist, technical content engineer, and growth marketer
class BlogGenerator {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.outlectaCategories = ['HMI', 'IoT', 'Measurement', 'Embedded'];
    this.trustedAuthorities = [
      'ieee.org', 'nist.gov', 'iso.org', 'astm.org', 'asme.org',
      'automationworld.com', 'controleng.com', 'isa.org'
    ];
    this.linkValidator = new LinkValidator();
    this.contentAnalyzer = new ContentAnalyzer();
  }

  // Generate a supreme SEO-optimized blog article
  async generateBlogArticle(blogIdea) {
    console.log(`📝 Generating supreme SEO blog article: ${blogIdea.title}`);
    
    try {
      // Step 1: SEO Analysis & Strategy
      const seoStrategy = this.analyzeSEOStrategy(blogIdea);
      
      // Step 2: Content Architecture
      const contentStructure = this.architectContent(blogIdea, seoStrategy);
      
      // Step 3: Generate Supreme Content
      const article = await this.generateSupremeContent(blogIdea, contentStructure);
      
      // Step 4: Intelligent content analysis and rewriting
      const analyzedArticle = await this.analyzeAndRewriteContent(article, blogIdea);
      
      // Step 5: Validate and fix internal links
      const linkValidatedArticle = await this.validateInternalLinks(analyzedArticle, seoStrategy.primaryKeywords);
      
      // Step 6: SEO Optimization
      const optimizedArticle = this.optimizeForSEO(linkValidatedArticle, seoStrategy);
      
      // Step 6: Generate Thumbnail
      const thumbnail = await generateThumbnail(blogIdea);
      
      // Step 8: Calculate Quality Metrics
      const qualityMetrics = this.calculateQualityMetrics(optimizedArticle);
      
      return {
        title: blogIdea.title,
        content: optimizedArticle.content,
        excerpt: this.generateExcerpt(optimizedArticle.content),
        keywords: seoStrategy.primaryKeywords,
        category: blogIdea.category,
        type: blogIdea.type,
        seoTitle: seoStrategy.seoTitle,
        metaDescription: seoStrategy.metaDescription,
        tags: [...seoStrategy.primaryKeywords, ...seoStrategy.secondaryKeywords.slice(0, 3), 'outlecta'],
        wordCount: optimizedArticle.wordCount,
        thumbnail,
        qualityMetrics,
        generatedAt: new Date().toISOString(),
        seoOptimized: true,
        schemaMarkup: seoStrategy.schemaMarkup
      };
      
    } catch (error) {
      console.error("❌ Error generating supreme blog article:", error.message);
      throw error;
    }
  }

  // Analyze SEO strategy for the blog idea
  analyzeSEOStrategy(blogIdea) {
    const primaryKeywords = this.extractPrimaryKeywords(blogIdea);
    const secondaryKeywords = this.generateSecondaryKeywords(primaryKeywords);
    const semanticKeywords = this.generateSemanticKeywords(primaryKeywords);
    
    return {
      primaryKeywords,
      secondaryKeywords,
      semanticKeywords,
      targetWordCount: this.calculateOptimalWordCount(blogIdea.type),
      seoTitle: this.generateSEOTitle(blogIdea, primaryKeywords),
      metaDescription: this.generateMetaDescription(blogIdea, primaryKeywords),
      slug: this.generateSlug(blogIdea.title, primaryKeywords),
      internalLinks: this.mapInternalLinks(primaryKeywords),
      externalReferences: this.mapExternalReferences(primaryKeywords),
      schemaMarkup: this.generateSchemaMarkup(blogIdea, primaryKeywords)
    };
  }

  // Extract primary keywords with commercial intent
  extractPrimaryKeywords(blogIdea) {
    const baseKeywords = blogIdea.keywords || [];
    const commercialKeywords = [
      'industrial automation solutions',
      'measurement systems',
      'HMI technology',
      'IoT sensors',
      'embedded systems',
      'industrial hardware',
      'automation equipment',
      'measurement tools',
      'industrial technology'
    ];
    
    // Combine and prioritize commercial keywords
    const combinedKeywords = [...new Set([...commercialKeywords, ...baseKeywords])];
    
    // Ensure we always have at least one keyword
    if (combinedKeywords.length === 0) {
      return ['industrial automation'];
    }
    
    return combinedKeywords.slice(0, 3);
  }

  // Generate secondary semantic keywords
  generateSecondaryKeywords(primaryKeywords) {
    const semanticMap = {
      'industrial': ['manufacturing', 'factory', 'production', 'automation'],
      'automation': ['control', 'monitoring', 'optimization', 'efficiency'],
      'measurement': ['sensors', 'calibration', 'accuracy', 'precision'],
      'HMI': ['human machine interface', 'touchscreen', 'control panel', 'operator interface'],
      'IoT': ['internet of things', 'connected devices', 'smart sensors', 'wireless'],
      'embedded': ['microcontrollers', 'real-time', 'industrial computing', 'edge devices']
    };
    
    const secondary = [];
    primaryKeywords.forEach(keyword => {
      const semantic = semanticMap[keyword.toLowerCase()] || [];
      secondary.push(...semantic);
    });
    
    return [...new Set(secondary)].slice(0, 8);
  }

  // Generate semantic LSI keywords
  generateSemanticKeywords(primaryKeywords) {
    const lsiKeywords = [
      'industrial applications', 'best practices', 'implementation guide',
      'technical specifications', 'industry standards', 'performance metrics',
      'cost optimization', 'ROI analysis', 'maintenance procedures',
      'safety compliance', 'quality assurance', 'system integration'
    ];
    
    return lsiKeywords.slice(0, 6);
  }

  // Calculate optimal word count based on content type
  calculateOptimalWordCount(type) {
    const wordCountMap = {
      'trend': 2200,
      'technical': 2500,
      'how-to': 2000,
      'explainer': 1800,
      'beginner': 1600,
      'monthly-update': 1900
    };
    
    return wordCountMap[type] || 2000;
  }

  // Generate SEO-optimized title (≤60 chars)
  generateSEOTitle(blogIdea, primaryKeywords) {
    const baseTitle = blogIdea.title;
    const primaryKeyword = primaryKeywords && primaryKeywords.length > 0 ? primaryKeywords[0] : 'industrial automation';
    
    // Create click-triggering title with keyword + benefit
    const benefitPhrases = [
      'Complete Guide',
      'Best Practices',
      'Expert Tips',
      'Ultimate Guide',
      'Comprehensive Analysis',
      'Industry Insights'
    ];
    
    const benefit = benefitPhrases[Math.floor(Math.random() * benefitPhrases.length)];
    let seoTitle = `${primaryKeyword} ${benefit} ${this.currentYear}`;
    
    // Ensure ≤60 characters
    if (seoTitle.length > 60) {
      seoTitle = `${primaryKeyword} Guide ${this.currentYear}`;
    }
    
    return seoTitle;
  }

  // Generate meta description (≤150 chars)
  generateMetaDescription(blogIdea, primaryKeywords) {
    const primaryKeyword = primaryKeywords && primaryKeywords.length > 0 ? primaryKeywords[0] : 'industrial automation';
    const secondaryKeyword = primaryKeywords && primaryKeywords.length > 1 ? primaryKeywords[1] : 'industrial technology';
    
    let metaDesc = `Discover expert insights on ${primaryKeyword} and ${secondaryKeyword}. Learn best practices, implementation strategies, and industry trends for ${this.currentYear}.`;
    
    // Ensure ≤150 characters
    if (metaDesc.length > 150) {
      metaDesc = `Expert guide to ${primaryKeyword} and ${secondaryKeyword}. Best practices and trends for ${this.currentYear}.`;
    }
    
    if (metaDesc.length > 150) {
      metaDesc = `Complete ${primaryKeyword} guide with expert insights and best practices.`;
    }
    
    return metaDesc;
  }

  // Generate SEO-optimized slug (≤60 chars)
  generateSlug(title, primaryKeywords) {
    const primaryKeyword = primaryKeywords && primaryKeywords.length > 0 ? primaryKeywords[0] : 'industrial-automation';
    const cleanKeyword = primaryKeyword.toLowerCase().replace(/\s+/g, '-');
    const year = this.currentYear;
    
    let slug = `${cleanKeyword}-guide-${year}`;
    
    // Ensure ≤60 characters
    if (slug.length > 60) {
      slug = `${cleanKeyword}-${year}`;
    }
    
    return slug;
  }

  // Map internal links to Outlecta categories
  mapInternalLinks(primaryKeywords) {
    const internalLinks = [
      {
        anchor: 'HMI Solutions',
        url: '/collections/hmi-solutions',
        category: 'HMI'
      },
      {
        anchor: 'IoT Sensors',
        url: '/collections/iot-sensors',
        category: 'IoT'
      },
      {
        anchor: 'Measurement Systems',
        url: '/collections/measurement-systems',
        category: 'Measurement'
      },
      {
        anchor: 'Embedded Hardware',
        url: '/collections/embedded-hardware',
        category: 'Embedded'
      },
      {
        anchor: 'Industrial Automation',
        url: '/collections/industrial-automation',
        category: 'HMI'
      }
    ];
    
    return internalLinks.slice(0, 5);
  }

  // Map external references to trusted authorities
  mapExternalReferences(primaryKeywords) {
    const externalRefs = [
      {
        anchor: 'IEEE Standards',
        url: 'https://standards.ieee.org/',
        authority: 'ieee.org'
      },
      {
        anchor: 'NIST Guidelines',
        url: 'https://www.nist.gov/',
        authority: 'nist.gov'
      },
      {
        anchor: 'ISO Standards',
        url: 'https://www.iso.org/',
        authority: 'iso.org'
      },
      {
        anchor: 'ISA Automation',
        url: 'https://www.isa.org/',
        authority: 'isa.org'
      }
    ];
    
    return externalRefs.slice(0, 4);
  }

  // Generate JSON-LD schema markup
  generateSchemaMarkup(blogIdea, primaryKeywords) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": blogIdea.title,
      "description": this.generateMetaDescription(blogIdea, primaryKeywords),
      "author": {
        "@type": "Organization",
        "name": "Outlecta",
        "url": "https://outlecta.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Outlecta",
        "logo": {
          "@type": "ImageObject",
          "url": "https://outlecta.com/logo.png"
        }
      },
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://outlecta.com/blogs/news/${this.generateSlug(blogIdea.title, primaryKeywords)}`
      },
      "keywords": primaryKeywords.join(', '),
      "articleSection": "Industrial Technology"
    };
    
    return JSON.stringify(schema, null, 2);
  }

  // Architect content structure
  architectContent(blogIdea, seoStrategy) {
    const outline = this.generateContentOutline(blogIdea, seoStrategy);
    const sections = this.defineContentSections(outline);
    
    return {
      outline,
      sections,
      targetWordCount: seoStrategy.targetWordCount,
      conversionPoints: this.defineConversionPoints(blogIdea)
    };
  }

  // Generate content outline with H2/H3 hierarchy
  generateContentOutline(blogIdea, seoStrategy) {
    const primaryKeyword = seoStrategy.primaryKeywords[0];
    
    const outline = [
      {
        level: 'H2',
        title: `Understanding ${primaryKeyword} in ${this.currentYear}`,
        keywords: seoStrategy.primaryKeywords
      },
      {
        level: 'H3',
        title: 'Key Components and Technologies',
        keywords: seoStrategy.secondaryKeywords.slice(0, 3)
      },
      {
        level: 'H2',
        title: 'Industry Trends and Market Analysis',
        keywords: ['trends', 'market', 'analysis', this.currentYear.toString()]
      },
      {
        level: 'H3',
        title: 'Emerging Technologies and Innovations',
        keywords: ['innovation', 'technology', 'future']
      },
      {
        level: 'H2',
        title: 'Implementation Strategies and Best Practices',
        keywords: ['implementation', 'best practices', 'strategies']
      },
      {
        level: 'H3',
        title: 'Technical Specifications and Requirements',
        keywords: ['technical', 'specifications', 'requirements']
      },
      {
        level: 'H2',
        title: 'ROI Analysis and Business Impact',
        keywords: ['ROI', 'business impact', 'cost analysis']
      },
      {
        level: 'H3',
        title: 'Performance Metrics and KPIs',
        keywords: ['performance', 'metrics', 'KPIs']
      },
      {
        level: 'H2',
        title: 'Future Outlook and Recommendations',
        keywords: ['future', 'recommendations', 'outlook']
      }
    ];
    
    return outline;
  }

  // Define content sections
  defineContentSections(outline) {
    return outline.map(section => ({
      ...section,
      targetWords: this.calculateSectionWordCount(section.level),
      keyPoints: this.generateKeyPoints(section),
      conversionElements: this.defineConversionElements(section)
    }));
  }

  // Calculate word count per section
  calculateSectionWordCount(level) {
    const baseWordCount = 2000; // Total target
    const h2Sections = 4;
    const h3Sections = 5;
    
    if (level === 'H2') {
      return Math.floor(baseWordCount / (h2Sections + h3Sections * 0.6));
    } else {
      return Math.floor(baseWordCount / (h2Sections + h3Sections * 0.6) * 0.6);
    }
  }

  // Generate key points for each section
  generateKeyPoints(section) {
    const keyPointsMap = {
      'Understanding': ['Definition and scope', 'Industry applications', 'Technical requirements'],
      'Key Components': ['Core technologies', 'Integration methods', 'Performance factors'],
      'Industry Trends': ['Market drivers', 'Technology evolution', 'Competitive landscape'],
      'Implementation': ['Planning phase', 'Execution strategy', 'Quality assurance'],
      'ROI Analysis': ['Cost considerations', 'Benefit calculation', 'Payback period'],
      'Future Outlook': ['Technology roadmap', 'Market predictions', 'Strategic recommendations']
    };
    
    const sectionType = Object.keys(keyPointsMap).find(key => 
      section.title.includes(key)
    );
    
    return keyPointsMap[sectionType] || ['Key point 1', 'Key point 2', 'Key point 3'];
  }

  // Define conversion elements
  defineConversionElements(section) {
    return {
      ctaType: this.determineCTAType(section),
      productLinks: this.mapProductLinks(section),
      trustSignals: this.generateTrustSignals(section)
    };
  }

  // Determine CTA type based on section
  determineCTAType(section) {
    if (section.title.includes('Implementation') || section.title.includes('Best Practices')) {
      return 'product_recommendation';
    } else if (section.title.includes('ROI') || section.title.includes('Business Impact')) {
      return 'consultation_request';
    } else {
      return 'learn_more';
    }
  }

  // Map product links to sections
  mapProductLinks(section) {
    const productMap = {
      'HMI': '/collections/hmi-solutions',
      'IoT': '/collections/iot-sensors', 
      'Measurement': '/collections/measurement-systems',
      'Embedded': '/collections/embedded-hardware'
    };
    
    const category = this.outlectaCategories.find(cat => 
      section.title.includes(cat) || section.keywords.some(k => k.includes(cat))
    );
    
    return category ? productMap[category] : '/collections/industrial-automation';
  }

  // Generate trust signals
  generateTrustSignals(trustSignals) {
    // Ensure trustSignals is an array
    const signals = Array.isArray(trustSignals) ? trustSignals : [
      'ISO 9001 Certified',
      'Industry Leading Quality',
      'Expert Technical Support',
      'Proven Track Record'
    ];
    
    return `
<div class="trust-signals">
<p><strong>Why Choose Outlecta:</strong></p>
<ul>
${signals.map(signal => `<li>${signal}</li>`).join('\n')}
</ul>
</div>
`;
  }

  // Define conversion points
  defineConversionPoints(blogIdea) {
    return [
      {
        position: 'intro',
        type: 'value_proposition',
        content: 'Expert insights and proven solutions'
      },
      {
        position: 'mid_content',
        type: 'product_showcase',
        content: 'Related industrial solutions'
      },
      {
        position: 'conclusion',
        type: 'strong_cta',
        content: 'Get expert consultation and solutions'
      }
    ];
  }

  // Generate supreme content
  async generateSupremeContent(blogIdea, contentStructure) {
    const { outline, sections, targetWordCount, conversionPoints } = contentStructure;
    
    // Generate introduction with hook
    const introduction = this.generateIntroduction(blogIdea, conversionPoints[0]);
    
    // Generate main content sections
    const mainContent = await this.generateMainContent(sections, conversionPoints[1]);
    
    // Generate conclusion with strong CTA
    const conclusion = this.generateConclusion(blogIdea, conversionPoints[2]);
    
    // Combine all content
    const fullContent = introduction + mainContent + conclusion;
    
    // Ensure target word count
    const finalContent = this.adjustWordCount(fullContent, targetWordCount);
    
    return {
      content: finalContent,
      wordCount: this.countWords(finalContent),
      sections: sections,
      outline: outline
    };
  }

  // Generate compelling introduction (100-150 words)
  generateIntroduction(blogIdea, conversionPoint) {
    const primaryKeyword = blogIdea.keywords && blogIdea.keywords.length > 0 ? blogIdea.keywords[0] : 'industrial automation';
    const painPoint = this.identifyPainPoint(blogIdea.type);
    const roiPromise = this.generateROIPromise(blogIdea.type);
    
    const intro = `
<h2>${blogIdea.title}</h2>

<p>In today's rapidly evolving industrial landscape, ${painPoint}. As ${this.currentYear} unfolds, organizations face unprecedented challenges in optimizing their ${primaryKeyword} strategies while maintaining competitive advantage and operational excellence.</p>

<p>This comprehensive guide delivers expert insights, proven methodologies, and actionable strategies that will transform your approach to ${primaryKeyword}. Whether you're implementing new systems or optimizing existing infrastructure, the insights shared here will help you achieve measurable improvements in efficiency, accuracy, and ROI.</p>

<p>${roiPromise} By understanding the latest trends, technologies, and best practices, you'll be equipped to make informed decisions that drive sustainable growth and operational excellence.</p>
`;
    
    return intro;
  }

  // Identify pain point based on content type
  identifyPainPoint(type) {
    const painPoints = {
      'trend': 'staying ahead of technological advancements requires strategic foresight and expert knowledge',
      'technical': 'complex technical requirements demand specialized expertise and proven solutions',
      'how-to': 'implementation challenges often lead to costly delays and suboptimal performance',
      'explainer': 'lack of understanding can result in poor decision-making and missed opportunities',
      'beginner': 'getting started without proper guidance can lead to costly mistakes and inefficiencies',
      'monthly-update': 'keeping pace with industry changes requires continuous learning and adaptation'
    };
    
    return painPoints[type] || 'achieving optimal performance requires expert knowledge and proven strategies';
  }

  // Generate ROI promise
  generateROIPromise(type) {
    const promises = {
      'trend': 'You can expect 20-40% improvements in operational efficiency and 15-25% reduction in implementation costs',
      'technical': 'Proper implementation can deliver 30-50% performance improvements and 25-35% cost savings',
      'how-to': 'Following these best practices can reduce implementation time by 40-60% and improve success rates by 80%',
      'explainer': 'Understanding these principles can prevent costly mistakes and accelerate decision-making by 50-70%',
      'beginner': 'Starting with the right foundation can save 60-80% in rework costs and accelerate time-to-value by 3-6 months',
      'monthly-update': 'Staying current with trends can provide 25-45% competitive advantage and 20-30% faster market response'
    };
    
    return promises[type] || 'You can achieve significant improvements in efficiency, accuracy, and cost-effectiveness';
  }

  // Generate main content sections
  async generateMainContent(sections, conversionPoint) {
    let mainContent = '';
    
    for (const section of sections) {
      const sectionContent = await this.generateSectionContent(section, conversionPoint);
      mainContent += sectionContent;
    }
    
    return mainContent;
  }

  // Generate individual section content
  async generateSectionContent(section, conversionPoint) {
    const { level, title, keywords, targetWords, keyPoints, conversionElements } = section;
    
    let content = `\n<${level.toLowerCase()}>${title}</${level.toLowerCase()}>\n\n`;
    
    // Generate content for each key point
    for (const point of keyPoints) {
      const pointContent = await this.generateKeyPointContent(point, keywords, targetWords / keyPoints.length);
      content += pointContent;
    }
    
    // Add conversion elements
    if (conversionElements.ctaType === 'product_recommendation') {
      content += this.generateProductCTA(conversionElements);
    }
    
    // Add trust signals
    content += this.generateTrustSignals(conversionElements.trustSignals);
    
    return content;
  }

  // Generate content for individual key points
  async generateKeyPointContent(point, keywords, targetWords) {
    const primaryKeyword = keywords && keywords.length > 0 ? keywords[0] : 'industrial automation';
    const secondaryKeyword = keywords && keywords.length > 1 ? keywords[1] : 'industrial technology';
    
    // Create varied content templates to prevent repetition
    const contentTemplates = [
      {
        intro: `${primaryKeyword} has emerged as a critical component in modern ${secondaryKeyword} strategies.`,
        body: `Organizations implementing this technology must consider several key factors to ensure successful deployment and optimal performance.`,
        considerations: [
          'System compatibility and integration requirements',
          'Performance benchmarks and quality standards',
          'Operational efficiency and workflow optimization',
          'Long-term maintenance and support protocols',
          'Investment analysis and return on investment metrics'
        ],
        conclusion: `Successful implementation requires careful planning and expert guidance to maximize benefits and minimize risks.`
      },
      {
        intro: `The adoption of ${primaryKeyword} represents a significant advancement in ${secondaryKeyword} capabilities.`,
        body: `This technology enables organizations to achieve higher levels of precision, efficiency, and reliability in their operations.`,
        considerations: [
          'Technical specifications and system requirements',
          'Integration with existing operational infrastructure',
          'Performance monitoring and quality control measures',
          'Preventive maintenance and lifecycle management',
          'Cost-benefit analysis and strategic planning'
        ],
        conclusion: `Proper implementation and ongoing optimization are essential for realizing the full potential of this technology.`
      },
      {
        intro: `${primaryKeyword} continues to evolve, offering new opportunities for ${secondaryKeyword} enhancement.`,
        body: `Modern implementations focus on creating scalable, sustainable solutions that adapt to changing business needs.`,
        considerations: [
          'Scalability and future-proofing considerations',
          'Compliance with industry standards and regulations',
          'Data management and security protocols',
          'Training requirements and skill development',
          'Performance optimization and continuous improvement'
        ],
        conclusion: `Strategic planning and expert consultation ensure successful technology adoption and long-term value creation.`
      }
    ];
    
    // Select template based on point and keywords to ensure variety
    const templateIndex = (point.length + primaryKeyword.length) % contentTemplates.length;
    const template = contentTemplates[templateIndex];
    
    const content = `
<p><strong>${point}:</strong> ${template.intro} ${template.body}</p>

<p>Essential factors to consider include:</p>
<ul>
${template.considerations.map(consideration => `<li>${consideration}</li>`).join('\n')}
</ul>

<p>${template.conclusion}</p>
`;
    
    return content;
  }

  // Generate product CTA
  generateProductCTA(conversionElements) {
    return `
<div class="product-recommendation">
<p><strong>Recommended Solution:</strong> Explore our comprehensive range of ${conversionElements.productLinks.includes('hmi') ? 'HMI solutions' : 'industrial automation products'} designed to meet your specific requirements. Our expert team can provide customized recommendations based on your unique needs.</p>
<p><a href="${conversionElements.productLinks}" class="cta-button">View Solutions</a></p>
</div>
`;
  }

  // Generate trust signals
  generateTrustSignals(trustSignals) {
    // Ensure trustSignals is an array
    const signals = Array.isArray(trustSignals) ? trustSignals : [
      'ISO 9001 Certified',
      'Industry Leading Quality',
      'Expert Technical Support',
      'Proven Track Record'
    ];
    
    return `
<div class="trust-signals">
<p><strong>Why Choose Outlecta:</strong></p>
<ul>
${signals.map(signal => `<li>${signal}</li>`).join('\n')}
</ul>
</div>
`;
  }

  // Generate conclusion with strong CTA
  generateConclusion(blogIdea, conversionPoint) {
    const primaryKeyword = blogIdea.keywords[0];
    
    const conclusion = `
<h2>Conclusion and Next Steps</h2>

<p>${primaryKeyword} continues to evolve rapidly, presenting both challenges and opportunities for industrial organizations. By implementing the strategies and best practices outlined in this guide, you can position your organization for success in an increasingly competitive landscape.</p>

<p>The key to success lies in choosing the right solutions and working with experienced partners who understand your unique requirements. Outlecta's comprehensive range of industrial automation solutions, backed by expert technical support and proven track record, can help you achieve your goals.</p>

<div class="strong-cta">
<p><strong>Ready to transform your ${primaryKeyword} strategy?</strong></p>
<p>Contact our expert team today for personalized consultation and customized solutions that drive measurable results.</p>
<p><a href="/pages/contact" class="cta-button-primary">Get Expert Consultation</a> | <a href="/collections/industrial-automation" class="cta-button-secondary">Explore Solutions</a></p>
</div>
`;
    
    return conclusion;
  }

  // Adjust word count to target
  adjustWordCount(content, targetWordCount) {
    const currentWords = this.countWords(content);
    
    if (currentWords >= targetWordCount * 0.9 && currentWords <= targetWordCount * 1.1) {
      return content; // Within acceptable range
    }
    
    if (currentWords < targetWordCount) {
      // Add more content
      const additionalContent = this.generateAdditionalContent(targetWordCount - currentWords);
      return content + additionalContent;
    } else {
      // Trim content
      return this.trimContent(content, targetWordCount);
    }
  }

  // Intelligent content analysis and rewriting
  async analyzeAndRewriteContent(article, blogIdea) {
    console.log("🧠 Starting intelligent content analysis and rewriting...");
    
    try {
      // Analyze content for repetitions and quality issues
      const analysis = await this.contentAnalyzer.analyzeContent(article.content, blogIdea);
      
      if (analysis.needsRewrite) {
        console.log("🔄 Content needs improvement - starting intelligent rewriting...");
        console.log(`📋 Issues found: ${analysis.issues.join(', ')}`);
        
        // Rewrite content with multiple attempts
        const rewrittenContent = await this.contentAnalyzer.rewriteContent(article.content, blogIdea);
        
        // Re-analyze after rewrite
        const finalAnalysis = await this.contentAnalyzer.analyzeContent(rewrittenContent, blogIdea);
        
        console.log("📊 Final content analysis:");
        console.log(`   - Repetitions: ${finalAnalysis.repetitions.length}`);
        console.log(`   - Quality Issues: ${finalAnalysis.qualityIssues.length}`);
        console.log(`   - Readability: ${finalAnalysis.readability}/100`);
        console.log(`   - Uniqueness: ${(finalAnalysis.uniqueness * 100).toFixed(1)}%`);
        
        return {
          ...article,
          content: rewrittenContent,
          contentAnalysis: finalAnalysis
        };
      } else {
        console.log("✅ Content quality is excellent - no rewriting needed");
        return {
          ...article,
          contentAnalysis: analysis
        };
      }
      
    } catch (error) {
      console.warn("⚠️ Could not analyze/rewrite content:", error.message);
      return article; // Return original content if analysis fails
    }
  }

  // Validate and fix internal links in content
  async validateInternalLinks(article, keywords) {
    console.log("🔗 Validating internal links in article...");
    
    try {
      // Validate and fix internal links
      const validatedContent = await this.linkValidator.validateAndFixInternalLinks(article.content, keywords);
      
      return {
        ...article,
        content: validatedContent
      };
      
    } catch (error) {
      console.warn("⚠️ Could not validate internal links:", error.message);
      // Remove any internal link placeholders if validation fails
      const cleanedContent = article.content.replace(/\[internal-link:[^\]]+\]/gi, '');
      return {
        ...article,
        content: cleanedContent
      };
    }
  }

  // Generate additional content
  generateAdditionalContent(neededWords) {
    const additionalSections = [
      {
        title: 'Additional Considerations',
        content: `
<h3>Additional Considerations</h3>
<p>When implementing industrial automation solutions, several additional factors should be considered to ensure optimal performance and long-term success. These include regulatory compliance, safety requirements, and scalability considerations.</p>
<p>Organizations must also evaluate their internal capabilities and determine whether additional training or external support is required. This comprehensive approach ensures successful implementation and maximum return on investment.</p>
`
      },
      {
        title: 'Performance Optimization',
        content: `
<h3>Performance Optimization Strategies</h3>
<p>Optimizing performance requires continuous monitoring and adjustment of system parameters. Regular maintenance and calibration ensure consistent operation and prevent costly downtime.</p>
<p>Advanced analytics and predictive maintenance technologies can further enhance performance and reduce operational costs. These tools provide valuable insights into system behavior and enable proactive maintenance strategies.</p>
`
      }
    ];
    
    let additionalContent = '';
    for (const section of additionalSections) {
      if (this.countWords(additionalContent) < neededWords) {
        additionalContent += section.content;
      }
    }
    
    return additionalContent;
  }

  // Trim content to target word count
  trimContent(content, targetWordCount) {
    const paragraphs = content.split('</p>');
    let trimmedContent = '';
    let wordCount = 0;
    
    for (const paragraph of paragraphs) {
      const paragraphWords = this.countWords(paragraph);
      if (wordCount + paragraphWords <= targetWordCount) {
        trimmedContent += paragraph + '</p>';
        wordCount += paragraphWords;
      } else {
        break;
      }
    }
    
    return trimmedContent;
  }

  // Count words in text
  countWords(text) {
    return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  }

  // Optimize content for SEO
  optimizeForSEO(article, seoStrategy) {
    const { primaryKeywords, secondaryKeywords, semanticKeywords } = seoStrategy;
    
    // Optimize keyword density
    let optimizedContent = this.optimizeKeywordDensity(article.content, primaryKeywords, secondaryKeywords);
    
    // Add semantic keywords naturally
    optimizedContent = this.integrateSemanticKeywords(optimizedContent, semanticKeywords);
    
    // Optimize internal linking
    optimizedContent = this.optimizeInternalLinking(optimizedContent, seoStrategy.internalLinks);
    
    // Add external references
    optimizedContent = this.addExternalReferences(optimizedContent, seoStrategy.externalReferences);
    
    return {
      ...article,
      content: optimizedContent,
      seoOptimized: true
    };
  }

  // Optimize keyword density
  optimizeKeywordDensity(content, primaryKeywords, secondaryKeywords) {
    let optimizedContent = content;
    
    // Ensure primary keywords appear naturally
    primaryKeywords.forEach(keyword => {
      const keywordRegex = new RegExp(keyword, 'gi');
      const matches = optimizedContent.match(keywordRegex);
      const targetDensity = 0.02; // 2% density
      const currentDensity = matches ? matches.length / this.countWords(optimizedContent) : 0;
      
      if (currentDensity < targetDensity) {
        // Add keyword naturally in context
        optimizedContent = this.addKeywordNaturally(optimizedContent, keyword);
      }
    });
    
    return optimizedContent;
  }

  // Add keyword naturally
  addKeywordNaturally(content, keyword) {
    const sentences = content.split('.');
    const keywordVariations = [
      keyword,
      keyword.replace(/\s+/g, ' '),
      keyword.toLowerCase(),
      keyword.replace(/\b\w/g, l => l.toUpperCase())
    ];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const hasKeyword = keywordVariations.some(variation => 
        sentence.toLowerCase().includes(variation.toLowerCase())
      );
      
      if (!hasKeyword && sentence.length > 50) {
        // Add keyword naturally to sentence
        const words = sentence.split(' ');
        const insertIndex = Math.floor(words.length / 2);
        words.splice(insertIndex, 0, keyword);
        sentences[i] = words.join(' ');
        break;
      }
    }
    
    return sentences.join('.');
  }

  // Integrate semantic keywords
  integrateSemanticKeywords(content, semanticKeywords) {
    let optimizedContent = content;
    
    semanticKeywords.forEach(keyword => {
      if (!optimizedContent.toLowerCase().includes(keyword.toLowerCase())) {
        // Add semantic keyword in context
        optimizedContent = this.addSemanticKeyword(optimizedContent, keyword);
      }
    });
    
    return optimizedContent;
  }

  // Add semantic keyword
  addSemanticKeyword(content, keyword) {
    const contextMap = {
      'best practices': 'following industry best practices ensures optimal performance',
      'implementation': 'proper implementation requires careful planning and execution',
      'technical specifications': 'understanding technical specifications is crucial for success',
      'industry standards': 'compliance with industry standards ensures quality and reliability',
      'performance metrics': 'monitoring performance metrics provides valuable insights',
      'cost optimization': 'cost optimization strategies help maximize return on investment'
    };
    
    const context = contextMap[keyword] || `considering ${keyword} is essential for success`;
    
    // Add context sentence
    const paragraphs = content.split('</p>');
    const insertIndex = Math.floor(paragraphs.length / 2);
    paragraphs.splice(insertIndex, 0, `<p>${context}.</p>`);
    
    return paragraphs.join('</p>');
  }

  // Optimize internal linking
  optimizeInternalLinking(content, internalLinks) {
    let optimizedContent = content;
    
    internalLinks.forEach(link => {
      const linkRegex = new RegExp(link.anchor, 'gi');
      if (optimizedContent.match(linkRegex)) {
        optimizedContent = optimizedContent.replace(
          linkRegex,
          `<a href="${link.url}">${link.anchor}</a>`
        );
      }
    });
    
    return optimizedContent;
  }

  // Add external references
  addExternalReferences(content, externalReferences) {
    let optimizedContent = content;
    
    // Add reference section
    const referenceSection = `
<h3>References and Further Reading</h3>
<p>For more information on industrial automation and technology standards, consult these authoritative sources:</p>
<ul>
${externalReferences.map(ref => `<li><a href="${ref.url}" target="_blank" rel="noopener">${ref.anchor}</a></li>`).join('\n')}
</ul>
`;
    
    // Insert before conclusion
    const conclusionIndex = optimizedContent.lastIndexOf('<h2>Conclusion');
    if (conclusionIndex !== -1) {
      optimizedContent = optimizedContent.slice(0, conclusionIndex) + 
                        referenceSection + 
                        optimizedContent.slice(conclusionIndex);
    } else {
      optimizedContent += referenceSection;
    }
    
    return optimizedContent;
  }

  // Calculate quality metrics
  calculateQualityMetrics(article) {
    const wordCount = this.countWords(article.content);
    const readabilityScore = this.calculateReadability(article.content);
    const engagementScore = this.calculateEngagement(article.content);
    const seoScore = this.calculateSEOScore(article);
    
    return {
      wordCount,
      readabilityScore,
      engagementScore,
      seoScore,
      overallScore: Math.round((readabilityScore + engagementScore + seoScore) / 3)
    };
  }

  // Calculate readability score
  calculateReadability(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(content);
    
    if (sentences.length === 0 || words.length === 0) {
      return 50; // Default score
    }
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-100 scale
    return Math.max(0, Math.min(100, Math.round(fleschScore)));
  }

  // Count syllables
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;
    
    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length <= 3) {
        syllableCount += 1;
      } else {
        const matches = word.match(/[aeiouy]+/g);
        syllableCount += matches ? matches.length : 1;
      }
    });
    
    return syllableCount;
  }

  // Calculate engagement score
  calculateEngagement(content) {
    let score = 50; // Base score
    
    // Check for engaging elements
    if (content.includes('<strong>')) score += 10;
    if (content.includes('<ul>')) score += 10;
    if (content.includes('<h2>')) score += 10;
    if (content.includes('<h3>')) score += 10;
    if (content.includes('cta-button')) score += 10;
    if (content.includes('trust-signals')) score += 10;
    if (content.includes('product-recommendation')) score += 10;
    
    return Math.min(100, score);
  }

  // Calculate SEO score
  calculateSEOScore(article) {
    let score = 50; // Base score
    
    // Check SEO elements
    if (article.wordCount >= 1800) score += 10;
    if (article.content.includes('<h2>')) score += 10;
    if (article.content.includes('<h3>')) score += 10;
    if (article.content.includes('<a href=')) score += 10;
    if (article.content.includes('<strong>')) score += 10;
    if (article.seoTitle && article.seoTitle.length <= 60) score += 10;
    if (article.metaDescription && article.metaDescription.length <= 150) score += 10;
    
    return Math.min(100, score);
  }

  // Generate excerpt from content
  generateExcerpt(content) {
    // Remove HTML tags and get first 200 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    const excerpt = plainText.substring(0, 200).trim();
    
    // Add ellipsis if truncated
    return excerpt.length === 200 ? excerpt + '...' : excerpt;
  }

}

export default BlogGenerator;
