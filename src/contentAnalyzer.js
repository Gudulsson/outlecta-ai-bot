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

      // Check if content needs rewriting (catches problems like the bad Outlecta article)
  const exactRepetitions = analysis.repetitions.filter(r => r.type === 'exact_phrase');
  const criticalIssues = analysis.qualityIssues.filter(issue => issue.severity === 'critical');
  const highIssues = analysis.qualityIssues.filter(issue => issue.severity === 'high');
  
  // Rewrite if there are actual exact repetitions
  if (exactRepetitions.length > 0) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Found ${exactRepetitions.length} exact repetitions`);
  }

  // Rewrite for critical issues (like "undefined" variables)
  if (criticalIssues.length > 0) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Found ${criticalIssues.length} critical technical errors`);
  }

  // Rewrite for multiple high-severity issues (meaningless patterns, etc.)
  if (highIssues.length > 1) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Found ${highIssues.length} high-severity quality issues`);
  }

  // Rewrite for extremely low uniqueness
  if (analysis.uniqueness < 0.3) {
    analysis.needsRewrite = true;
    analysis.issues.push(`Content uniqueness too low: ${(analysis.uniqueness * 100).toFixed(1)}%`);
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

  // Find exact phrase repetitions (catches real problems like the Outlecta article)
  findExactRepetitions(content) {
    const repetitions = [];
    const text = content.replace(/<[^>]*>/g, '');
    
    // Check for repeated paragraphs (like in the bad Outlecta article)
    const paragraphs = content.split(/<\/p>\s*<p[^>]*>/gi).map(p => 
      p.replace(/<[^>]*>/g, '').trim()
    ).filter(p => p.length > 50);
    
    for (let i = 0; i < paragraphs.length; i++) {
      for (let j = i + 1; j < paragraphs.length; j++) {
        const para1 = paragraphs[i].toLowerCase();
        const para2 = paragraphs[j].toLowerCase();
        
        // Check for exact paragraph matches
        if (para1 === para2 && para1.length > 50) {
          repetitions.push({
            paragraph1: { index: i, text: paragraphs[i], similarity: 1.0 },
            paragraph2: { index: j, text: paragraphs[j], similarity: 1.0 },
            similarity: 1.0,
            type: 'exact_phrase'
          });
        }
        
        // Check for very similar long phrases (90%+ similarity)
        const similarity = this.calculateSimilarity(para1, para2);
        if (similarity > 0.9 && para1.length > 100) {
          repetitions.push({
            paragraph1: { index: i, text: paragraphs[i], similarity },
            paragraph2: { index: j, text: paragraphs[j], similarity },
            similarity,
            type: 'exact_phrase'
          });
        }
      }
    }
    
    // Also check for repeated phrases within the content
    const phrases = this.extractLongPhrases(text);
    for (let i = 0; i < phrases.length; i++) {
      for (let j = i + 1; j < phrases.length; j++) {
        if (phrases[i] === phrases[j] && phrases[i].length > 80) {
          repetitions.push({
            paragraph1: { index: i, text: phrases[i], similarity: 1.0 },
            paragraph2: { index: j, text: phrases[j], similarity: 1.0 },
            similarity: 1.0,
            type: 'exact_phrase'
          });
        }
      }
    }
    
    return repetitions;
  }

  // Extract long phrases for repetition detection
  extractLongPhrases(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 50);
    const phrases = [];
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      for (let i = 0; i <= words.length - 10; i++) { // 10-word phrases
        const phrase = words.slice(i, i + 10).join(' ').toLowerCase();
        if (phrase.length > 80) {
          phrases.push(phrase);
        }
      }
    });
    
    return phrases;
  }

  // Detect quality issues in content
  detectQualityIssues(content) {
    const issues = [];
    
    // Check for technical errors (like "undefined" in the bad Outlecta article)
    const technicalErrors = this.findTechnicalErrors(content);
    if (technicalErrors.length > 0) {
      issues.push({
        type: 'technical_errors',
        details: technicalErrors,
        severity: 'critical'
      });
    }

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

    // Check for meaningless content patterns
    const meaninglessPatterns = this.findMeaninglessPatterns(content);
    if (meaninglessPatterns.length > 0) {
      issues.push({
        type: 'meaningless_patterns',
        details: meaninglessPatterns,
        severity: 'high'
      });
    }

    return issues;
  }

  // Find technical errors like "undefined", broken variables, etc.
  findTechnicalErrors(content) {
    const errors = [];
    const text = content.replace(/<[^>]*>/g, '');
    
    // Check for "undefined" 
    if (text.includes('undefined')) {
      errors.push({ type: 'undefined_variable', count: (text.match(/undefined/g) || []).length });
    }
    
    // Check for empty variable placeholders
    const emptyPlaceholders = text.match(/\$\{[^}]*\}/g) || [];
    if (emptyPlaceholders.length > 0) {
      errors.push({ type: 'empty_placeholders', count: emptyPlaceholders.length });
    }
    
    // Check for broken references
    if (text.includes('[object Object]') || text.includes('NaN') || text.includes('null')) {
      errors.push({ type: 'broken_references', count: 1 });
    }
    
    return errors;
  }

  // Find meaningless content patterns (like the repetitive sections in bad Outlecta article)
  findMeaninglessPatterns(content) {
    const patterns = [];
    const text = content.replace(/<[^>]*>/g, '');
    
    // Check for generic filler phrases that appear too often
    const fillerPhrases = [
      'represents a fundamental shift in how organizations approach',
      'the integration of advanced technologies and proven methodologies',
      'creates a robust foundation for operational excellence',
      'industry experts recommend conducting thorough assessments',
      'this ensures optimal performance and maximum return on investment'
    ];
    
    fillerPhrases.forEach(phrase => {
      const occurrences = (text.toLowerCase().match(new RegExp(phrase.toLowerCase(), 'g')) || []).length;
      if (occurrences > 2) {
        patterns.push({ 
          type: 'repetitive_filler', 
          phrase: phrase, 
          count: occurrences 
        });
      }
    });
    
    // Check for lists that are repeated verbatim
    const listPattern = /\* [^*\n]+\n\* [^*\n]+\n\* [^*\n]+\n\* [^*\n]+\n\* [^*\n]+/g;
    const lists = text.match(listPattern) || [];
    const uniqueLists = [...new Set(lists)];
    if (lists.length > uniqueLists.length) {
      patterns.push({ 
        type: 'repeated_lists', 
        count: lists.length - uniqueLists.length 
      });
    }
    
    return patterns;
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
    const topic = blogIdea.title || 'Industrial Technology';
    
    // Generate completely different content based on the topic and variation
    const topicSpecificAlternatives = [
      `${topic} involves several critical considerations that organizations must address. Key factors include technical specifications, compatibility requirements, and integration challenges. Understanding these elements is essential for successful implementation and long-term operational success.`,
      
      `When evaluating ${primaryKeyword} solutions, companies should focus on practical benefits and measurable outcomes. This approach ensures that investments align with business objectives and deliver tangible value. Performance metrics and ROI analysis play crucial roles in decision-making processes.`,
      
      `Modern ${primaryKeyword} technologies offer significant advantages over traditional approaches. These benefits include improved efficiency, enhanced accuracy, and reduced operational costs. Organizations that adopt these solutions often experience substantial improvements in productivity and quality.`,
      
      `Implementation strategies for ${primaryKeyword} should be tailored to specific organizational needs and constraints. Factors such as existing infrastructure, budget limitations, and timeline requirements all influence the optimal approach. Careful planning and phased deployment often yield the best results.`,
      
      `The future of ${primaryKeyword} continues to evolve with emerging technologies and changing market demands. Staying informed about industry trends and technological developments helps organizations make strategic decisions about their technology investments and operational improvements.`
    ];
    
    // Add some randomness to avoid predictable patterns
    const randomVariations = [
      `Effective ${primaryKeyword} deployment requires understanding both technical and business requirements. Success depends on proper planning, adequate resources, and ongoing support throughout the implementation process.`,
      
      `Organizations benefit from ${primaryKeyword} through improved operational efficiency and enhanced performance capabilities. These advantages translate into competitive benefits and sustainable business growth.`,
      
      `Technical considerations for ${primaryKeyword} include system compatibility, scalability requirements, and maintenance needs. Addressing these factors early in the planning process helps ensure successful project outcomes.`
    ];
    
    const allAlternatives = [...topicSpecificAlternatives, ...randomVariations];
    return allAlternatives[variationIndex % allAlternatives.length];
  }

  // Apply rewrite suggestions to content
  applyRewriteSuggestions(content, suggestions) {
    let modifiedContent = content;
    
    // Apply fixes for different types of repetitions
    suggestions.forEach(suggestion => {
      if (suggestion.type === 'rewrite_paragraph') {
        // Replace specific repeated paragraphs
        const originalText = suggestion.targetParagraph < 0 ? '' : 
          suggestion.reason.includes('Similar to paragraph') ? 
          suggestion.newContent : suggestion.newContent;
        
        // Find and replace the first occurrence of the repetitive content
        const targetText = suggestion.reason.includes('paragraph') ? 
          modifiedContent.split(/<\/p>\s*<p[^>]*>/gi)[suggestion.targetParagraph] : '';
        
        if (targetText) {
          const cleanTarget = targetText.replace(/<[^>]*>/g, '').trim();
          const regex = new RegExp(this.escapeRegex(cleanTarget), 'gi');
          let replacementCount = 0;
          
          modifiedContent = modifiedContent.replace(regex, (match) => {
            if (replacementCount === 0) {
              replacementCount++;
              return suggestion.newContent;
            }
            return match;
          });
        }
      }
    });
    
    // Additional cleanup for remaining repetitions
    modifiedContent = this.removeObviousRepetitions(modifiedContent);
    
    return modifiedContent;
  }

  // Remove obvious repetitive patterns
  removeObviousRepetitions(content) {
    let cleanedContent = content;
    
    // Remove repeated filler phrases
    const fillerPhrases = [
      'represents a fundamental shift in how organizations approach',
      'the integration of advanced technologies and proven methodologies',
      'creates a robust foundation for operational excellence',
      'industry experts recommend conducting thorough assessments',
      'this ensures optimal performance and maximum return on investment'
    ];
    
    fillerPhrases.forEach(phrase => {
      const regex = new RegExp(this.escapeRegex(phrase), 'gi');
      let count = 0;
      cleanedContent = cleanedContent.replace(regex, (match) => {
        count++;
        return count <= 1 ? match : ''; // Keep only the first occurrence
      });
    });
    
    // Remove repeated bullet point lists
    const listItems = cleanedContent.match(/<li[^>]*>.*?<\/li>/gi) || [];
    const uniqueItems = [...new Set(listItems.map(item => item.toLowerCase()))];
    
    if (listItems.length > uniqueItems.length) {
      // Replace duplicated list items
      const seenItems = new Set();
      cleanedContent = cleanedContent.replace(/<li[^>]*>.*?<\/li>/gi, (match) => {
        const normalized = match.toLowerCase();
        if (seenItems.has(normalized)) {
          return ''; // Remove duplicate
        }
        seenItems.add(normalized);
        return match;
      });
    }
    
    return cleanedContent;
  }

  // Escape special regex characters
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
