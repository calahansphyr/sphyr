/**
 * Procore Construction Integration Adapter
 * Implements the Adapter Pattern to standardize Procore API interactions
 */

// Procore SDK import removed as it's not used
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  ProcoreDocument, 
  ProcoreRfi, 
  ProcoreSearchOptions, 
  ProcoreDocumentSearchResult, 
  ProcoreRfiSearchResult,
  ProcoreApiDocument,
  ProcoreApiRfi,
  ProcoreApiProject,
  ProcoreApiFolder,
  ProcoreApiUser
} from '@/types/integrations';

export interface ProcoreAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    baseUrl: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class ProcoreAdapter {
  private config: ProcoreAdapterConfig;

  constructor(config: ProcoreAdapterConfig) {
    this.config = config;
  }

  /**
   * Make authenticated HTTP request to Procore API
   */
  private async makeRequest(endpoint: string, options: { params?: Record<string, string | number> } = {}): Promise<{ data: unknown; meta?: { total?: number } }> {
    try {
      const url = new URL(endpoint, this.config.credentials.baseUrl);
      
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.config.tokens.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      const data = await response.json();
      return { data, meta: { total: data.length } };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for documents in Procore
   */
  async searchDocuments(options: ProcoreSearchOptions): Promise<ProcoreDocumentSearchResult> {
    try {
      const { query, limit = 10, skip = 0, projectId, folderId } = options;

      // Build search parameters
      const searchParams: Record<string, string | number> = {
        search: query.trim(),
        per_page: limit,
        page: Math.floor(skip / limit) + 1,
      };

      if (projectId) {
        searchParams.project_id = projectId;
      }

      if (folderId) {
        searchParams.folder_id = folderId;
      }

      // Search documents using Procore API
      const response = await this.makeRequest('/rest/v1.0/documents', {
        params: searchParams,
      });

      const documents = (response.data as ProcoreApiDocument[]) || [];
      const totalCount = response.meta?.total || documents.length;
      const hasMore = documents.length === limit;

      // Parse documents
      const parsedDocuments = documents.map((doc: ProcoreApiDocument) => this.parseProcoreDocument(doc));

      return {
        documents: parsedDocuments,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleProcoreError(error, 'searchDocuments', { options });
    }
  }

  /**
   * Search for RFIs (Request for Information) in Procore
   */
  async searchRfis(options: ProcoreSearchOptions): Promise<ProcoreRfiSearchResult> {
    try {
      const { query, limit = 10, skip = 0, projectId } = options;

      // Build search parameters
      const searchParams: Record<string, string | number> = {
        search: query.trim(),
        per_page: limit,
        page: Math.floor(skip / limit) + 1,
      };

      if (projectId) {
        searchParams.project_id = projectId;
      }

      // Search RFIs using Procore API
      const response = await this.makeRequest('/rest/v1.0/rfis', {
        params: searchParams,
      });

      const rfis = (response.data as ProcoreApiRfi[]) || [];
      const totalCount = response.meta?.total || rfis.length;
      const hasMore = rfis.length === limit;

      // Parse RFIs
      const parsedRfis = rfis.map((rfi: ProcoreApiRfi) => this.parseProcoreRfi(rfi));

      return {
        rfis: parsedRfis,
        totalCount,
        hasMore,
      };
    } catch (error) {
      throw this.handleProcoreError(error, 'searchRfis', { options });
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: number, projectId: number): Promise<ProcoreDocument> {
    try {
      const response = await this.makeRequest(`/rest/v1.0/projects/${projectId}/documents/${documentId}`);
      return this.parseProcoreDocument(response.data as ProcoreApiDocument);
    } catch (error) {
      throw this.handleProcoreError(error, 'getDocument', { documentId, projectId });
    }
  }

  /**
   * Get a specific RFI by ID
   */
  async getRfi(rfiId: number, projectId: number): Promise<ProcoreRfi> {
    try {
      const response = await this.makeRequest(`/rest/v1.0/projects/${projectId}/rfis/${rfiId}`);
      return this.parseProcoreRfi(response.data as ProcoreApiRfi);
    } catch (error) {
      throw this.handleProcoreError(error, 'getRfi', { rfiId, projectId });
    }
  }

  /**
   * Get user's projects
   */
  async getProjects(): Promise<Array<{ id: number; name: string; projectNumber: string; status: string }>> {
    try {
      const response = await this.makeRequest('/rest/v1.0/projects');
      const projects = (response.data as ProcoreApiProject[]) || [];
      
      return projects.map((project: ProcoreApiProject) => ({
        id: project.id || 0,
        name: project.name || 'Unknown Project',
        projectNumber: project.project_number || '',
        status: project.status || 'active',
      }));
    } catch (error) {
      throw this.handleProcoreError(error, 'getProjects', {});
    }
  }

  /**
   * Get project folders
   */
  async getProjectFolders(projectId: number): Promise<Array<{ id: number; name: string; fullPath: string }>> {
    try {
      const response = await this.makeRequest(`/rest/v1.0/projects/${projectId}/folders`);
      const folders = (response.data as ProcoreApiFolder[]) || [];
      
      return folders.map((folder: ProcoreApiFolder) => ({
        id: folder.id || 0,
        name: folder.name || 'Unknown Folder',
        fullPath: folder.full_path || '',
      }));
    } catch (error) {
      throw this.handleProcoreError(error, 'getProjectFolders', { projectId });
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{ id: number; name: string; email: string; company: string }> {
    try {
      const response = await this.makeRequest('/rest/v1.0/me');
      const user = (response.data as ProcoreApiUser) || {} as ProcoreApiUser;
      
      return {
        id: user.id || 0,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        email: user.email_address || '',
        company: user.company?.name || 'Unknown Company',
      };
    } catch (error) {
      throw this.handleProcoreError(error, 'getUserInfo', {});
    }
  }

  /**
   * Parse raw Procore document data into our standardized format
   */
  private parseProcoreDocument(doc: ProcoreApiDocument): ProcoreDocument {
    return {
      id: doc.id || 0,
      title: doc.title || 'Unknown Document',
      description: doc.description || undefined,
      file_name: doc.file_name || 'unknown',
      file_size: doc.file_size || 0,
      content_type: doc.content_type || 'application/octet-stream',
      created_at: doc.created_at || new Date().toISOString(),
      updated_at: doc.updated_at || new Date().toISOString(),
      uploaded_by: {
        id: doc.uploaded_by?.id || 0,
        login: doc.uploaded_by?.login || '',
        first_name: doc.uploaded_by?.first_name || '',
        last_name: doc.uploaded_by?.last_name || '',
        email_address: doc.uploaded_by?.email_address || '',
      },
      project: {
        id: doc.project?.id || 0,
        name: doc.project?.name || 'Unknown Project',
        project_number: doc.project?.project_number || '',
      },
      folder: {
        id: doc.folder?.id || 0,
        name: doc.folder?.name || 'Unknown Folder',
        full_path: doc.folder?.full_path || '',
      },
      url: doc.url || '',
      download_url: doc.download_url || undefined,
      is_private: doc.is_private || false,
      tags: doc.tags || [],
    };
  }

  /**
   * Parse raw Procore RFI data into our standardized format
   */
  private parseProcoreRfi(rfi: ProcoreApiRfi): ProcoreRfi {
    return {
      id: rfi.id || 0,
      number: rfi.number || '',
      subject: rfi.subject || 'No Subject',
      question: rfi.question || '',
      answer: rfi.answer || undefined,
      status: rfi.status || 'open',
      priority: rfi.priority || 'normal',
      created_at: rfi.created_at || new Date().toISOString(),
      updated_at: rfi.updated_at || new Date().toISOString(),
      due_date: rfi.due_date || undefined,
      answered_at: rfi.answered_at || undefined,
      created_by: {
        id: rfi.created_by?.id || 0,
        login: rfi.created_by?.login || '',
        first_name: rfi.created_by?.first_name || '',
        last_name: rfi.created_by?.last_name || '',
        email_address: rfi.created_by?.email_address || '',
      },
      assigned_to: rfi.assigned_to ? {
        id: rfi.assigned_to.id || 0,
        login: rfi.assigned_to.login || '',
        first_name: rfi.assigned_to.first_name || '',
        last_name: rfi.assigned_to.last_name || '',
        email_address: rfi.assigned_to.email_address || '',
      } : undefined,
      project: {
        id: rfi.project?.id || 0,
        name: rfi.project?.name || 'Unknown Project',
        project_number: rfi.project?.project_number || '',
      },
      trade: {
        id: rfi.trade?.id || 0,
        name: rfi.trade?.name || 'Unknown Trade',
      },
      location: rfi.location ? {
        id: rfi.location.id || 0,
        name: rfi.location.name || 'Unknown Location',
        full_path: rfi.location.full_path || '',
      } : undefined,
      attachments: (rfi.attachments || []).map((attachment) => ({
        id: attachment.id || 0,
        file_name: attachment.file_name || 'unknown',
        file_size: attachment.file_size || 0,
        content_type: attachment.content_type || 'application/octet-stream',
        url: attachment.url || '',
      })),
    };
  }

  /**
   * Handle Procore API errors and convert them to standardized IntegrationError
   */
  private handleProcoreError(error: unknown, operation: string, context: Record<string, unknown>): IntegrationError {
    const sphyrError = toSphyrError(error, {
      provider: 'Procore',
      operation,
      ...context,
    });

    // Handle specific Procore errors
    if ((error as Error & { status?: number }).status === 401) {
      return new IntegrationError(
        'Procore',
        'Authentication failed. Please reconnect your Procore account.',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Your Procore session has expired. Please reconnect your account.',
        }
      );
    }

    if ((error as Error & { status?: number }).status === 403) {
      return new IntegrationError(
        'Procore',
        'Insufficient permissions to access Procore data',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Insufficient permissions to access your Procore data. Please check your account permissions.',
        }
      );
    }

    if ((error as Error & { status?: number }).status === 429) {
      return new IntegrationError(
        'Procore',
        'Request was rate limited by Procore API',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Request was rate limited. Please try again in a moment.',
        }
      );
    }

    if ((error as Error & { status?: number }).status && (error as Error & { status?: number }).status! >= 500) {
      return new IntegrationError(
        'Procore',
        'Procore service is temporarily unavailable',
        {
          originalError: error as Error,
          operation,
          context,
          userMessage: 'Procore service is temporarily unavailable. Please try again later.',
        }
      );
    }

    return new IntegrationError(
      'Procore',
      `Failed to ${operation}: ${sphyrError.message}`,
      {
        originalError: error as Error,
        operation,
        context,
      }
    );
  }

  /**
   * Test the connection to Procore
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch {
      return false;
    }
  }
}
