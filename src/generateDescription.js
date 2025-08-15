import dotenv from "dotenv";
dotenv.config();

const {
  BRAND_NAME = "Outlecta",
  CATEGORY_TAGLINE = "HMI & IoT",
  OPENAI_API_KEY
} = process.env;

// SEO-nyckelord för olika produktkategorier
const SEO_KEYWORDS = {
  "panel pc": ["industrial panel pc", "touch screen computer", "hmi display", "automation panel", "factory computer"],
  "telac": ["industrial touch screen", "rugged display", "factory automation", "hmi solution", "industrial computer"],
  "kyowa": ["strain gauge", "load cell", "force sensor", "measurement sensor", "industrial sensor"],
  "mcc": ["data acquisition", "daq system", "usb measurement", "industrial daq", "signal conditioning"],
  "monitran": ["vibration sensor", "condition monitoring", "industrial vibration", "predictive maintenance", "vibration measurement"],
  "sensocar": ["weight indicator", "industrial scale", "load measurement", "tare function", "precision weighing"],
  "cable": ["power cable", "industrial cable", "electrical connector", "power supply", "industrial power"],
  "stand": ["monitor stand", "industrial mount", "vesa mount", "display stand", "workstation mount"]
};

// Identifiera produktkategori baserat på produktnamn
function identifyCategory(productTitle) {
  const title = productTitle.toLowerCase();
  
  for (const [category, keywords] of Object.entries(SEO_KEYWORDS)) {
    if (title.includes(category)) {
      return { category, keywords };
    }
  }
  
  // Fallback för okända kategorier
  return { 
    category: "industrial equipment", 
    keywords: ["industrial equipment", "automation", "factory solution", "professional grade", "industrial application"]
  };
}

// Generera SEO-optimerad beskrivning med regelbaserad metod
export function ruleBasedDescription({ productTitle, variantTitle, vendor }) {
  const { category, keywords } = identifyCategory(productTitle);
  
  const bits = [];
  
  // Lägg till produktnamn
  bits.push(productTitle);
  
  // Lägg till variant om den finns och inte är "default"
  if (variantTitle && !/default/i.test(variantTitle)) {
    bits.push(variantTitle);
  }
  
  // Lägg inte till vendor/brand-delen
  
  // Lägg till kategori och SEO-nyckelord
  bits.push(category);
  
  // Välj 2-3 relevanta nyckelord
  const relevantKeywords = keywords.slice(0, 3);
  bits.push(...relevantKeywords);
  
  // Skapa beskrivning
  let description = bits.join(" - ");
  
  // Lägg till kontext om det behövs
  if (!description.includes("industrial") && !description.includes("professional")) {
    description += " - Professional industrial solution";
  }
  
  // Begränsa till 150 tecken
  return description.slice(0, 150);
}

// Generera AI-baserad beskrivning
export async function maybeAiDescription(context) {
  if (!OPENAI_API_KEY) return null;
  
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const { productTitle, variantTitle, vendor } = context;
  const { category, keywords } = identifyCategory(productTitle);
  
  const prompt = `Write a concise, SEO-optimized product description (exactly 150 characters) for an industrial equipment e-commerce site.

Product: "${productTitle}"
Variant: "${variantTitle || ""}"
Brand/Vendor: "${vendor || ""}"
Category: "${category}"
Target keywords: ${keywords.join(", ")}

Requirements:
- Exactly 150 characters
- Include relevant keywords naturally
- Focus on industrial/professional use
- Clear, descriptive, no marketing fluff
- Optimized for search engines
- Include product benefits/features`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7
    });

    const text = resp.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    
    // Säkerställ att texten är exakt 150 tecken
    return text.slice(0, 150);
  } catch (error) {
    console.error("AI description generation failed:", error.message);
    return null;
  }
}

// Kontrollera om beskrivning behöver uppdateras
export function needsDescriptionUpdate(product) {
  const currentDesc = product.body_html || "";
  
  // Ta bort HTML-taggar för jämförelse
  const cleanDesc = currentDesc.replace(/<[^>]*>/g, "").trim();
  
  // Om ingen beskrivning finns eller den är för kort
  if (!cleanDesc || cleanDesc.length < 50) return true;
  
  // Om beskrivningen inte innehåller relevanta nyckelord
  const { keywords } = identifyCategory(product.title);
  const hasKeywords = keywords.some(keyword => 
    cleanDesc.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (!hasKeywords) return true;
  
  return false;
}

// Huvudfunktion för att generera beskrivning
export async function generateDescription(context) {
  // Försök med AI först, fallback till regelbaserad
  const ai = await maybeAiDescription(context).catch(() => null);
  return ai || ruleBasedDescription(context);
}
