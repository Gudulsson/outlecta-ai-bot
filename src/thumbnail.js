import sharp from "sharp";

function escapeXml(str) {
  return String(str).replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c]));
}

export async function generateThumbnail(blogIdea) {
  // Smart text handling for better layout
  const subtitle = (blogIdea.category || blogIdea.type || 'Industrial').toUpperCase();
  const bg = '#0b1f3a';
  const accent = '#2bb673';
  
  // Split long titles into multiple lines
  function splitTitle(title, maxLength = 40) {
    if (title.length <= maxLength) return [title];
    
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    // Limit to 2 lines max
    if (lines.length > 2) {
      lines[1] = lines[1].slice(0, 35) + '...';
      return lines.slice(0, 2);
    }
    return lines;
  }
  
  const titleLines = splitTitle(blogIdea.title);
  
  // Shopify blog thumbnail size: 1200x630 pixels (16:9 ratio) - standard size
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
  <text x="60" y="130" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#9fb3c8" letter-spacing="1.5">OUTLECTA • INDUSTRIAL INSIGHTS</text>
  ${titleLines.map((line, index) => 
    `<text x="60" y="${200 + (index * 55)}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="48" fill="#ffffff">${escapeXml(line)}</text>`
  ).join('\n  ')}
  <rect x="60" y="${200 + (titleLines.length * 55) + 10}" width="400" height="6" rx="3" fill="${accent}"/>
  <text x="60" y="${200 + (titleLines.length * 55) + 45}" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#cfe6da">${escapeXml(subtitle)}</text>
  <g opacity="0.2">
    <rect x="800" y="350" width="320" height="180" rx="12" fill="#2c3e50"/>
    <rect x="820" y="370" width="120" height="12" rx="6" fill="#6aa896"/>
    <rect x="820" y="390" width="260" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="410" width="240" height="8" rx="4" fill="#6aa896"/>
    <rect x="820" y="430" width="200" height="8" rx="4" fill="#6aa896"/>
  </g>
</svg>`;

  // Optimize PNG for web - reduce file size while maintaining quality
  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ 
      quality: 90,
      compressionLevel: 9,
      adaptiveFiltering: true
    })
    .toBuffer();
  
  const base64 = pngBuffer.toString('base64');
  
  // Enhanced ALT text for better SEO and accessibility
  const alt = `${blogIdea.title} - ${subtitle} - Outlecta Industrial Technology Blog`;
  const filename = `thumbnail-${Date.now()}.png`; // Unique filename to avoid caching
  return { imageBase64: base64, alt, filename };
}


