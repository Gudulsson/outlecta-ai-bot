// Utilities to sanitize generated texts before pushing to Shopify

const COMPETITOR_NAMES = [
  "HBM",
  "Vishay",
  "TML",
  "Flintec",
  "Advantech",
  "Beckhoff",
  "Siemens",
  "Allen Bradley",
  "Kontron",
  "National Instruments",
  "Keysight",
  "Tektronix",
  "Agilent"
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const competitorWordRegex = new RegExp(`\\b(${COMPETITOR_NAMES.map(escapeRegex).join("|")})\\b`, "gi");

export function sanitizeDescriptionHtml(html = "") {
  if (!html) return html;
  let out = html;

  // Replace phrases that name competitors after "like"/"such as"
  out = out.replace(/outperform(s)?[^.]*?(?:like|such as)[^.]*\./gi, (m) => {
    const endsWithPeriod = m.trim().endsWith(".");
    const replacement = "outperforms competing solutions" + (endsWithPeriod ? "." : "");
    return replacement;
  });

  // Remove any direct brand-name references to competitors
  out = out.replace(competitorWordRegex, "leading alternatives");

  // Cleanup any double spaces
  out = out.replace(/\s{2,}/g, " ");

  return out;
}


