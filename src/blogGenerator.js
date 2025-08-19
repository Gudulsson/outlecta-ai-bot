import { generateAllContent } from "./webSearchAI.js";
import { generateThumbnail as buildThumbnail } from "./thumbnail.js";

// Enhanced Blog Generator - Creates human-like, engaging content
class BlogGenerator {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.writingStyles = {
      conversational: this.getConversationalStyle(),
      technical: this.getTechnicalStyle(),
      storytelling: this.getStorytellingStyle(),
      analytical: this.getAnalyticalStyle()
    };
  }

  // Generate a complete blog article with human-like quality
  async generateBlogArticle(blogIdea) {
    console.log(`📝 Generating human-like blog article: ${blogIdea.title}`);
    
    // Choose writing style based on article type
    const style = this.selectWritingStyle(blogIdea.type);
    const article = await this.createHumanLikeContent(blogIdea, style);
    const thumbnail = await buildThumbnail(blogIdea).catch(() => this.generateThumbnail(blogIdea));
    
    // Create article with enhanced metadata
    const enhancedArticle = {
      title: blogIdea.title,
      content: article.content,
      excerpt: article.excerpt,
      keywords: blogIdea.keywords,
      category: blogIdea.category,
      type: blogIdea.type,
      seoTitle: this.generateSEOTitle(blogIdea.title),
      metaDescription: this.generateMetaDescription(article.excerpt, blogIdea.keywords),
      tags: this.generateTags(blogIdea.keywords, blogIdea.category),
      publishDate: new Date().toISOString(),
      wordCount: this.countWords(article.content),
      thumbnail,
      writingStyle: style.name,
      readabilityScore: this.calculateReadability(article.content),
      engagementScore: this.calculateEngagement(article.content)
    };

    console.log(`✅ Human-like article generated!`);
    console.log(`📊 Word count: ${enhancedArticle.wordCount} words`);
    console.log(`📖 Readability score: ${enhancedArticle.readabilityScore}/100`);
    console.log(`🎯 Engagement score: ${enhancedArticle.engagementScore}/100`);
    
    return enhancedArticle;
  }

  // Select appropriate writing style
  selectWritingStyle(articleType) {
    const styleMap = {
      'how-to': this.writingStyles.conversational,
      'trend': this.writingStyles.analytical,
      'technical': this.writingStyles.technical,
      'comparison': this.writingStyles.analytical,
      'spotlight': this.writingStyles.storytelling,
      'explainer': this.writingStyles.conversational,
      'beginner': this.writingStyles.conversational,
      'general': this.writingStyles.conversational
    };
    
    return styleMap[articleType] || this.writingStyles.conversational;
  }

  // Create human-like content with natural flow
  async createHumanLikeContent(blogIdea, style) {
    const { title, keywords, products, category, type } = blogIdea;
    
    // Generate content with natural storytelling
    const content = await this.generateNaturalContent(title, keywords, products, category, type, style);
    
    // Generate engaging excerpt
    const excerpt = this.generateEngagingExcerpt(content);
    
    return {
      content,
      excerpt
    };
  }

  // Generate natural, flowing content
  async generateNaturalContent(title, keywords, products, category, type, style) {
    const sections = [];
    
    // Hook introduction
    sections.push(await this.generateHook(title, category, style));
    
    // Main content based on type
    switch (type) {
      case "trend":
        sections.push(await this.generateTrendContent(title, keywords, category, style));
        break;
      case "how-to":
        sections.push(await this.generateHowToContent(title, keywords, category, style));
        break;
      case "technical":
        sections.push(await this.generateTechnicalContent(title, keywords, category, style));
        break;
      case "comparison":
        sections.push(await this.generateComparisonContent(title, keywords, products, category, style));
        break;
      case "spotlight":
        sections.push(await this.generateSpotlightContent(title, keywords, products, category, style));
        break;
      default:
        sections.push(await this.generateGeneralContent(title, keywords, category, style));
    }
    
    // Engaging conclusion
    sections.push(await this.generateConclusion(title, keywords, category, style));
    
    return sections.join('\n\n');
  }

  // Generate compelling hook
  async generateHook(title, category, style) {
    const hooks = {
      conversational: [
        `<p>Ever found yourself staring at a ${category} spec sheet, wondering if you're making the right choice? You're not alone. In today's fast-paced industrial world, the decisions we make about ${category} can make or break our projects.</p>`,
        `<p>Picture this: It's 3 AM, your production line is down, and you're desperately trying to figure out why your ${category} isn't performing as expected. Sound familiar? Let's dive into what's really happening in the world of ${category} technology.</p>`,
        `<p>${category} technology has evolved dramatically over the past decade. What used to be simple, straightforward decisions have become complex puzzles that require deep understanding and careful consideration.</p>`
      ],
      technical: [
        `<p>The ${category} landscape is undergoing a fundamental transformation, driven by advances in precision engineering and digital integration. Understanding these changes is crucial for maintaining competitive advantage in modern industrial applications.</p>`,
        `<p>As industrial systems become increasingly sophisticated, the role of ${category} technology has expanded beyond basic functionality to become a critical component in overall system performance and reliability.</p>`
      ],
      storytelling: [
        `<p>Last month, I visited a manufacturing facility that was struggling with ${category} reliability issues. The engineers there were facing the same challenges many of us encounter daily. Their story perfectly illustrates why understanding ${category} technology matters more than ever.</p>`,
        `<p>There's a quiet revolution happening in ${category} technology, and most people don't even realize it. The changes are subtle but profound, and they're reshaping how we think about industrial automation.</p>`
      ],
      analytical: [
        `<p>Recent market analysis reveals significant shifts in ${category} adoption patterns across industrial sectors. These changes reflect broader technological trends and evolving business requirements that demand our attention.</p>`,
        `<p>The data is clear: ${category} technology is at a critical inflection point. Industry reports show unprecedented growth in adoption rates, but also reveal concerning gaps in implementation strategies.</p>`
      ]
    };
    
    const availableHooks = hooks[style.name] || hooks.conversational;
    return availableHooks[Math.floor(Math.random() * availableHooks.length)];
  }

  // Generate trend content with real insights
  async generateTrendContent(title, keywords, category, style) {
    const content = [];
    
    // Current state analysis
    content.push(`<h2>The Current State of ${category} Technology</h2>`);
    content.push(`<p>Right now, we're seeing a perfect storm of technological advancement in ${category}. Traditional approaches are being challenged by new methodologies, and companies that adapt quickly are gaining significant advantages.</p>`);
    
    // Key trends with real examples
    content.push(`<h2>Three Game-Changing Trends You Can't Ignore</h2>`);
    
    const trends = [
      {
        title: "Smart Integration and IoT Connectivity",
        description: "The days of standalone ${category} systems are numbered. Modern solutions are increasingly connected, providing real-time data that transforms how we monitor and control industrial processes.",
        impact: "This connectivity enables predictive maintenance, reduces downtime, and provides insights that were previously impossible to obtain."
      },
      {
        title: "Precision and Accuracy at New Levels",
        description: "We're seeing accuracy improvements that would have seemed impossible just five years ago. New calibration techniques and advanced materials are pushing the boundaries of what's achievable.",
        impact: "These improvements are particularly crucial in applications where even minor deviations can have significant consequences."
      },
      {
        title: "Sustainability and Energy Efficiency",
        description: "Environmental concerns are driving innovation in ${category} design. Manufacturers are developing solutions that not only perform better but also consume less energy and have longer lifespans.",
        impact: "This shift isn't just about environmental responsibility—it's about operational efficiency and long-term cost savings."
      }
    ];
    
    trends.forEach((trend, index) => {
      content.push(`<h3>${index + 1}. ${trend.title}</h3>`);
      content.push(`<p>${trend.description}</p>`);
      content.push(`<p><strong>Why this matters:</strong> ${trend.impact}</p>`);
    });
    
    // Practical implications
    content.push(`<h2>What This Means for Your Operations</h2>`);
    content.push(`<p>Understanding these trends isn't just about staying current—it's about making informed decisions that will impact your operations for years to come. Here's what you need to consider:</p>`);
    
    content.push(`<ul>`);
    content.push(`<li><strong>Integration Planning:</strong> How will your new ${category} solutions integrate with existing systems?</li>`);
    content.push(`<li><strong>Training Requirements:</strong> What skills will your team need to effectively utilize these new capabilities?</li>`);
    content.push(`<li><strong>ROI Calculation:</strong> How do you measure the true value of these improvements?</li>`);
    content.push(`<li><strong>Future-Proofing:</strong> Which solutions will remain relevant as technology continues to evolve?</li>`);
    content.push(`</ul>`);
    
    return content.join('\n');
  }

  // Generate how-to content with practical steps
  async generateHowToContent(title, keywords, category, style) {
    const content = [];
    
    content.push(`<h2>Understanding Your ${category} Requirements</h2>`);
    content.push(`<p>Before diving into the technical details, let's take a step back and understand what you're really trying to achieve. The most common mistake I see is jumping straight to specifications without clearly defining the problem you're solving.</p>`);
    
    content.push(`<h2>A Practical Approach to ${category} Selection</h2>`);
    
    const steps = [
      {
        title: "Define Your Real Requirements",
        content: "Start by asking the right questions: What are you actually trying to measure or control? What are the environmental conditions? What's your budget range? These answers will guide your entire selection process."
      },
      {
        title: "Research Current Solutions",
        content: "Don't just look at what's available—understand why certain solutions exist. What problems do they solve? What are their limitations? This context will help you make better decisions."
      },
      {
        title: "Evaluate Total Cost of Ownership",
        content: "The initial purchase price is just the beginning. Consider installation costs, maintenance requirements, calibration needs, and potential upgrade paths. The cheapest option often becomes the most expensive in the long run."
      },
      {
        title: "Plan for Integration",
        content: "How will your new ${category} fit into your existing systems? Consider compatibility, communication protocols, and the learning curve for your team."
      }
    ];
    
    steps.forEach((step, index) => {
      content.push(`<h3>Step ${index + 1}: ${step.title}</h3>`);
      content.push(`<p>${step.content}</p>`);
    });
    
    content.push(`<h2>Common Pitfalls to Avoid</h2>`);
    content.push(`<p>Based on years of experience working with ${category} systems, here are the mistakes I see most often:</p>`);
    
    content.push(`<ul>`);
    content.push(`<li><strong>Over-engineering:</strong> Don't buy more capability than you need. It adds complexity and cost without providing value.</li>`);
    content.push(`<li><strong>Ignoring environmental factors:</strong> Temperature, humidity, vibration, and other conditions can dramatically affect performance.</li>`);
    content.push(`<li><strong>Forgetting about maintenance:</strong> Even the best ${category} needs proper care to maintain accuracy and reliability.</li>`);
    content.push(`<li><strong>Not planning for growth:</strong> Choose solutions that can scale with your needs.</li>`);
    content.push(`</ul>`);
    
    return content.join('\n');
  }

  // Generate technical content with depth
  async generateTechnicalContent(title, keywords, category, style) {
    const content = [];
    
    content.push(`<h2>The Technical Foundation of ${category} Technology</h2>`);
    content.push(`<p>To truly understand ${category} systems, we need to dive deep into the underlying principles. This isn't just about specifications—it's about understanding how and why these systems work the way they do.</p>`);
    
    content.push(`<h2>Core Principles and Operation</h2>`);
    content.push(`<p>At their heart, ${category} systems operate on well-established physical principles. Understanding these fundamentals is crucial for proper selection, installation, and troubleshooting.</p>`);
    
    content.push(`<h3>Measurement Principles</h3>`);
    content.push(`<p>The accuracy and reliability of ${category} systems depend on several key factors:</p>`);
    content.push(`<ul>`);
    content.push(`<li><strong>Signal Conditioning:</strong> Raw sensor outputs must be properly conditioned for accurate measurement</li>`);
    content.push(`<li><strong>Calibration:</strong> Regular calibration ensures measurement accuracy over time</li>`);
    content.push(`<li><strong>Environmental Compensation:</strong> Temperature and other environmental factors must be accounted for</li>`);
    content.push(`<li><strong>Digital Processing:</strong> Modern systems use sophisticated algorithms for signal processing</li>`);
    content.push(`</ul>`);
    
    content.push(`<h2>Advanced Applications and Considerations</h2>`);
    content.push(`<p>Modern ${category} technology finds applications across diverse industrial sectors, each with unique requirements and challenges:</p>`);
    
    const applications = [
      {
        sector: "Manufacturing",
        use: "Quality control and process optimization",
        challenges: "High-speed production environments, strict accuracy requirements"
      },
      {
        sector: "Automotive",
        use: "Testing and validation systems",
        challenges: "Rapid testing cycles, diverse measurement requirements"
      },
      {
        sector: "Aerospace",
        use: "Structural monitoring and safety systems",
        challenges: "Extreme environmental conditions, critical safety requirements"
      },
      {
        sector: "Energy",
        use: "Power generation and distribution monitoring",
        challenges: "Continuous operation, remote monitoring needs"
      }
    ];
    
    applications.forEach(app => {
      content.push(`<h3>${app.sector} Applications</h3>`);
      content.push(`<p><strong>Primary Use:</strong> ${app.use}</p>`);
      content.push(`<p><strong>Key Challenges:</strong> ${app.challenges}</p>`);
    });
    
    return content.join('\n');
  }

  // Generate comparison content with balanced analysis
  async generateComparisonContent(title, keywords, products, category, style) {
    const content = [];
    
    content.push(`<h2>Navigating the ${category} Landscape</h2>`);
    content.push(`<p>With so many ${category} options available, making the right choice can feel overwhelming. Let's break down the key differences and help you understand what really matters for your specific application.</p>`);
    
    if (products && products.length > 0) {
      content.push(`<h2>Detailed Product Analysis</h2>`);
      
      for (let i = 0; i < Math.min(products.length, 3); i++) {
        const product = products[i];
        const productAnalysis = await generateAllContent(product, "");
        
        content.push(`<h3>${product}</h3>`);
        content.push(`<p>Let's examine what makes this ${category} solution stand out:</p>`);
        
        if (productAnalysis?.detailedDescription) {
          content.push(`<p>${productAnalysis.detailedDescription}</p>`);
        }
        
        content.push(`<h4>Key Strengths:</h4>`);
        content.push(`<ul>`);
        content.push(`<li>High precision measurement capabilities</li>`);
        content.push(`<li>Robust industrial construction</li>`);
        content.push(`<li>Wide operating temperature range</li>`);
        content.push(`<li>Easy system integration</li>`);
        content.push(`</ul>`);
      }
    }
    
    content.push(`<h2>Making an Informed Decision</h2>`);
    content.push(`<p>When comparing ${category} solutions, focus on these critical factors:</p>`);
    
    content.push(`<ul>`);
    content.push(`<li><strong>Accuracy Requirements:</strong> What level of precision do you actually need?</li>`);
    content.push(`<li><strong>Environmental Conditions:</strong> Will the system operate in harsh conditions?</li>`);
    content.push(`<li><strong>Integration Complexity:</strong> How easily will it fit into your existing systems?</li>`);
    content.push(`<li><strong>Long-term Reliability:</strong> What's the expected lifespan and maintenance requirements?</li>`);
    content.push(`</ul>`);
    
    return content.join('\n');
  }

  // Generate spotlight content with engaging narrative
  async generateSpotlightContent(title, keywords, products, category, style) {
    const content = [];
    const product = products?.[0];
    
    content.push(`<h2>Spotlight: ${product || category} Innovation</h2>`);
    content.push(`<p>Sometimes a particular ${category} solution deserves special attention. Whether it's breakthrough technology, innovative design, or exceptional performance, these solutions represent the cutting edge of what's possible.</p>`);
    
    if (product) {
      const productAnalysis = await generateAllContent(product, "");
      
      content.push(`<h2>What Makes This Solution Special</h2>`);
      content.push(`<p>The ${product} isn't just another ${category}—it represents a fundamental shift in how we think about ${category} technology. Here's what sets it apart:</p>`);
      
      if (productAnalysis?.detailedDescription) {
        content.push(`<p>${productAnalysis.detailedDescription}</p>`);
      }
      
      content.push(`<h3>Innovation Highlights</h3>`);
      content.push(`<ul>`);
      content.push(`<li>Advanced measurement algorithms that improve accuracy</li>`);
      content.push(`<li>Modular design for easy customization</li>`);
      content.push(`<li>Enhanced connectivity options for modern industrial networks</li>`);
      content.push(`<li>Extended calibration intervals for reduced maintenance</li>`);
      content.push(`</ul>`);
    }
    
    content.push(`<h2>Real-World Impact</h2>`);
    content.push(`<p>The true value of any ${category} solution lies in its real-world performance. When properly implemented, these systems can transform industrial operations, improving efficiency, reducing costs, and enhancing product quality.</p>`);
    
    return content.join('\n');
  }

  // Generate general content with broad appeal
  async generateGeneralContent(title, keywords, category, style) {
    const content = [];
    
    content.push(`<h2>The Bigger Picture: ${category} in Modern Industry</h2>`);
    content.push(`<p>${category} technology doesn't exist in isolation—it's part of a larger ecosystem of industrial automation and control. Understanding this broader context helps us make better decisions about individual components.</p>`);
    
    content.push(`<h2>Key Components of Successful ${category} Implementation</h2>`);
    content.push(`<p>Success in ${category} applications requires more than just choosing the right hardware. It's about creating a complete system that works together seamlessly:</p>`);
    
    content.push(`<ul>`);
    content.push(`<li><strong>Proper Selection:</strong> Matching specifications to actual requirements</li>`);
    content.push(`<li><strong>Correct Installation:</strong> Following manufacturer guidelines and best practices</li>`);
    content.push(`<li><strong>Regular Maintenance:</strong> Scheduled calibration and preventive maintenance</li>`);
    content.push(`<li><strong>Operator Training:</strong> Ensuring your team knows how to use the system effectively</li>`);
    content.push(`<li><strong>Continuous Monitoring:</strong> Tracking performance and identifying issues early</li>`);
    content.push(`</ul>`);
    
    content.push(`<h2>Looking Ahead: The Future of ${category}</h2>`);
    content.push(`<p>As industrial technology continues to evolve, ${category} systems will become even more sophisticated and integrated. Staying informed about these developments helps ensure your operations remain competitive and efficient.</p>`);
    
    return content.join('\n');
  }

  // Generate engaging conclusion
  async generateConclusion(title, keywords, category, style) {
    const conclusions = {
      conversational: [
        `<h2>Wrapping Up: Your Next Steps</h2><p>The world of ${category} technology is complex, but it doesn't have to be overwhelming. Start with what you know, ask the right questions, and don't be afraid to seek expert advice when you need it. The decisions you make today will impact your operations for years to come.</p>`,
        `<h2>Final Thoughts</h2><p>Remember, the best ${category} solution isn't always the most expensive or the most feature-rich—it's the one that solves your specific problem effectively and reliably. Take your time, do your research, and choose wisely.</p>`
      ],
      technical: [
        `<h2>Conclusion: Technical Excellence in Practice</h2><p>Understanding ${category} technology requires both theoretical knowledge and practical experience. The principles we've discussed provide a foundation for making informed decisions that will serve your operations well into the future.</p>`,
        `<h2>Moving Forward</h2><p>As you implement ${category} solutions in your operations, remember that technology is a tool—its value comes from how effectively you use it to achieve your goals.</p>`
      ],
      storytelling: [
        `<h2>The Story Continues</h2><p>Every ${category} installation tells a story—of challenges overcome, problems solved, and efficiency gained. Your story is just beginning, and the choices you make now will shape how it unfolds.</p>`,
        `<h2>Your Journey Ahead</h2><p>The path to optimal ${category} performance is unique for every organization. Use the insights from this guide as a starting point, but don't be afraid to adapt and innovate based on your specific needs.</p>`
      ],
      analytical: [
        `<h2>Data-Driven Decisions</h2><p>The analysis presented here provides a framework for evaluating ${category} options systematically. Use this approach to ensure your decisions are based on facts rather than assumptions.</p>`,
        `<h2>Strategic Implementation</h2><p>Successful ${category} implementation requires both strategic planning and tactical execution. The insights provided here should guide your planning process and help you avoid common pitfalls.</p>`
      ]
    };
    
    const availableConclusions = conclusions[style.name] || conclusions.conversational;
    return availableConclusions[Math.floor(Math.random() * availableConclusions.length)];
  }

  // Generate engaging excerpt
  generateEngagingExcerpt(content) {
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join('. ') + '.';
    } else if (sentences.length >= 1) {
      return sentences[0].substring(0, 200) + (sentences[0].length > 200 ? '...' : '');
    }
    
    return cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : '');
  }

  // Writing style definitions
  getConversationalStyle() {
    return {
      name: 'conversational',
      characteristics: ['personal pronouns', 'questions', 'real examples', 'casual tone']
    };
  }

  getTechnicalStyle() {
    return {
      name: 'technical',
      characteristics: ['precise language', 'detailed explanations', 'professional tone', 'data-driven']
    };
  }

  getStorytellingStyle() {
    return {
      name: 'storytelling',
      characteristics: ['narrative flow', 'real scenarios', 'emotional connection', 'progressive revelation']
    };
  }

  getAnalyticalStyle() {
    return {
      name: 'analytical',
      characteristics: ['data-focused', 'comparative analysis', 'logical structure', 'evidence-based']
    };
  }

  // Utility methods
  generateSEOTitle(title) {
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  generateMetaDescription(excerpt, keywords) {
    const mainKeywords = keywords.slice(0, 3).join(', ');
    const metaDesc = `${excerpt} Learn about ${mainKeywords} and find the best solutions for your industrial needs at Outlecta.com.`;
    return metaDesc.length > 160 ? metaDesc.substring(0, 157) + '...' : metaDesc;
  }

  generateTags(keywords, category) {
    const tags = [...keywords.slice(0, 5), category, 'industrial', 'outlecta'];
    return [...new Set(tags)];
  }

  countWords(content) {
    const cleanContent = content.replace(/<[^>]*>/g, '');
    return cleanContent.split(/\s+/).length;
  }

  calculateReadability(content) {
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const sentences = cleanContent.split(/[.!?]+/).length;
    const words = cleanContent.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Flesch Reading Ease approximation
    let score = 100;
    if (avgWordsPerSentence > 20) score -= 20;
    if (avgWordsPerSentence > 25) score -= 20;
    if (avgWordsPerSentence < 10) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateEngagement(content) {
    let score = 70; // Base score
    
    // Engagement factors
    if (content.includes('?')) score += 10; // Questions
    if (content.includes('!')) score += 5;  // Exclamations
    if (content.includes('you')) score += 10; // Direct address
    if (content.includes('we')) score += 5;   // Inclusive language
    if (content.includes('story') || content.includes('example')) score += 10; // Stories/examples
    
    return Math.max(0, Math.min(100, score));
  }

  // Lightweight SVG thumbnail generator
  generateThumbnail(blogIdea) {
    const title = blogIdea.title.length > 48 ? blogIdea.title.slice(0, 45) + '...' : blogIdea.title;
    const subtitle = (blogIdea.category || blogIdea.type || 'Industrial').toUpperCase();
    const bg = '#0b1f3a';
    const accent = '#2bb673';
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#10264a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1100" cy="-50" r="300" fill="${accent}" opacity="0.12"/>
  <circle cx="-50" cy="580" r="220" fill="${accent}" opacity="0.1"/>
  <text x="60" y="130" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#9fb3c8" letter-spacing="2">OUTLECTA • INDUSTRIAL INSIGHTS</text>
  <text x="60" y="230" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="56" fill="#ffffff">${this.escapeXml(title)}</text>
  <rect x="60" y="270" width="480" height="6" rx="3" fill="${accent}"/>
  <text x="60" y="330" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#cfe6da">${this.escapeXml(subtitle)}</text>
  <g opacity="0.2">
    <rect x="800" y="340" width="320" height="180" rx="12" fill="#2c3e50"/>
    <rect x="820" y="360" width="120" height="12" rx="6" fill="#6aa896"/>
    <rect x="820" y="390" width="260" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="410" width="240" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="430" width="200" height="8" rx="4" fill="#6aa896"/>
  </g>
</svg>`;
    const base64 = Buffer.from(svg, 'utf8').toString('base64');
    const alt = `${blogIdea.title} – Outlecta Industrial Insights thumbnail`;
    return { imageBase64: base64, alt };
  }

  escapeXml(str) {
    return String(str).replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c]));
  }
}

export default BlogGenerator;
