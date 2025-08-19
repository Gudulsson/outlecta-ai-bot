import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "demo-key");

// Initialize the model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateSEODescription(productName, category, searchTerms, competitors, usp) {
  try {
    const prompt = `Generate a compelling SEO-optimized product description for "${productName}" in the ${category} category.

Product: ${productName}
Category: ${category}
Target Keywords: ${searchTerms.join(", ")}
Competitors: ${competitors.join(", ")}
Unique Selling Points: ${usp.join(", ")}

Requirements:
- Write in English only
- 150-200 words
- Include target keywords naturally
- Focus on benefits and features
- Professional, technical tone
- Optimized for search engines
- No competitor brand names in the text

Generate the description:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("SEO description generation failed:", error.message);
    return null;
  }
}

export async function generateDetailedDescription(productName, category, searchTerms, competitors, usp) {
  try {
    const prompt = `Create a comprehensive, detailed product description for "${productName}" in the ${category} category.

Product: ${productName}
Category: ${category}
Target Keywords: ${searchTerms.join(", ")}
Competitors: ${competitors.join(", ")}
Unique Selling Points: ${usp.join(", ")}

Requirements:
- Write in English only
- 300-400 words
- Include all target keywords naturally
- Detailed technical specifications
- Benefits and use cases
- Professional, industrial tone
- No competitor brand names in the text
- Focus on reliability and performance

Generate the detailed description:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Detailed description generation failed:", error.message);
    return null;
  }
}

export async function generateMetaDescription(productName, category, searchTerms) {
  try {
    const prompt = `Create a concise meta description for "${productName}" in the ${category} category.

Product: ${productName}
Category: ${category}
Target Keywords: ${searchTerms.join(", ")}

Requirements:
- Write in English only
- 150-160 characters maximum
- Include main target keywords
- Compelling and click-worthy
- Professional tone
- Optimized for search engines

Generate the meta description:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Meta description generation failed:", error.message);
    return null;
  }
}

export async function generateAllContent(productName, category) {
  try {
    console.log(`🔍 SEARCH ANALYSIS FOR: ${productName}`);
    
    const analysis = await analyzeSearchTerms(productName, category);
    const { volume, competition, bestKeywords, competitors, usp } = analysis;
    
    console.log(`📊 Volume: ${volume}, Competition: ${competition}`);
    console.log(`🎯 Target Keywords: ${bestKeywords.join(", ")}`);
    console.log(`🏆 Competitors: ${competitors.join(", ")}`);
    console.log(`✨ USPs: ${usp.join(", ")}`);
    
    // Generate all content types
    const [seoDescription, detailedDescription, metaDescription] = await Promise.all([
      generateSEODescription(productName, category, bestKeywords, competitors, usp),
      generateDetailedDescription(productName, category, bestKeywords, competitors, usp),
      generateMetaDescription(productName, category, bestKeywords)
    ]);
    
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
  try {
    const prompt = `Analyze search terms for "${productName}" in the ${category} category.

Product: ${productName}
Category: ${category}

Provide analysis in this exact JSON format:
{
  "volume": "low|medium|high",
  "competition": "low|medium|high",
  "bestKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "usp": ["usp1", "usp2", "usp3", "usp4"]
}

Requirements:
- Write in English only
- Focus on industrial/HMI/IoT keywords
- Include technical and commercial terms
- Identify major competitors in the space
- Highlight unique selling points
- Return valid JSON only

Analysis:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return {
      volume: "medium",
      competition: "medium",
      bestKeywords: ["industrial equipment", "professional grade", "industrial solution"],
      competitors: [],
      usp: ["reliable performance", "industrial-grade build"]
    };
  } catch (error) {
    console.error("Search analysis failed:", error.message);
    return {
      volume: "medium",
      competition: "medium",
      bestKeywords: ["industrial equipment", "professional grade", "industrial solution"],
      competitors: [],
      usp: ["reliable performance", "industrial-grade build"]
    };
  }
}
