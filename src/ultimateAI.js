import dotenv from "dotenv";
dotenv.config();

// Ultimate AI Model - Human-like product descriptions
const ULTIMATE_TEMPLATES = {
  "power cable": {
    keywords: ["power supply", "electrical cable", "industrial power", "power cord", "electrical connection"],
    usps: ["industrial grade", "reliable connection", "durable construction", "safety certified"],
    humanTemplates: [
      "This {product} is a standard power cable designed for industrial equipment. It features {usps} and provides reliable power delivery for your electrical devices.",
      "The {product} is a quality power cable built for industrial use. With {usps}, it ensures safe and consistent power supply to your equipment.",
      "A reliable {product} that delivers power to industrial devices. Features {usps} for dependable performance in demanding environments."
    ]
  },
  "panel pc": {
    keywords: ["industrial computer", "touch screen", "hmi display", "industrial monitor", "factory automation"],
    usps: ["rugged construction", "wide temperature range", "IP65 protection", "industrial reliability"],
    humanTemplates: [
      "The {product} is an industrial computer designed for factory automation. It features {usps} and provides reliable operation in demanding industrial environments.",
      "This {product} is a rugged touch screen computer built for industrial applications. With {usps}, it delivers consistent performance for HMI and automation tasks.",
      "An industrial-grade {product} that combines computing power with touch screen functionality. Features {usps} for reliable operation in harsh conditions."
    ]
  },
  "load cell": {
    keywords: ["force measurement", "weight sensor", "strain gauge", "precision measurement", "industrial scale"],
    usps: ["high accuracy", "rugged design", "temperature compensation", "long-term stability"],
    humanTemplates: [
      "The {product} is a precision force sensor designed for industrial measurement applications. It features {usps} and provides accurate readings in challenging conditions.",
      "This {product} is a reliable weight sensor built for industrial scales. With {usps}, it delivers consistent and accurate measurements for quality control.",
      "A high-precision {product} that measures force and weight in industrial applications. Features {usps} for dependable performance in demanding environments."
    ]
  },
  "monitor stand": {
    keywords: ["monitor mount", "desk mount", "vesa mount", "display stand", "ergonomic solution"],
    usps: ["adjustable design", "heavy duty construction", "easy installation", "versatile mounting"],
    humanTemplates: [
      "The {product} is a versatile monitor mount designed for industrial displays. It features {usps} and provides flexible positioning for optimal viewing.",
      "This {product} is a sturdy display stand built for industrial monitors. With {usps}, it offers ergonomic positioning and easy adjustment for different screen sizes.",
      "A reliable {product} that securely mounts industrial displays. Features {usps} for flexible positioning and comfortable viewing angles."
    ]
  },
  "weight indicator": {
    keywords: ["weight measurement", "digital indicator", "precision weighing", "industrial scale", "process control"],
    usps: ["high precision", "user-friendly interface", "multiple functions", "industrial reliability"],
    humanTemplates: [
      "The {product} is a digital weight indicator designed for industrial scales. It features {usps} and provides accurate weight readings for process control.",
      "This {product} is a precision weighing display built for industrial applications. With {usps}, it delivers reliable weight measurements for quality control.",
      "A sophisticated {product} that displays weight readings from industrial scales. Features {usps} for accurate and user-friendly operation."
    ]
  },
  "data acquisition": {
    keywords: ["daq system", "data logging", "signal acquisition", "measurement system", "industrial monitoring"],
    usps: ["high speed", "multi-channel", "precise measurement", "real-time processing"],
    humanTemplates: [
      "The {product} is a data acquisition system designed for industrial monitoring. It features {usps} and provides reliable data collection for process control.",
      "This {product} is a professional DAQ system built for industrial applications. With {usps}, it delivers accurate measurements and real-time data logging.",
      "A high-performance {product} that collects and processes industrial data. Features {usps} for reliable monitoring and control applications."
    ]
  },
  "vibration sensor": {
    keywords: ["vibration monitoring", "condition monitoring", "vibration analysis", "machine health", "predictive maintenance"],
    usps: ["high sensitivity", "wide frequency range", "rugged design", "easy installation"],
    humanTemplates: [
      "The {product} is a vibration sensor designed for condition monitoring. It features {usps} and provides reliable vibration measurements for predictive maintenance.",
      "This {product} is a precision vibration monitor built for industrial applications. With {usps}, it delivers accurate vibration analysis for machine health monitoring.",
      "A reliable {product} that measures vibration in industrial equipment. Features {usps} for continuous monitoring and predictive maintenance applications."
    ]
  }
};

// Smart category detection
function detectCategory(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes("cable") || name.includes("power") || name.includes("plug")) return "power cable";
  if (name.includes("panel pc") || name.includes("touch") || name.includes("android")) return "panel pc";
  if (name.includes("load cell") || name.includes("strain") || name.includes("bl inox")) return "load cell";
  if (name.includes("stand") || name.includes("mount") || name.includes("vesa")) return "monitor stand";
  if (name.includes("indicator") || name.includes("sensocar") || name.includes("tare")) return "weight indicator";
  if (name.includes("daq") || name.includes("mcc") || name.includes("data")) return "data acquisition";
  if (name.includes("vibration") || name.includes("monitran")) return "vibration sensor";
  
  return "power cable"; // default fallback
}

// Generate human-like keywords
function generateKeywords(productName, category) {
  const template = ULTIMATE_TEMPLATES[category];
  if (template) {
    return template.keywords;
  }
  
  // Fallback keywords
  return ["industrial equipment", "professional grade", "reliable performance"];
}

// Generate human-like USPs
function generateUSPs(productName, category) {
  const template = ULTIMATE_TEMPLATES[category];
  if (template) {
    return template.usps;
  }
  
  // Fallback USPs
  return ["reliable performance", "industrial grade", "quality construction"];
}

// Ultimate human-like content generation
function generateHumanContent(productName, category) {
  const template = ULTIMATE_TEMPLATES[category];
  if (!template) {
    // Fallback for unknown categories
    return `The ${productName} is industrial equipment designed for professional use. It features reliable performance and quality construction for demanding applications.`;
  }
  
  const keywords = template.keywords;
  const usps = template.usps;
  const humanTemplates = template.humanTemplates;
  
  // Select a random template
  const selectedTemplate = humanTemplates[Math.floor(Math.random() * humanTemplates.length)];
  
  // Replace placeholders with actual content
  let result = selectedTemplate
    .replace(/{product}/g, productName)
    .replace(/{usps}/g, usps.slice(0, 2).join(" and "));
  
  return result;
}

// Generate SEO description (shorter, keyword-focused)
function generateSEODescription(productName, category) {
  const template = ULTIMATE_TEMPLATES[category];
  if (!template) {
    return `${productName} - Industrial equipment for professional applications. Reliable performance and quality construction.`;
  }
  
  const keywords = template.keywords.slice(0, 2).join(" and ");
  const usps = template.usps.slice(0, 2).join(" and ");
  
  return `${productName} - ${keywords} for industrial applications. Features ${usps} for reliable performance.`;
}

// Generate meta description (concise, click-worthy)
function generateMetaDescription(productName, category) {
  const template = ULTIMATE_TEMPLATES[category];
  if (!template) {
    return `${productName} - Industrial equipment with reliable performance and quality construction.`;
  }
  
  const keywords = template.keywords[0];
  const usps = template.usps[0];
  
  return `${productName} - ${keywords} with ${usps} for industrial applications.`;
}

// Main content generation function
export async function generateAllContent(productName, category) {
  try {
    console.log(`🔍 ULTIMATE AI ANALYSIS FOR: ${productName}`);
    
    // Smart category detection - ignore vendor category, use detected category
    const detectedCategory = detectCategory(productName);
    const finalCategory = detectedCategory;
    
    // Generate human-like content
    const keywords = generateKeywords(productName, finalCategory);
    const usps = generateUSPs(productName, finalCategory);
    
    const analysis = {
      volume: "medium",
      competition: "medium",
      bestKeywords: keywords,
      competitors: ["industry standards", "professional solutions"],
      usp: usps,
      complexity: "human"
    };
    
    console.log(`📊 Category: ${finalCategory}`);
    console.log(`🎯 Keywords: ${keywords.join(", ")}`);
    console.log(`✨ USPs: ${usps.join(", ")}`);
    
    // Generate human-like descriptions
    const detailedDescription = generateHumanContent(productName, finalCategory);
    const seoDescription = generateSEODescription(productName, finalCategory);
    const metaDescription = generateMetaDescription(productName, finalCategory);
    
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
    competitors: ["industry standards", "professional solutions"],
    usp: generateUSPs(productName, finalCategory)
  };
}
