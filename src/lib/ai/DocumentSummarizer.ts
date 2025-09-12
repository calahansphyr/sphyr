import { SearchResult } from '@/types/integrations';
import { logger } from '@/lib/logger';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';

export interface SummarizationOptions {
  maxLength: number;
  format: 'bullet' | 'paragraph' | 'executive' | 'detailed';
  includeKeyPoints: boolean;
  includeActionItems: boolean;
  includeMetrics: boolean;
  language: string;
  tone: 'professional' | 'casual' | 'technical' | 'executive';
}

export interface DocumentSummary {
  id: string;
  originalDocumentId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  metrics: Record<string, any>;
  confidence: number;
  processingTime: number;
  format: SummarizationOptions['format'];
  wordCount: number;
  createdAt: Date;
  metadata: {
    originalWordCount: number;
    compressionRatio: number;
    language: string;
    tone: string;
  };
}

export interface SummarizationRequest {
  document: SearchResult;
  options: SummarizationOptions;
  userId: string;
  organizationId: string;
}

class DocumentSummarizer {
  private static instance: DocumentSummarizer;
  private readonly STORAGE_KEY = 'sphyr-document-summaries';
  private readonly MAX_SUMMARIES = 1000;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): DocumentSummarizer {
    if (!DocumentSummarizer.instance) {
      DocumentSummarizer.instance = new DocumentSummarizer();
    }
    return DocumentSummarizer.instance;
  }

  // Main summarization method
  public async summarizeDocument(request: SummarizationRequest): Promise<DocumentSummary> {
    const _startTime = Date.now();
    
    try {
      // Check for existing summary
      const existingSummary = this.getExistingSummary(request.document.id, request.options);
      if (existingSummary) {
        return existingSummary;
      }

      // Generate new summary
      const summary = await this.generateSummary(request);
      
      // Save summary
      this.saveSummary(summary);
      
      return summary;
    } catch (error) {
      logger.error('Document summarization failed', error as Error, {
        operation: 'summarizeDocument',
        documentId: request.document.id
      });
      throw new Error(`Failed to summarize document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate summary using AI-like logic
  private async generateSummary(request: SummarizationRequest): Promise<DocumentSummary> {
    const { document, options } = request;
    const startTime = Date.now();

    // Extract key information from document
    const keyPoints = this.extractKeyPoints(document.content, options.maxLength);
    const actionItems = this.extractActionItems(document.content);
    const metrics = this.extractMetrics(document.content);
    
    // Generate summary based on format
    const summary = this.formatSummary(document.content, keyPoints, options);
    
    // Calculate confidence based on content quality and length
    const confidence = this.calculateConfidence(document.content, summary);
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: this.generateId(),
      originalDocumentId: document.id,
      summary,
      keyPoints,
      actionItems,
      metrics,
      confidence,
      processingTime,
      format: options.format,
      wordCount: summary.split(' ').length,
      createdAt: new Date(),
      metadata: {
        originalWordCount: document.content.split(' ').length,
        compressionRatio: summary.split(' ').length / document.content.split(' ').length,
        language: options.language,
        tone: options.tone
      }
    };
  }

  // Extract key points from content
  private extractKeyPoints(content: string, maxLength: number): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints: string[] = [];
    
    // Look for bullet points, numbered lists, and important statements
    const bulletPattern = /^[\s]*[•\-\*]\s*(.+)$/gm;
    const numberedPattern = /^[\s]*\d+\.\s*(.+)$/gm;
    const importantPattern = /(?:important|key|critical|essential|main|primary|significant)/gi;
    
    // Extract bullet points
    let match;
    while ((match = bulletPattern.exec(content)) !== null) {
      keyPoints.push(match[1].trim());
    }
    
    // Extract numbered items
    while ((match = numberedPattern.exec(content)) !== null) {
      keyPoints.push(match[1].trim());
    }
    
    // Extract sentences with important keywords
    sentences.forEach(sentence => {
      if (importantPattern.test(sentence) && sentence.length < 200) {
        keyPoints.push(sentence.trim());
      }
    });
    
    // If no structured points found, extract most important sentences
    if (keyPoints.length === 0) {
      const importantSentences = sentences
        .filter(s => s.length > 20 && s.length < 150)
        .slice(0, Math.min(5, Math.floor(maxLength / 50)))
        .map(s => s.trim());
      keyPoints.push(...importantSentences);
    }
    
    return keyPoints.slice(0, 10); // Limit to 10 key points
  }

  // Extract action items from content
  private extractActionItems(content: string): string[] {
    const actionItems: string[] = [];
    
    // Look for action-oriented phrases
    const actionPatterns = [
      /(?:action required|todo|task|deadline|due|complete|finish|implement|review|approve|submit|send|call|meet|schedule)/gi,
      /(?:must|should|need to|required to|expected to)/gi,
      /(?:by|before|until|on)\s+[\w\s,]+(?:2024|2025|january|february|march|april|may|june|july|august|september|october|november|december)/gi
    ];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      actionPatterns.forEach(pattern => {
        if (pattern.test(sentence) && sentence.length < 200) {
          actionItems.push(sentence.trim());
        }
      });
    });
    
    return [...new Set(actionItems)].slice(0, 8); // Remove duplicates and limit
  }

  // Extract metrics and numbers from content
  private extractMetrics(content: string): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    // Extract percentages
    const percentagePattern = /\b(\d+(?:\.\d+)?)\s*%/g;
    const percentages: number[] = [];
    let match;
    while ((match = percentagePattern.exec(content)) !== null) {
      percentages.push(parseFloat(match[1]));
    }
    if (percentages.length > 0) {
      metrics.percentages = percentages;
    }
    
    // Extract monetary values
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
    const moneyValues: string[] = [];
    while ((match = moneyPattern.exec(content)) !== null) {
      moneyValues.push(match[0]);
    }
    if (moneyValues.length > 0) {
      metrics.monetaryValues = moneyValues;
    }
    
    // Extract dates
    const datePattern = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
    const dates: string[] = [];
    while ((match = datePattern.exec(content)) !== null) {
      dates.push(match[0]);
    }
    if (dates.length > 0) {
      metrics.dates = dates;
    }
    
    // Extract quantities
    const quantityPattern = /\b(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:units?|items?|pieces?|count|total|sum)/gi;
    const quantities: string[] = [];
    while ((match = quantityPattern.exec(content)) !== null) {
      quantities.push(match[0]);
    }
    if (quantities.length > 0) {
      metrics.quantities = quantities;
    }
    
    return metrics;
  }

  // Format summary based on options
  private formatSummary(content: string, keyPoints: string[], options: SummarizationOptions): string {
    const maxWords = options.maxLength;
    
    switch (options.format) {
      case 'bullet':
        return this.formatBulletSummary(keyPoints, maxWords, options.tone);
      
      case 'paragraph':
        return this.formatParagraphSummary(content, keyPoints, maxWords, options.tone);
      
      case 'executive':
        return this.formatExecutiveSummary(content, keyPoints, maxWords);
      
      case 'detailed':
        return this.formatDetailedSummary(content, keyPoints, maxWords, options.tone);
      
      default:
        return this.formatParagraphSummary(content, keyPoints, maxWords, options.tone);
    }
  }

  private formatBulletSummary(keyPoints: string[], maxWords: number, tone: string): string {
    const wordLimit = Math.floor(maxWords / keyPoints.length);
    const formattedPoints = keyPoints
      .map(point => {
        const words = point.split(' ');
        const truncated = words.length > wordLimit 
          ? words.slice(0, wordLimit).join(' ') + '...'
          : point;
        return `• ${truncated}`;
      })
      .join('\n');
    
    return formattedPoints;
  }

  private formatParagraphSummary(content: string, keyPoints: string[], maxWords: number, tone: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const importantSentences = sentences
      .filter(s => {
        const importantWords = ['important', 'key', 'critical', 'main', 'primary', 'significant', 'major'];
        return importantWords.some(word => s.toLowerCase().includes(word));
      })
      .slice(0, Math.min(5, Math.floor(maxWords / 20)));
    
    if (importantSentences.length === 0) {
      return sentences.slice(0, Math.min(3, Math.floor(maxWords / 25))).join('. ') + '.';
    }
    
    return importantSentences.join('. ') + '.';
  }

  private formatExecutiveSummary(content: string, keyPoints: string[], maxWords: number): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    // Find the most important sentences (first few and those with key terms)
    const executiveSentences = [
      sentences[0], // Usually the most important
      ...sentences.slice(1, 3).filter(s => {
        const executiveTerms = ['overview', 'summary', 'objective', 'goal', 'purpose', 'strategy'];
        return executiveTerms.some(term => s.toLowerCase().includes(term));
      })
    ].filter(Boolean);
    
    const summary = executiveSentences.join('. ') + '.';
    return summary.length > maxWords * 6 
      ? summary.substring(0, maxWords * 6) + '...'
      : summary;
  }

  private formatDetailedSummary(content: string, keyPoints: string[], maxWords: number, tone: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const detailedSentences = sentences.slice(0, Math.min(8, Math.floor(maxWords / 15)));
    
    return detailedSentences.join('. ') + '.';
  }

  // Calculate confidence score
  private calculateConfidence(originalContent: string, summary: string): number {
    const originalWords = originalContent.split(' ').length;
    const summaryWords = summary.split(' ').length;
    
    // Base confidence on content length and summary quality
    let confidence = 0.7; // Base confidence
    
    // Adjust based on content length
    if (originalWords > 500) confidence += 0.1;
    if (originalWords > 1000) confidence += 0.1;
    
    // Adjust based on summary quality
    const compressionRatio = summaryWords / originalWords;
    if (compressionRatio > 0.1 && compressionRatio < 0.5) confidence += 0.1;
    
    // Adjust based on content structure
    const hasStructure = /[•\-\*]|\d+\./.test(originalContent);
    if (hasStructure) confidence += 0.1;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  // Get existing summary if available
  private getExistingSummary(documentId: string, options: SummarizationOptions): DocumentSummary | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const summaries = this.getSummaries();
      const existing = summaries.find(s => 
        s.originalDocumentId === documentId && 
        s.format === options.format &&
        (Date.now() - s.createdAt.getTime()) < this.CACHE_DURATION
      );
      
      return existing || null;
    } catch (error) {
      logger.error('Failed to get existing summary', error as Error, {
        operation: 'getExistingSummary',
        documentId: documentId
      });
      return null;
    }
  }

  // Save summary to localStorage
  private saveSummary(summary: DocumentSummary): void {
    try {
      const summaries = this.getSummaries();
      const updated = [summary, ...summaries.filter(s => s.id !== summary.id)]
        .slice(0, this.MAX_SUMMARIES);
      
      const success = LocalStorageManager.setItem(
        'document_summaries',
        updated,
        { ttl: 7 * 24 * 60 * 60 * 1000 } // 7 days
      );

      if (!success) {
        logger.warn('Failed to save summary to localStorage', {
          operation: 'saveSummary',
          documentId: summary.originalDocumentId,
          summariesCount: updated.length
        });
      }
    } catch (error) {
      logger.error('Failed to save summary', error as Error, {
        operation: 'saveSummary',
        documentId: summary.originalDocumentId
      });
    }
  }

  // Get all summaries
  public getSummaries(): DocumentSummary[] {
    try {
      const summaries = LocalStorageManager.getItem<DocumentSummary[]>('document_summaries');
      if (!summaries) return [];
      
      return summaries.map((s: DocumentSummary) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    } catch (error) {
      logger.error('Failed to load summaries', error as Error, {
        operation: 'getSummaries'
      });
      return [];
    }
  }

  // Get summary by ID
  public getSummaryById(id: string): DocumentSummary | null {
    const summaries = this.getSummaries();
    return summaries.find(s => s.id === id) || null;
  }

  // Delete summary
  public deleteSummary(id: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const summaries = this.getSummaries();
      const updated = summaries.filter(s => s.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error('Failed to delete summary', error as Error, {
        operation: 'deleteSummary',
        summaryId: id
      });
    }
  }

  // Clear all summaries
  public clearSummaries(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export summaries
  public exportSummaries(): DocumentSummary[] {
    return this.getSummaries();
  }

  // Import summaries
  public importSummaries(summaries: DocumentSummary[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = this.getSummaries();
      const combined = [...summaries, ...existing]
        .filter((s, index, arr) => arr.findIndex(other => other.id === s.id) === index)
        .slice(0, this.MAX_SUMMARIES);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(combined));
    } catch (error) {
      logger.error('Failed to import summaries', error as Error, {
        operation: 'importSummaries',
        summariesCount: summaries.length
      });
    }
  }

  // Utility methods
  private generateId(): string {
    return `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get summarization statistics
  public getStatistics(): {
    totalSummaries: number;
    averageConfidence: number;
    averageProcessingTime: number;
    formatDistribution: Record<string, number>;
    averageCompressionRatio: number;
  } {
    const summaries = this.getSummaries();
    
    if (summaries.length === 0) {
      return {
        totalSummaries: 0,
        averageConfidence: 0,
        averageProcessingTime: 0,
        formatDistribution: {},
        averageCompressionRatio: 0
      };
    }
    
    const totalConfidence = summaries.reduce((sum, s) => sum + s.confidence, 0);
    const totalProcessingTime = summaries.reduce((sum, s) => sum + s.processingTime, 0);
    const totalCompressionRatio = summaries.reduce((sum, s) => sum + s.metadata.compressionRatio, 0);
    
    const formatDistribution: Record<string, number> = {};
    summaries.forEach(s => {
      formatDistribution[s.format] = (formatDistribution[s.format] || 0) + 1;
    });
    
    return {
      totalSummaries: summaries.length,
      averageConfidence: totalConfidence / summaries.length,
      averageProcessingTime: totalProcessingTime / summaries.length,
      formatDistribution,
      averageCompressionRatio: totalCompressionRatio / summaries.length
    };
  }
}

export const documentSummarizer = DocumentSummarizer.getInstance();
