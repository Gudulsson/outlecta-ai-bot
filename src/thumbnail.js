import sharp from "sharp";

function escapeXml(str) {
  return String(str).replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c]));
}

export async function generateThumbnail(blogIdea) {
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
  <text x="60" y="230" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="56" fill="#ffffff">${escapeXml(title)}</text>
  <rect x="60" y="270" width="480" height="6" rx="3" fill="${accent}"/>
  <text x="60" y="330" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#cfe6da">${escapeXml(subtitle)}</text>
  <g opacity="0.2">
    <rect x="800" y="340" width="320" height="180" rx="12" fill="#2c3e50"/>
    <rect x="820" y="360" width="120" height="12" rx="6" fill="#6aa896"/>
    <rect x="820" y="390" width="260" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="410" width="240" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="430" width="200" height="8" rx="4" fill="#6aa896"/>
  </g>
</svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const base64 = pngBuffer.toString('base64');
  const alt = `${blogIdea.title} – Outlecta Industrial Insights thumbnail`;
  return { imageBase64: base64, alt, filename: 'thumbnail.png' };
}


