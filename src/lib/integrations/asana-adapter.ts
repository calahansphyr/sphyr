/**
 * Asana Integration Adapter
 * Implements the Adapter Pattern to standardize Asana API interactions
 */

import * as asana from 'asana';
import { IntegrationError, toSphyrError } from '@/lib/errors';
import type { 
  AsanaTask, 
  AsanaProject, 
  AsanaUser, 
  AsanaTag,
  AsanaApiTask,
  AsanaApiProject,
  AsanaApiUser,
  AsanaApiTag
} from '@/types/integrations';

export interface AsanaAdapterConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}

export interface AsanaSearchOptions {
  query: string;
  limit?: number;
  workspaceId?: string;
  projectId?: string;
  assigneeId?: string;
  completed?: boolean;
}

export interface AsanaSearchResult {
  tasks: AsanaTask[];
  totalCount: number;
  hasMore: boolean;
}

export interface AsanaProjectSearchResult {
  projects: AsanaProject[];
  totalCount: number;
  hasMore: boolean;
}

export class AsanaAdapter {
  private client!: asana.Client;
  private config: AsanaAdapterConfig;

  constructor(config: AsanaAdapterConfig) {
    this.config = config;
    this.initializeAsanaClient();
  }

  /**
   * Initialize the Asana client with OAuth2 credentials
   */
  private initializeAsanaClient(): void {
    try {
      this.client = asana.Client.create({
        clientId: this.config.credentials.clientId,
        clientSecret: this.config.credentials.clientSecret,
        redirectUri: this.config.credentials.redirectUri,
      });

      // Set the access token
      this.client.useOauth({
        credentials: {
          access_token: this.config.tokens.accessToken,
          refresh_token: this.config.tokens.refreshToken,
        },
      });
    } catch (error) {
      throw new IntegrationError(
        'Asana',
        'Failed to initialize Asana client',
        {
          originalError: error as Error,
          operation: 'initializeAsanaClient',
        }
      );
    }
  }

  /**
   * Search for tasks in Asana
   */
  async searchTasks(options: AsanaSearchOptions): Promise<AsanaSearchResult> {
    try {
      const {
        query,
        limit = 10,
        workspaceId,
        projectId,
        assigneeId,
        completed
      } = options;

      // Build search parameters
      const searchParams: Record<string, string | number | boolean> = {
        text: query.trim(),
        limit,
        opt_fields: 'gid,name,notes,completed,due_on,assignee,projects,tags,created_at,modified_at,permalink_url',
      };

      if (workspaceId) {
        searchParams.workspace = workspaceId;
      }

      if (projectId) {
        searchParams.project = projectId;
      }

      if (assigneeId) {
        searchParams.assignee = assigneeId;
      }

      if (completed !== undefined) {
        searchParams.completed = completed;
      }

      const response = await this.client.tasks.findAll(searchParams);

      const tasks = response.data || [];
      const totalCount = tasks.length; // Asana search doesn't provide total count

      return {
        tasks: tasks.map((task) => this.parseAsanaTask(task as unknown as AsanaApiTask)),
        totalCount,
        hasMore: false, // Asana search doesn't provide pagination info
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'searchTasks',
        query: options.query,
      });

      throw new IntegrationError(
        'Asana',
        `Failed to search tasks: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'searchTasks',
          query: options.query,
        }
      );
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<AsanaTask> {
    try {
      const response = await this.client.tasks.findById(taskId, {
        opt_fields: 'gid,name,notes,completed,due_on,assignee,projects,tags,created_at,modified_at,permalink_url',
      });

      return this.parseAsanaTask(response as unknown as AsanaApiTask);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'getTask',
        taskId,
      });

      throw new IntegrationError(
        'Asana',
        `Failed to get task: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getTask',
          taskId,
        }
      );
    }
  }

  /**
   * List projects in a workspace
   */
  async listProjects(workspaceId?: string): Promise<AsanaProjectSearchResult> {
    try {
      const params: Record<string, string | number> = {
        opt_fields: 'gid,name,color,notes,archived,created_at,modified_at',
        limit: 100,
      };

      if (workspaceId) {
        params.workspace = workspaceId;
      }

      const response = await this.client.projects.findAll(params);

      const projects = response.data || [];

      return {
        projects: projects.map((project) => this.parseAsanaProject(project as unknown as AsanaApiProject)),
        totalCount: projects.length,
        hasMore: false,
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'listProjects',
        workspaceId,
      });

      throw new IntegrationError(
        'Asana',
        `Failed to list projects: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listProjects',
          workspaceId,
        }
      );
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: string = 'me'): Promise<AsanaUser> {
    try {
      const response = await this.client.users.findById(userId, {
        opt_fields: 'gid,name,email,photo',
      });

      return this.parseAsanaUser(response as unknown as AsanaApiUser);

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'getUserInfo',
        userId,
      });

      throw new IntegrationError(
        'Asana',
        `Failed to get user info: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getUserInfo',
          userId,
        }
      );
    }
  }

  /**
   * Get workspace information
   */
  async getWorkspaceInfo(workspaceId: string): Promise<{ id: string; name: string }> {
    try {
      const response = await this.client.workspaces.findById(workspaceId, {
        opt_fields: 'gid,name',
      });

      return {
        id: response.gid || '',
        name: response.name || 'Unknown Workspace',
      };

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'getWorkspaceInfo',
        workspaceId,
      });

      throw new IntegrationError(
        'Asana',
        `Failed to get workspace info: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'getWorkspaceInfo',
          workspaceId,
        }
      );
    }
  }

  /**
   * List user's workspaces
   */
  async listWorkspaces(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.client.workspaces.findAll({
        opt_fields: 'gid,name',
      });

      return (response.data || []).map((workspace) => ({
        id: workspace.gid || '',
        name: workspace.name || 'Unknown Workspace',
      }));

    } catch (error) {
      const sphyrError = toSphyrError(error, {
        provider: 'Asana',
        operation: 'listWorkspaces',
      });

      throw new IntegrationError(
        'Asana',
        `Failed to list workspaces: ${sphyrError.message}`,
        {
          originalError: error as Error,
          operation: 'listWorkspaces',
        }
      );
    }
  }

  /**
   * Parse raw Asana task data into our standardized format
   */
  private parseAsanaTask(task: AsanaApiTask): AsanaTask {
    return {
      id: task.gid || '',
      name: task.name || 'Untitled Task',
      notes: task.notes || '',
      completed: task.completed || false,
      dueOn: task.due_on || undefined,
      assignee: (task as AsanaApiTask & { assignee?: AsanaApiUser }).assignee ? this.parseAsanaUser((task as AsanaApiTask & { assignee?: AsanaApiUser }).assignee as AsanaApiUser) : undefined,
      projects: ((task as AsanaApiTask & { projects?: AsanaApiProject[] }).projects || []).map((project: AsanaApiProject) => this.parseAsanaProject(project)),
      tags: ((task as AsanaApiTask & { tags?: AsanaApiTag[] }).tags || []).map((tag: AsanaApiTag) => this.parseAsanaTag(tag)),
      createdAt: task.created_at || new Date().toISOString(),
      modifiedAt: task.modified_at || new Date().toISOString(),
    };
  }

  /**
   * Parse raw Asana project data into our standardized format
   */
  private parseAsanaProject(project: AsanaApiProject): AsanaProject {
    return {
      id: project.gid || '',
      name: project.name || 'Untitled Project',
      color: project.color || undefined,
      notes: project.notes || undefined,
      archived: project.archived || false,
      createdAt: project.created_at || new Date().toISOString(),
      modifiedAt: project.modified_at || new Date().toISOString(),
    };
  }

  /**
   * Parse raw Asana user data into our standardized format
   */
  private parseAsanaUser(user: AsanaApiUser): AsanaUser {
    return {
      id: user.gid || '',
      name: user.name || 'Unknown User',
      email: user.email || undefined,
      photo: user.photo?.image_128x128 || user.photo?.image_60x60 || user.photo?.image_36x36 || undefined,
    };
  }

  /**
   * Parse raw Asana tag data into our standardized format
   */
  private parseAsanaTag(tag: AsanaApiTag): AsanaTag {
    return {
      id: tag.gid || '',
      name: tag.name || 'Untitled Tag',
      color: tag.color || undefined,
    };
  }

  /**
   * Test the connection to Asana
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
