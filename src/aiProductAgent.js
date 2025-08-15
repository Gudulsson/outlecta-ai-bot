import dotenv from "dotenv";
dotenv.config();

const { OPENAI_API_KEY } = process.env;

// Sökordsdatabas med volym och konkurrensdata
const SEARCH_KEYWORDS = {
  "strain gauge": { volume: "high", competition: "medium", cpc: 2.50 },
  "load cell": { volume: "very high", competition: "high", cpc: 3.20 },
  "industrial touch screen": { volume: "high", competition: "medium", cpc: 2.80 },
  "panel pc": { volume: "medium", competition: "low", cpc: 1.90 },
  "data acquisition": { volume: "medium", competition: "medium", cpc: 2.10 },
  "vibration sensor": { volume: "medium", competition: "low", cpc: 1.70 },
  "hmi display": { volume: "high", competition: "high", cpc: 3.50 },
  "industrial computer": { volume: "high", competition: "high", cpc: 2.90 },
  "force sensor": { volume: "medium", competition: "medium", cpc: 2.30 },
  "weight indicator": { volume: "low", competition: "low", cpc: 1.40 },
  "usb daq": { volume: "medium", competition: "low", cpc: 1.60 },
  "touch screen computer": { volume: "high", competition: "medium", cpc: 2.40 },
  "factory automation": { volume: "high", competition: "high", cpc: 3.10 },
  "industrial sensor": { volume: "medium", competition: "medium", cpc: 2.20 },
  "signal conditioning": { volume: "low", competition: "low", cpc: 1.30 },
  "rugged display": { volume: "medium", competition: "low", cpc: 1.80 },
  "monitor stand": { volume: "medium", competition: "high", cpc: 2.60 },
  "power cable": { volume: "very high", competition: "very high", cpc: 1.20 }
};

// Produktkategorier med sökordsstrategi
const PRODUCT_CATEGORIES = {
  "kyowa": {
    primary: ["strain gauge", "load cell", "force sensor"],
    secondary: ["industrial sensor", "measurement sensor"],
    longtail: ["high precision strain gauge", "industrial load cell", "force measurement sensor"],
    competitors: ["HBM", "Vishay", "TML", "Flintec"],
    unique_selling_points: ["Japanese precision", "high accuracy", "industrial grade", "long lifespan"]
  },
  "telac": {
    primary: ["industrial touch screen", "hmi display", "rugged display"],
    secondary: ["industrial computer", "factory automation"],
    longtail: ["rugged industrial touch screen", "hmi touch display", "factory automation display"],
    competitors: ["Advantech", "Beckhoff", "Siemens", "Allen Bradley"],
    unique_selling_points: ["rugged construction", "wide temperature range", "IP65 protection", "industrial reliability"]
  },
  "panel pc": {
    primary: ["panel pc", "touch screen computer", "industrial computer"],
    secondary: ["hmi display", "factory automation"],
    longtail: ["industrial panel pc", "touch screen industrial computer", "hmi panel pc"],
    competitors: ["Advantech", "Beckhoff", "Kontron", "Siemens"],
    unique_selling_points: ["all-in-one solution", "space saving", "integrated computing", "industrial design"]
  },
  "mcc": {
    primary: ["data acquisition", "usb daq", "signal conditioning"],
    secondary: ["industrial sensor", "measurement system"],
    longtail: ["usb data acquisition", "industrial daq system", "signal conditioning module"],
    competitors: ["National Instruments", "Keysight", "Tektronix", "Agilent"],
    unique_selling_points: ["USB connectivity", "easy setup", "cost effective", "high accuracy"]
  }
};

// Analysera sökordsvolym och konkurrens
function analyzeSearchTerms(productTitle) {
  const title = productTitle.toLowerCase();
  let bestKeywords = [];
  let category = null;
  
  // Identifiera kategori
  for (const [cat, data] of Object.entries(PRODUCT_CATEGORIES)) {
    if (title.includes(cat)) {
      category = cat;
      break;
    }
  }
  
  if (!category) {
    // Fallback för okända produkter
    return {
      primary: ["industrial equipment"],
      secondary: ["professional grade"],
      longtail: ["industrial solution"],
      volume: "medium",
      competition: "medium"
    };
  }
  
  const catData = PRODUCT_CATEGORIES[category];
  
  // Sortera nyckelord efter volym och konkurrens
  const keywordScores = {};
  
  [...catData.primary, ...catData.secondary, ...catData.longtail].forEach(keyword => {
    const searchData = SEARCH_KEYWORDS[keyword] || { volume: "low", competition: "low", cpc: 1.0 };
    const volumeScore = searchData.volume === "very high" ? 5 : 
                       searchData.volume === "high" ? 4 : 
                       searchData.volume === "medium" ? 3 : 2;
    const competitionScore = searchData.competition === "very high" ? 1 : 
                           searchData.competition === "high" ? 2 : 
                           searchData.competition === "medium" ? 3 : 4;
    
    keywordScores[keyword] = {
      score: volumeScore * competitionScore,
      volume: searchData.volume,
      competition: searchData.competition,
      cpc: searchData.cpc
    };
  });
  
  // Välj bästa nyckelorden
  const sortedKeywords = Object.entries(keywordScores)
    .sort(([,a], [,b]) => b.score - a.score)
    .slice(0, 5)
    .map(([keyword]) => keyword);
  
  return {
    primary: catData.primary,
    secondary: catData.secondary,
    longtail: catData.longtail,
    bestKeywords: sortedKeywords,
    competitors: catData.competitors,
    usp: catData.unique_selling_points,
    volume: keywordScores[sortedKeywords[0]]?.volume || "medium",
    competition: keywordScores[sortedKeywords[0]]?.competition || "medium"
  };
}

// Generera SEO-optimerad kort beskrivning (150 tecken)
export async function generateSEODescription(productTitle, variantTitle = "", vendor = "") {
  const searchAnalysis = analyzeSearchTerms(productTitle);
  
  // Fallback utan AI - skapa regelbaserad SEO-beskrivning
  if (!OPENAI_API_KEY) {
    const keywords = searchAnalysis.bestKeywords.slice(0, 2);
    const usp = searchAnalysis.usp[0];
    
    let description = `${productTitle} - ${keywords.join(", ")}`;
    if (usp) {
      description += ` - ${usp}`;
    }
    
    return description.slice(0, 150);
  }
  
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `You are an expert SEO copywriter specializing in industrial equipment. Create a compelling 150-character product description that:

1. TARGETS HIGH-VOLUME KEYWORDS: ${searchAnalysis.bestKeywords.join(", ")}
2. HIGHLIGHTS UNIQUE SELLING POINTS: ${searchAnalysis.usp.join(", ")}
3. OPTIMIZES FOR SEARCH VOLUME: ${searchAnalysis.volume} (${searchAnalysis.competition} competition)

Product: "${productTitle}"
Variant: "${variantTitle}"
Brand: "${vendor}"

Requirements:
- Exactly 150 characters
- Include 2-3 high-volume keywords naturally
- Emphasize unique benefits vs competing solutions
- Professional, technical tone
- Action-oriented language
- No brand repetition
- Do not name any competitor brands explicitly; use generic phrasing only

Format: "Technical feature + benefit + application"`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    
    return text.slice(0, 150);
  } catch (error) {
    console.error("SEO description generation failed:", error.message);
    return null;
  }
}

// Generera detaljerad produktbeskrivning (500+ tecken)
export async function generateDetailedDescription(productTitle, variantTitle = "", vendor = "") {
  const searchAnalysis = analyzeSearchTerms(productTitle);
  
  // Fallback utan AI - skapa regelbaserad detaljerad beskrivning
  if (!OPENAI_API_KEY) {
    const keywords = searchAnalysis.bestKeywords.slice(0, 3);
    const usps = searchAnalysis.usp.slice(0, 2);
    
    let description = `The ${productTitle} delivers exceptional performance for ${keywords.join(" and ")} applications. `;
    description += `Featuring ${usps.join(" and ")}, this industrial-grade solution outperforms competing solutions. `;
    description += `Ideal for demanding industrial environments requiring precise measurement and reliable operation.`;
    
    return description;
  }
  
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `You are a senior technical writer creating detailed product descriptions for industrial equipment. Write a comprehensive, SEO-optimized description that:

SEARCH ANALYSIS:
- Target Keywords: ${searchAnalysis.bestKeywords.join(", ")}
- Search Volume: ${searchAnalysis.volume}
- Competition Level: ${searchAnalysis.competition}
- Note: Competing solutions exist but must not be named explicitly
- Unique Selling Points: ${searchAnalysis.usp.join(", ")}

Product: "${productTitle}"
Variant: "${variantTitle}"
Brand: "${vendor}"

Structure:
1. Opening hook with primary keyword
2. Technical specifications and features
3. Benefits and applications
4. Competitive advantages
5. Target industries/applications
6. Call-to-action

Requirements:
- 500-800 characters
- Include all target keywords naturally
- Technical but accessible language
- Emphasize competitive advantages without naming specific competitors
- Industry-specific applications
- Professional tone
- No marketing fluff
- Do not mention any competitor brand names; use generic phrasing only

Focus on converting visitors by highlighting why this product is better than competitors.`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    
    return text;
  } catch (error) {
    console.error("Detailed description generation failed:", error.message);
    return null;
  }
}

// Generera meta-beskrivning för SEO
export async function generateMetaDescription(productTitle, variantTitle = "", vendor = "") {
  const searchAnalysis = analyzeSearchTerms(productTitle);
  
  // Fallback utan AI - skapa regelbaserad meta-beskrivning
  if (!OPENAI_API_KEY) {
    const primaryKeyword = searchAnalysis.bestKeywords[0];
    const usp = searchAnalysis.usp[0];
    
    let description = `${primaryKeyword} - ${productTitle} featuring ${usp}. `;
    description += `Professional industrial solution for demanding applications.`;
    
    return description.slice(0, 155);
  }
  
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `Create a compelling meta description (155 characters) for an industrial equipment product page that:

TARGETS: ${searchAnalysis.bestKeywords.join(", ")}
VOLUME: ${searchAnalysis.volume} (${searchAnalysis.competition} competition)

Product: "${productTitle}"
Variant: "${variantTitle}"
Brand: "${vendor}"

Requirements:
- Exactly 155 characters
- Include primary keyword in first 60 characters
- Compelling value proposition
- Clear benefit statement
- Call-to-action
- No brand repetition
 - Do not name any competitor brands explicitly; use generic phrasing only

Format: "Primary keyword + benefit + action"`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    
    return text.slice(0, 155);
  } catch (error) {
    console.error("Meta description generation failed:", error.message);
    return null;
  }
}

// Huvudfunktion för att generera allt innehåll
export async function generateAllContent(productTitle, variantTitle = "", vendor = "") {
  const searchAnalysis = analyzeSearchTerms(productTitle);
  
  console.log(`\n🔍 SEARCH ANALYSIS FOR: ${productTitle}`);
  console.log(`📊 Volume: ${searchAnalysis.volume}, Competition: ${searchAnalysis.competition}`);
  console.log(`🎯 Target Keywords: ${searchAnalysis.bestKeywords.join(", ")}`);
  console.log(`🏆 Competitors: ${searchAnalysis.competitors.join(", ")}`);
  console.log(`✨ USPs: ${searchAnalysis.usp.join(", ")}\n`);
  
  const [seoDesc, detailedDesc, metaDesc] = await Promise.all([
    generateSEODescription(productTitle, variantTitle, vendor),
    generateDetailedDescription(productTitle, variantTitle, vendor),
    generateMetaDescription(productTitle, variantTitle, vendor)
  ]);
  
  return {
    seoDescription: seoDesc,
    detailedDescription: detailedDesc,
    metaDescription: metaDesc,
    searchAnalysis
  };
}
