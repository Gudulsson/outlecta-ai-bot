/**
 * Intelligent Content Analyzer
 * Detects and fixes repetitive content in blog articles
 */
class ContentAnalyzer {
  constructor() {
    this.repetitionThreshold = 0.85; // 85% similarity threshold (more strict)
    this.maxRetries = 3; // Maximum rewrite attempts
  }

  // Analyze content for repetitions and quality issues
  async analyzeContent(content, blogIdea) {
    console.log("🔍 Analyzing content for repetitions and quality issues...");
    
    const analysis = {
      repetitions: this.detectRepetitions(content),
      qualityIssues: this.detectQualityIssues(content),
      readability: this.calculateReadability(content),
      uniqueness: this.calculateUniqueness(content),
      needsRewrite: false,
      issues: []
    };

      // Check if content needs rewriting (only for obvious problems)
  const exactRepetitions = analysis.repetitions.filter(r => r.type === 'exact_phrase');
  
  // Only rewrite if there are actual exact repetitions
  if (exactRepetitions.length > 0) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Found ${exactRepetitions.length} exact repetitions`);
  }

  // Only rewrite for very obvious quality issues
  if (analysis.qualityIssues.length > 15) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Found ${analysis.qualityIssues.length} quality issues`);
  }

  // Only rewrite for extremely low uniqueness
  if (analysis.uniqueness < 0.05) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Content uniqueness extremely low: ${(analysis.uniqueness * 100).toFixed(1)}%`);
  }

    console.log(`📊 Content Analysis Results:`);
    console.log(`   - Repetitions: ${analysis.repetitions.length}`);
    console.log(`   - Quality Issues: ${analysis.qualityIssues.length}`);
    console.log(`   - Readability: ${analysis.readability}/100`);
    console.log(`   - Uniqueness: ${(analysis.uniqueness * 100).toFixed(1)}%`);
    console.log(`   - Needs Rewrite: ${analysis.needsRewrite ? 'YES' : 'NO'}`);

    return analysis;
  }

  // Detect repetitive sections in content (improved algorithm)
  detectRepetitions(content) {
    const repetitions = [];
    const paragraphs = this.extractParagraphs(content);
    
    // Only check adjacent paragraphs and skip every other to reduce false positives
    for (let i = 0; i < paragraphs.length - 1; i += 2) {
      const similarity = this.calculateSimilarity(paragraphs[i], paragraphs[i + 1]);
      
      if (similarity > this.repetitionThreshold) {
        repetitions.push({
          paragraph1: { index: i, text: paragraphs[i], similarity },
          paragraph2: { index: i + 1, text: paragraphs[i + 1], similarity },
          similarity
        });
      }
    }

    // Also check for exact phrase repetitions
    const exactRepetitions = this.findExactRepetitions(content);
    repetitions.push(...exactRepetitions);

    return repetitions;
  }

  // Find exact phrase repetitions (extremely strict - only exact sentence matches)
  findExactRepetitions(content) {
    const repetitions = [];
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 150); // Extremely long sentences only
    
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const sentence1 = sentences[i].trim().toLowerCase();
        const sentence2 = sentences[j].trim().toLowerCase();
        
        // Only check for exact sentence matches (extremely strict)
        if (sentence1 === sentence2 && sentence1.length > 150) {
          repetitions.push({
            paragraph1: { index: i, text: sentences[i], similarity: 1.0 },
            paragraph2: { index: j, text: sentences[j], similarity: 1.0 },
            similarity: 1.0,
            type: 'exact_phrase'
          });
        }
      }
    }
    
    return repetitions;
  }

  // Detect quality issues in content
  detectQualityIssues(content) {
    const issues = [];
    
    // Check for repeated phrases
    const repeatedPhrases = this.findRepeatedPhrases(content);
    if (repeatedPhrases.length > 0) {
      issues.push({
        type: 'repeated_phrases',
        details: repeatedPhrases,
        severity: 'high'
      });
    }

    // Check for similar sentence structures
    const similarStructures = this.findSimilarStructures(content);
    if (similarStructures.length > 0) {
      issues.push({
        type: 'similar_structures',
        details: similarStructures,
        severity: 'medium'
      });
    }

    // Check for overused words
    const overusedWords = this.findOverusedWords(content);
    if (overusedWords.length > 0) {
      issues.push({
        type: 'overused_words',
        details: overusedWords,
        severity: 'medium'
      });
    }

    return issues;
  }

  // Extract paragraphs from HTML content
  extractParagraphs(content) {
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gs;
    const paragraphs = [];
    let match;
    
    while ((match = paragraphRegex.exec(content)) !== null) {
      const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
      if (cleanText.length > 50) { // Only substantial paragraphs (increased minimum)
        paragraphs.push(cleanText);
      }
    }
    
    return paragraphs;
  }

  // Calculate similarity between two texts
  calculateSimilarity(text1, text2) {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  // Tokenize text into words
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  // Find repeated phrases
  findRepeatedPhrases(content) {
    const phrases = [];
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = this.calculateSimilarity(sentences[i], sentences[j]);
        if (similarity > 0.6) {
          phrases.push({
            sentence1: sentences[i].trim(),
            sentence2: sentences[j].trim(),
            similarity
          });
        }
      }
    }
    
    return phrases;
  }

  // Find similar sentence structures
  findSimilarStructures(content) {
    const structures = [];
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const structure1 = this.extractSentenceStructure(sentences[i]);
        const structure2 = this.extractSentenceStructure(sentences[j]);
        
        if (structure1 === structure2) {
          structures.push({
            sentence1: sentences[i].trim(),
            sentence2: sentences[j].trim(),
            structure: structure1
          });
        }
      }
    }
    
    return structures;
  }

  // Extract sentence structure (simplified)
  extractSentenceStructure(sentence) {
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 5) // First 5 words
      .join(' ');
  }

  // Find overused words
  findOverusedWords(content) {
    const text = content.replace(/<[^>]*>/g, '').toLowerCase();
    const words = this.tokenize(text);
    const wordCount = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const overused = Object.entries(wordCount)
      .filter(([word, count]) => count > 5 && word.length > 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return overused.map(([word, count]) => ({ word, count }));
  }

  // Calculate readability score
  calculateReadability(content) {
    const text = content.replace(/<[^>]*>/g, '');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) {
      return 50;
    }
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.join('').length / words.length;
    
    // Simple readability formula
    let score = 100 - (avgSentenceLength * 2) - (avgWordLength * 5);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Calculate content uniqueness
  calculateUniqueness(content) {
    const paragraphs = this.extractParagraphs(content);
    if (paragraphs.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      for (let j = i + 1; j < paragraphs.length; j++) {
        totalSimilarity += this.calculateSimilarity(paragraphs[i], paragraphs[j]);
        comparisons++;
      }
    }
    
    const avgSimilarity = totalSimilarity / comparisons;
    return 1.0 - avgSimilarity;
  }

  // Generate rewrite suggestions for repetitive content
  generateRewriteSuggestions(repetitions, blogIdea) {
    const suggestions = [];
    
    repetitions.forEach((repetition, index) => {
      const suggestion = {
        type: 'rewrite_paragraph',
        targetParagraph: repetition.paragraph1.index,
        reason: `Similar to paragraph ${repetition.paragraph2.index + 1} (${(repetition.similarity * 100).toFixed(1)}% similarity)`,
        newContent: this.generateAlternativeContent(repetition.paragraph1.text, blogIdea, index)
      };
      
      suggestions.push(suggestion);
    });
    
    return suggestions;
  }

  // Generate alternative content for repetitive paragraphs
  generateAlternativeContent(originalText, blogIdea, variationIndex) {
    const keywords = blogIdea.keywords || ['industrial automation'];
    const primaryKeyword = keywords[0] || 'industrial automation';
    
    const alternatives = [
      `The implementation of ${primaryKeyword} requires careful consideration of multiple factors. Organizations must evaluate their specific requirements and operational constraints to ensure optimal performance and long-term success.`,
      
      `When deploying ${primaryKeyword} solutions, it's essential to consider the broader organizational context. This includes understanding current infrastructure limitations, future scalability needs, and integration requirements with existing systems.`,
      
      `Successful ${primaryKeyword} adoption depends on a comprehensive approach that addresses both technical and operational aspects. Companies need to establish clear objectives, define performance metrics, and implement robust monitoring systems.`,
      
      `The strategic deployment of ${primaryKeyword} technologies involves balancing immediate operational needs with long-term business objectives. This requires careful planning, stakeholder alignment, and continuous evaluation of performance outcomes.`,
      
      `Organizations implementing ${primaryKeyword} must consider the full lifecycle of the solution. This includes initial planning, deployment strategies, ongoing maintenance, and future upgrade considerations.`
    ];
    
    return alternatives[variationIndex % alternatives.length];
  }

  // Apply rewrite suggestions to content
  applyRewriteSuggestions(content, suggestions) {
    let modifiedContent = content;
    const paragraphs = this.extractParagraphs(content);
    
    suggestions.forEach(suggestion => {
      if (suggestion.type === 'rewrite_paragraph') {
        const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gs;
        let match;
        let paragraphIndex = 0;
        
        modifiedContent = modifiedContent.replace(paragraphRegex, (match, paragraphContent) => {
          if (paragraphIndex === suggestion.targetParagraph) {
            paragraphIndex++;
            return `<p>${suggestion.newContent}</p>`;
          }
          paragraphIndex++;
          return match;
        });
      }
    });
    
    return modifiedContent;
  }

  // Intelligent content rewriting with multiple attempts
  async rewriteContent(content, blogIdea, maxAttempts = 3) {
    console.log("🔄 Starting intelligent content rewriting...");
    
    // Only rewrite if there are exact repetitions
    const initialAnalysis = await this.analyzeContent(content, blogIdea);
    const exactRepetitions = initialAnalysis.repetitions.filter(r => r.type === 'exact_phrase');
    
    if (exactRepetitions.length === 0) {
      console.log("✅ Content quality is excellent - no exact repetitions found");
      return content;
    }
    
    console.log(`🔧 Found ${exactRepetitions.length} exact repetitions - applying targeted fixes...`);
    
    // Apply targeted fixes for exact repetitions only
    const suggestions = this.generateRewriteSuggestions(exactRepetitions, blogIdea);
    const rewrittenContent = this.applyRewriteSuggestions(content, suggestions);
    
    // Final analysis
    const finalAnalysis = await this.analyzeContent(rewrittenContent, blogIdea);
    const finalExactRepetitions = finalAnalysis.repetitions.filter(r => r.type === 'exact_phrase');
    console.log("📊 Final content analysis after targeted fixes:");
    console.log(`   - Exact repetitions before: ${exactRepetitions.length}`);
    console.log(`   - Exact repetitions after: ${finalExactRepetitions.length}`);
    
    return rewrittenContent;
  }
}

export default ContentAnalyzer;
