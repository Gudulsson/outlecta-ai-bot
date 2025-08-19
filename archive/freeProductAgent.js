import dotenv from "dotenv";
dotenv.config();

// Predefined templates for different product categories
const PRODUCT_TEMPLATES = {
  "panel pc": {
    keywords: ["industrial touch screen", "rugged display", "hmi display", "industrial computer", "factory automation"],
    competitors: ["Advantech", "Beckhoff", "Siemens", "Allen Bradley"],
    usps: ["rugged construction", "wide temperature range", "IP65 protection", "industrial reliability"],
    seoTemplate: "The {product} delivers exceptional performance for {keywords}. Built with {usps}, this {category} solution provides reliable operation in demanding industrial environments.",
    detailedTemplate: "The {product} is a high-performance {category} designed for industrial applications. Featuring {usps}, this robust solution ensures reliable operation in harsh environments. Perfect for {keywords} applications, it offers superior durability and performance compared to standard alternatives.",
    metaTemplate: "{product} - Industrial {category} for {keywords}. {usps}."
  },
  "load cell": {
    keywords: ["force measurement", "weight sensor", "strain gauge", "industrial scale", "precision measurement"],
    competitors: ["HBM", "Vishay", "TML", "Flintec"],
    usps: ["high accuracy", "rugged design", "wide capacity range", "temperature compensation"],
    seoTemplate: "The {product} provides precise {keywords} capabilities. Engineered with {usps}, this {category} ensures accurate measurements in challenging industrial conditions.",
    detailedTemplate: "The {product} is a precision {category} designed for demanding industrial applications. With {usps}, it delivers reliable and accurate {keywords} performance. Built to withstand harsh environments, this sensor provides consistent results for critical measurement applications.",
    metaTemplate: "{product} - Precision {category} for {keywords}. {usps}."
  },
  "monitor stand": {
    keywords: ["monitor mount", "desk mount", "vesa mount", "industrial display", "ergonomic solution"],
    competitors: ["Ergotron", "Humanscale", "Herman Miller"],
    usps: ["adjustable design", "heavy duty construction", "easy installation", "versatile mounting"],
    seoTemplate: "The {product} offers flexible {keywords} solutions. Designed with {usps}, this {category} provides ergonomic positioning for industrial displays.",
    detailedTemplate: "The {product} is a versatile {category} designed for industrial and commercial applications. Featuring {usps}, it provides flexible positioning for various display sizes. This robust mounting solution ensures secure and adjustable support for demanding environments.",
    metaTemplate: "{product} - Adjustable {category} for {keywords}. {usps}."
  },
  "power cable": {
    keywords: ["industrial power", "electrical cable", "power supply", "industrial connector", "reliable power"],
    competitors: ["Phoenix Contact", "Weidmüller", "Harting"],
    usps: ["industrial grade", "reliable connection", "durable construction", "safety certified"],
    seoTemplate: "The {product} delivers reliable {keywords} for industrial applications. Built with {usps}, this {category} ensures safe and consistent power delivery.",
    detailedTemplate: "The {product} is a professional-grade {category} designed for industrial power applications. With {usps}, it provides reliable and safe {keywords} solutions. This durable cable is engineered to withstand demanding industrial environments while maintaining optimal performance.",
    metaTemplate: "{product} - Industrial {category} for {keywords}. {usps}."
  },
  "weight indicator": {
    keywords: ["weight measurement", "industrial scale", "digital indicator", "precision weighing", "process control"],
    competitors: ["Mettler Toledo", "Sartorius", "Ohaus"],
    usps: ["high precision", "user-friendly interface", "multiple functions", "industrial reliability"],
    seoTemplate: "The {product} provides accurate {keywords} for industrial applications. Featuring {usps}, this {category} ensures precise measurements in demanding environments.",
    detailedTemplate: "The {product} is a sophisticated {category} designed for industrial weighing applications. With {usps}, it delivers precise and reliable {keywords} performance. This advanced indicator offers multiple functions and user-friendly operation for complex industrial processes.",
    metaTemplate: "{product} - Precision {category} for {keywords}. {usps}."
  }
};

// Smart category detection
function detectCategory(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes("panel pc") || name.includes("touch") || name.includes("display")) return "panel pc";
  if (name.includes("load cell") || name.includes("strain") || name.includes("sensor")) return "load cell";
  if (name.includes("stand") || name.includes("mount") || name.includes("vesa")) return "monitor stand";
  if (name.includes("cable") || name.includes("power") || name.includes("plug")) return "power cable";
  if (name.includes("indicator") || name.includes("weight") || name.includes("scale")) return "weight indicator";
  
  return "industrial equipment"; // default
}

// Smart keyword generation
function generateKeywords(productName, category) {
  const template = PRODUCT_TEMPLATES[category];
  if (template) {
    return template.keywords;
  }
  
  // Fallback keywords
  return ["industrial equipment", "professional grade", "industrial solution", "reliable performance", "quality assurance"];
}

// Smart competitor analysis
function analyzeCompetitors(productName, category) {
  const template = PRODUCT_TEMPLATES[category];
  if (template) {
    return template.competitors;
  }
  
  return ["leading alternatives", "industry standards", "professional solutions"];
}

// Smart USP generation
function generateUSPs(productName, category) {
  const template = PRODUCT_TEMPLATES[category];
  if (template) {
    return template.usps;
  }
  
  return ["reliable performance", "industrial-grade build", "quality assurance", "professional design"];
}

// Template-based content generation
function generateFromTemplate(template, productName, category, keywords, usps) {
  if (!template) return "";
  
  return template
    .replace(/{product}/g, productName)
    .replace(/{category}/g, category)
    .replace(/{keywords}/g, keywords.slice(0, 3).join(", "))
    .replace(/{usps}/g, usps.slice(0, 2).join(", "));
}

export async function generateAllContent(productName, category) {
  try {
    console.log(`🔍 SEARCH ANALYSIS FOR: ${productName}`);
    
    // Smart category detection
    const detectedCategory = detectCategory(productName);
    const finalCategory = category || detectedCategory;
    
    // Generate analysis
    const keywords = generateKeywords(productName, finalCategory);
    const competitors = analyzeCompetitors(productName, finalCategory);
    const usps = generateUSPs(productName, finalCategory);
    
    const analysis = {
      volume: "medium",
      competition: "medium",
      bestKeywords: keywords,
      competitors: competitors,
      usp: usps
    };
    
    console.log(`📊 Volume: ${analysis.volume}, Competition: ${analysis.competition}`);
    console.log(`🎯 Target Keywords: ${analysis.bestKeywords.join(", ")}`);
    console.log(`🏆 Competitors: ${analysis.competitors.join(", ")}`);
    console.log(`✨ USPs: ${analysis.usp.join(", ")}`);
    
      // Get template for category
  const template = PRODUCT_TEMPLATES[finalCategory] || {
    seoTemplate: "The {product} delivers exceptional performance for {keywords}. Built with {usps}, this {category} solution provides reliable operation in demanding industrial environments.",
    detailedTemplate: "The {product} is a high-performance {category} designed for industrial applications. Featuring {usps}, this robust solution ensures reliable operation in harsh environments. Perfect for {keywords} applications, it offers superior durability and performance compared to standard alternatives.",
    metaTemplate: "{product} - Industrial {category} for {keywords}. {usps}."
  };
    
    // Generate content using templates
    const seoDescription = generateFromTemplate(
      template.seoTemplate,
      productName,
      finalCategory,
      keywords,
      usps
    );
    
    const detailedDescription = generateFromTemplate(
      template.detailedTemplate,
      productName,
      finalCategory,
      keywords,
      usps
    );
    
    const metaDescription = generateFromTemplate(
      template.metaTemplate,
      productName,
      finalCategory,
      keywords,
      usps
    );
    
    return {
      seoDescription,
      detailedDescription,
      metaDescription,
      analysis
    };
  } catch (error) {
    console.error("Content generation failed:", error.message);
    return null;
  }
}

export async function analyzeSearchTerms(productName, category) {
  const detectedCategory = detectCategory(productName);
  const finalCategory = category || detectedCategory;
  
  return {
    volume: "medium",
    competition: "medium",
    bestKeywords: generateKeywords(productName, finalCategory),
    competitors: analyzeCompetitors(productName, finalCategory),
    usp: generateUSPs(productName, finalCategory)
  };
}
