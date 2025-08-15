import dotenv from "dotenv";
dotenv.config();

const {
  BRAND_NAME = "Outlecta",
  CATEGORY_TAGLINE = "HMI & IoT",
  OPENAI_API_KEY
} = process.env;

function isGarbageAlt(value = "", src = "") {
  const v = (value || "").trim().toLowerCase();
  if (!v) return true;
  const badTokens = ["img", "image", "photo", "bild", "untitled", "null", "n/a"];
  if (badTokens.some(t => v === t || v.startsWith(t + " "))) return true;
  const file = src.split("/").pop()?.toLowerCase() || "";
  if (file && (v === file || v === file.replace(/\.[a-z0-9]+$/, ""))) return true;
  if (v.length < 5) return true;
  return false;
}

/** Normalisera och deduplicera brand-delen i en befintlig ALT */
export function cleanupAlt(raw = "") {
  if (!raw) return raw;
  let s = raw;

  // Normalisera "Outlecta.com" -> "Outlecta"
  s = s.replace(/outlecta\.com/gi, "Outlecta");

  // Dela upp på tankstreck/hyfen, trimma och deduplicera i ordning
  const parts = s
    .split(/[\u2013\u2014\-]+/g) // – — -
    .map(x => x.trim())
    .filter(Boolean);

  const seen = new Set();
  const uniq = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(p);
    }
  }

  // Ta bort branddelen helt - lägg inte till den
  const brandRegex = new RegExp(`^${BRAND_NAME}(?:\\s*\\|\\s*HMI\\s*&\\s*IoT)?$`, "i");
  const withoutBrand = uniq.filter(p => !brandRegex.test(p));

  const finalParts = [...withoutBrand];

  const out = finalParts.join(" – ").trim();
  return out.slice(0, 140);
}

export function ruleBasedAlt({ productTitle, variantTitle, vendor, src }) {
  const bits = [];
  bits.push(productTitle);

  if (variantTitle && !/default/i.test(variantTitle)) {
    bits.push(variantTitle);
  }

  if (
    vendor &&
    !new RegExp(vendor, "i").test(productTitle) &&
    vendor.toLowerCase() !== BRAND_NAME.toLowerCase()
  ) {
    bits.push(vendor);
  }

  // Lägg inte till branddelen alls

  return cleanupAlt(bits.join(" – "));
}

export async function maybeAiAlt(context) {
  if (!OPENAI_API_KEY) return null;
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const { productTitle, variantTitle, vendor } = context;
  const prompt = `Write a concise, descriptive ALT text (<= 140 chars) for a product image on an e-commerce site.
Product: "${productTitle}"
Variant: "${variantTitle || ""}"
Brand/Vendor: "${vendor || ""}"
Style: clear, human, no marketing fluff. Don't repeat file names.`;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const text = resp.choices?.[0]?.message?.content?.trim();
  if (!text) return null;
  return cleanupAlt(text);
}

/** Nu räknas även "städbehov" som uppdateringsbehov */
export function needsAltUpdate(image) {
  if (isGarbageAlt(image.alt, image.src)) return true;
  return cleanupAlt(image.alt) !== (image.alt || "");
}
