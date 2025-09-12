import { SearchResult } from '@/types/integrations';

export interface SearchFilter {
  id: string;
  type: 'date_range' | 'file_type' | 'author' | 'integration' | 'tags' | 'size' | 'visibility' | 'content_type';
  label: string;
  value: unknown;
  operator?: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  isActive: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: SearchFilter[];
  isDefault?: boolean;
  category?: string;
}

export interface FilterSuggestion {
  type: SearchFilter['type'];
  label: string;
  value: unknown;
  confidence: number;
  reason: string;
}

class SmartFilters {
  private static instance: SmartFilters;
  private readonly STORAGE_KEY = 'sphyr-filter-presets';
  private readonly MAX_PRESETS = 20;

  public static getInstance(): SmartFilters {
    if (!SmartFilters.instance) {
      SmartFilters.instance = new SmartFilters();
    }
    return SmartFilters.instance;
  }

  // Filter Types Configuration
  public getFilterTypes(): Array<{
    type: SearchFilter['type'];
    label: string;
    description: string;
    icon: string;
    operators: SearchFilter['operator'][];
    inputType: 'text' | 'select' | 'date' | 'number' | 'multiselect' | 'range';
    options?: Array<{ value: unknown; label: string }>;
  }> {
    return [
      {
        type: 'date_range',
        label: 'Date Range',
        description: 'Filter by creation or modification date',
        icon: '📅',
        operators: ['between', 'greater_than', 'less_than'],
        inputType: 'date',
        options: [
          { value: 'last_week', label: 'Last Week' },
          { value: 'last_month', label: 'Last Month' },
          { value: 'last_quarter', label: 'Last Quarter' },
          { value: 'last_year', label: 'Last Year' }
        ]
      },
      {
        type: 'file_type',
        label: 'File Type',
        description: 'Filter by document type',
        icon: '📄',
        operators: ['equals', 'in', 'not_in'],
        inputType: 'multiselect',
        options: [
          { value: 'pdf', label: 'PDF' },
          { value: 'doc', label: 'Word Document' },
          { value: 'docx', label: 'Word Document (DOCX)' },
          { value: 'xls', label: 'Excel Spreadsheet' },
          { value: 'xlsx', label: 'Excel Spreadsheet (XLSX)' },
          { value: 'ppt', label: 'PowerPoint Presentation' },
          { value: 'pptx', label: 'PowerPoint Presentation (PPTX)' },
          { value: 'txt', label: 'Text File' },
          { value: 'md', label: 'Markdown' },
          { value: 'html', label: 'HTML' },
          { value: 'json', label: 'JSON' },
          { value: 'csv', label: 'CSV' }
        ]
      },
      {
        type: 'author',
        label: 'Author',
        description: 'Filter by document author',
        icon: '👤',
        operators: ['equals', 'contains', 'in', 'not_in'],
        inputType: 'multiselect'
      },
      {
        type: 'integration',
        label: 'Source',
        description: 'Filter by data source',
        icon: '🔗',
        operators: ['equals', 'in', 'not_in'],
        inputType: 'multiselect',
        options: [
          { value: 'google', label: 'Google Workspace' },
          { value: 'notion', label: 'Notion' },
          { value: 'slack', label: 'Slack' },
          { value: 'github', label: 'GitHub' },
          { value: 'confluence', label: 'Confluence' },
          { value: 'jira', label: 'Jira' },
          { value: 'asana', label: 'Asana' },
          { value: 'trello', label: 'Trello' }
        ]
      },
      {
        type: 'tags',
        label: 'Tags',
        description: 'Filter by document tags',
        icon: '🏷️',
        operators: ['contains', 'in', 'not_in'],
        inputType: 'multiselect'
      },
      {
        type: 'size',
        label: 'File Size',
        description: 'Filter by document size',
        icon: '📏',
        operators: ['greater_than', 'less_than', 'between'],
        inputType: 'range'
      },
      {
        type: 'visibility',
        label: 'Visibility',
        description: 'Filter by document visibility',
        icon: '👁️',
        operators: ['equals'],
        inputType: 'select',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' },
          { value: 'shared', label: 'Shared' },
          { value: 'restricted', label: 'Restricted' }
        ]
      },
      {
        type: 'content_type',
        label: 'Content Type',
        description: 'Filter by content category',
        icon: '📋',
        operators: ['equals', 'in', 'not_in'],
        inputType: 'multiselect',
        options: [
          { value: 'document', label: 'Document' },
          { value: 'spreadsheet', label: 'Spreadsheet' },
          { value: 'presentation', label: 'Presentation' },
          { value: 'email', label: 'Email' },
          { value: 'message', label: 'Message' },
          { value: 'code', label: 'Code' },
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' }
        ]
      }
    ];
  }

  // Filter Application
  public applyFilters(results: SearchResult[], filters: SearchFilter[]): SearchResult[] {
    if (!filters.length) return results;

    return results.filter(result => {
      return filters.every(filter => {
        if (!filter.isActive) return true;
        return this.applyFilter(result, filter);
      });
    });
  }

  private applyFilter(result: SearchResult, filter: SearchFilter): boolean {
    const { type, value, operator = 'equals' } = filter;

    switch (type) {
      case 'date_range':
        return this.applyDateFilter(result, value, operator);
      case 'file_type':
        return this.applyFileTypeFilter(result, value, operator);
      case 'author':
        return this.applyAuthorFilter(result, value, operator);
      case 'integration':
        return this.applyIntegrationFilter(result, value, operator);
      case 'tags':
        return this.applyTagsFilter(result, value, operator);
      case 'size':
        return this.applySizeFilter(result, value, operator);
      case 'visibility':
        return this.applyVisibilityFilter(result, value, operator);
      case 'content_type':
        return this.applyContentTypeFilter(result, value, operator);
      default:
        return true;
    }
  }

  private applyDateFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const resultDate = new Date(result.createdAt || result.updatedAt || 0);
    
    if (operator === 'between' && Array.isArray(value) && value.length === 2) {
      const [start, end] = value;
      return resultDate >= new Date(start) && resultDate <= new Date(end);
    }
    
    if (operator === 'greater_than') {
      return resultDate > new Date(value);
    }
    
    if (operator === 'less_than') {
      return resultDate < new Date(value);
    }
    
    return true;
  }

  private applyFileTypeFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const fileType = this.extractFileType(result.url || result.title);
    
    if (operator === 'equals') {
      return fileType === value;
    }
    
    if (operator === 'in' && Array.isArray(value)) {
      return value.includes(fileType);
    }
    
    if (operator === 'not_in' && Array.isArray(value)) {
      return !value.includes(fileType);
    }
    
    return true;
  }

  private applyAuthorFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const author = result.author || '';
    
    if (operator === 'equals') {
      return author.toLowerCase() === value.toLowerCase();
    }
    
    if (operator === 'contains') {
      return author.toLowerCase().includes(value.toLowerCase());
    }
    
    if (operator === 'in' && Array.isArray(value)) {
      return value.some((v: string) => author.toLowerCase().includes(v.toLowerCase()));
    }
    
    if (operator === 'not_in' && Array.isArray(value)) {
      return !value.some((v: string) => author.toLowerCase().includes(v.toLowerCase()));
    }
    
    return true;
  }

  private applyIntegrationFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const source = result.source || '';
    
    if (operator === 'equals') {
      return source.toLowerCase() === value.toLowerCase();
    }
    
    if (operator === 'in' && Array.isArray(value)) {
      return value.includes(source.toLowerCase());
    }
    
    if (operator === 'not_in' && Array.isArray(value)) {
      return !value.includes(source.toLowerCase());
    }
    
    return true;
  }

  private applyTagsFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const tags = result.tags || [];
    
    if (operator === 'contains') {
      return tags.some((tag: string) => tag.toLowerCase().includes(value.toLowerCase()));
    }
    
    if (operator === 'in' && Array.isArray(value)) {
      return value.some((v: string) => tags.includes(v));
    }
    
    if (operator === 'not_in' && Array.isArray(value)) {
      return !value.some((v: string) => tags.includes(v));
    }
    
    return true;
  }

  private applySizeFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const size = result.size || 0;
    
    if (operator === 'greater_than') {
      return size > value;
    }
    
    if (operator === 'less_than') {
      return size < value;
    }
    
    if (operator === 'between' && Array.isArray(value) && value.length === 2) {
      const [min, max] = value;
      return size >= min && size <= max;
    }
    
    return true;
  }

  private applyVisibilityFilter(result: SearchResult, value: unknown, _operator: string): boolean {
    const visibility = result.visibility || 'private';
    return visibility === value;
  }

  private applyContentTypeFilter(result: SearchResult, value: unknown, operator: string): boolean {
    const contentType = result.contentType || 'document';
    
    if (operator === 'equals') {
      return contentType === value;
    }
    
    if (operator === 'in' && Array.isArray(value)) {
      return value.includes(contentType);
    }
    
    if (operator === 'not_in' && Array.isArray(value)) {
      return !value.includes(contentType);
    }
    
    return true;
  }

  // Smart Filter Suggestions
  public generateFilterSuggestions(query: string, results: SearchResult[]): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];
    
    // Analyze results to suggest relevant filters
    const analysis = this.analyzeResults(results);
    
    // Suggest date range filter if results span a long time
    if (analysis.dateRange > 365) {
      suggestions.push({
        type: 'date_range',
        label: 'Recent Documents',
        value: { operator: 'greater_than', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        confidence: 0.8,
        reason: 'Results span over a year, consider filtering to recent documents'
      });
    }
    
    // Suggest file type filter if there are many different types
    if (analysis.fileTypes.length > 5) {
      const mostCommonType = analysis.fileTypes[0];
      suggestions.push({
        type: 'file_type',
        label: `Focus on ${mostCommonType}`,
        value: { operator: 'equals', value: mostCommonType },
        confidence: 0.7,
        reason: `Most results are ${mostCommonType} files`
      });
    }
    
    // Suggest source filter if there are many different sources
    if (analysis.sources.length > 3) {
      const mostCommonSource = analysis.sources[0];
      suggestions.push({
        type: 'integration',
        label: `From ${mostCommonSource}`,
        value: { operator: 'equals', value: mostCommonSource },
        confidence: 0.6,
        reason: `Most results come from ${mostCommonSource}`
      });
    }
    
    // Suggest author filter if there are many different authors
    if (analysis.authors.length > 5) {
      const mostCommonAuthor = analysis.authors[0];
      suggestions.push({
        type: 'author',
        label: `By ${mostCommonAuthor}`,
        value: { operator: 'equals', value: mostCommonAuthor },
        confidence: 0.5,
        reason: `Many results by ${mostCommonAuthor}`
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeResults(results: SearchResult[]): {
    dateRange: number;
    fileTypes: string[];
    sources: string[];
    authors: string[];
  } {
    const dates = results
      .map(r => new Date(r.createdAt || r.updatedAt || 0))
      .filter(d => !isNaN(d.getTime()));
    
    const dateRange = dates.length > 1 
      ? Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()))
      : 0;
    
    const fileTypes = this.getMostCommon(
      results.map(r => this.extractFileType(r.url || r.title))
    );
    
    const sources = this.getMostCommon(
      results.map(r => r.source || 'unknown')
    );
    
    const authors = this.getMostCommon(
      results.map(r => r.author || 'unknown').filter(a => a !== 'unknown')
    );
    
    return { dateRange, fileTypes, sources, authors };
  }

  private getMostCommon(items: string[]): string[] {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([item]) => item);
  }

  private extractFileType(urlOrTitle: string): string {
    const match = urlOrTitle.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  // Filter Presets
  public getFilterPresets(): FilterPreset[] {
    if (typeof window === 'undefined') return this.getDefaultPresets();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }

    return this.getDefaultPresets();
  }

  public saveFilterPreset(preset: FilterPreset): void {
    if (typeof window === 'undefined') return;

    try {
      const presets = this.getFilterPresets();
      const existingIndex = presets.findIndex(p => p.id === preset.id);
      
      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }
      
      // Limit number of presets
      const limitedPresets = presets.slice(0, this.MAX_PRESETS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedPresets));
    } catch (error) {
      console.error('Failed to save filter preset:', error);
    }
  }

  public deleteFilterPreset(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const presets = this.getFilterPresets();
      const updatedPresets = presets.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Failed to delete filter preset:', error);
    }
  }

  private getDefaultPresets(): FilterPreset[] {
    return [
      {
        id: 'recent_documents',
        name: 'Recent Documents',
        description: 'Documents from the last 30 days',
        category: 'Time',
        filters: [
          {
            id: 'recent_date',
            type: 'date_range',
            label: 'Last 30 Days',
            value: { operator: 'greater_than', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            isActive: true
          }
        ]
      },
      {
        id: 'important_documents',
        name: 'Important Documents',
        description: 'PDFs and Word documents',
        category: 'Type',
        filters: [
          {
            id: 'important_files',
            type: 'file_type',
            label: 'Important File Types',
            value: { operator: 'in', value: ['pdf', 'doc', 'docx'] },
            isActive: true
          }
        ]
      },
      {
        id: 'my_documents',
        name: 'My Documents',
        description: 'Documents I created or modified',
        category: 'Ownership',
        filters: [
          {
            id: 'my_files',
            type: 'visibility',
            label: 'My Files',
            value: { operator: 'equals', value: 'private' },
            isActive: true
          }
        ]
      }
    ];
  }

  // Utility Methods
  public createFilter(
    type: SearchFilter['type'],
    value: unknown,
    operator: SearchFilter['operator'] = 'equals'
  ): SearchFilter {
    const filterTypes = this.getFilterTypes();
    const filterType = filterTypes.find(ft => ft.type === type);
    
    return {
      id: this.generateId(),
      type,
      label: filterType?.label || type,
      value,
      operator,
      isActive: true
    };
  }

  public toggleFilter(filter: SearchFilter): SearchFilter {
    return { ...filter, isActive: !filter.isActive };
  }

  public updateFilter(filter: SearchFilter, updates: Partial<SearchFilter>): SearchFilter {
    return { ...filter, ...updates };
  }

  private generateId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const smartFilters = SmartFilters.getInstance();
