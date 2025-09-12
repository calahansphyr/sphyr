import { EventEmitter } from 'events';

export interface CollaborationSession {
  id: string;
  name: string;
  ownerId: string;
  participants: CollaborationParticipant[];
  searchQuery?: string;
  searchResults?: unknown[];
  sharedFilters?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CollaborationParticipant {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'collaborator' | 'viewer';
  joinedAt: string;
  lastActiveAt: string;
  cursorPosition?: {
    x: number;
    y: number;
  };
  isOnline: boolean;
}

export interface CollaborationEvent {
  type: 'search' | 'filter' | 'cursor' | 'comment' | 'join' | 'leave' | 'result_click';
  sessionId: string;
  userId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface CollaborationComment {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  targetElement?: string;
  position?: {
    x: number;
    y: number;
  };
  createdAt: string;
  replies?: CollaborationComment[];
}

class RealTimeCollaboration extends EventEmitter {
  private sessions: Map<string, CollaborationSession> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private comments: Map<string, CollaborationComment[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    super();
    this.initializeConnection();
  }

  private initializeConnection(): void {
    // In a real application, this would connect to a WebSocket server
    // For now, we'll simulate the connection
    this.simulateConnection();
  }

  private simulateConnection(): void {
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connected');
      console.log('Real-time collaboration connected');
    }, 1000);
  }

  // Session Management
  public createSession(name: string, ownerId: string, ownerName: string, ownerEmail: string): CollaborationSession {
    const sessionId = this.generateSessionId();
    const session: CollaborationSession = {
      id: sessionId,
      name,
      ownerId,
      participants: [{
        userId: ownerId,
        name: ownerName,
        email: ownerEmail,
        role: 'owner',
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isOnline: true
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.addUserToSession(ownerId, sessionId);

    this.emit('session_created', session);
    return session;
  }

  public joinSession(sessionId: string, userId: string, userName: string, userEmail: string, role: 'collaborator' | 'viewer' = 'collaborator'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // Check if user is already in the session
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      existingParticipant.isOnline = true;
      existingParticipant.lastActiveAt = new Date().toISOString();
    } else {
      session.participants.push({
        userId,
        name: userName,
        email: userEmail,
        role,
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isOnline: true
      });
    }

    session.updatedAt = new Date().toISOString();
    this.addUserToSession(userId, sessionId);

    this.emit('user_joined', {
      sessionId,
      userId,
      userName,
      role
    });

    return true;
  }

  public leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.isOnline = false;
      participant.lastActiveAt = new Date().toISOString();
    }

    this.removeUserFromSession(userId, sessionId);

    this.emit('user_left', {
      sessionId,
      userId
    });
  }

  // Search Collaboration
  public shareSearch(sessionId: string, userId: string, query: string, results: unknown[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.searchQuery = query;
    session.searchResults = results;
    session.updatedAt = new Date().toISOString();

    this.emit('search_shared', {
      sessionId,
      userId,
      query,
      results
    });
  }

  public updateFilters(sessionId: string, userId: string, filters: Record<string, unknown>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.sharedFilters = filters;
    session.updatedAt = new Date().toISOString();

    this.emit('filters_updated', {
      sessionId,
      userId,
      filters
    });
  }

  // Cursor Tracking
  public updateCursor(sessionId: string, userId: string, position: { x: number; y: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.cursorPosition = position;
      participant.lastActiveAt = new Date().toISOString();
    }

    this.emit('cursor_updated', {
      sessionId,
      userId,
      position
    });
  }

  // Comments System
  public addComment(sessionId: string, userId: string, userName: string, content: string, targetElement?: string, position?: { x: number; y: number }): CollaborationComment {
    const comment: CollaborationComment = {
      id: this.generateCommentId(),
      sessionId,
      userId,
      userName,
      content,
      targetElement,
      position,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const sessionComments = this.comments.get(sessionId) || [];
    sessionComments.push(comment);
    this.comments.set(sessionId, sessionComments);

    this.emit('comment_added', comment);
    return comment;
  }

  public replyToComment(sessionId: string, commentId: string, userId: string, userName: string, content: string): CollaborationComment | null {
    const sessionComments = this.comments.get(sessionId);
    if (!sessionComments) return null;

    const parentComment = sessionComments.find(c => c.id === commentId);
    if (!parentComment) return null;

    const reply: CollaborationComment = {
      id: this.generateCommentId(),
      sessionId,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
      replies: []
    };

    if (!parentComment.replies) {
      parentComment.replies = [];
    }
    parentComment.replies.push(reply);

    this.emit('comment_replied', {
      parentCommentId: commentId,
      reply
    });

    return reply;
  }

  // Event Broadcasting
  public broadcastEvent(sessionId: string, userId: string, eventType: string, data: Record<string, unknown>): void {
    const event: CollaborationEvent = {
      type: eventType as string,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      data
    };

    this.emit('event_broadcast', event);
  }

  // Getters
  public getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getUserSessions(userId: string): CollaborationSession[] {
    const sessionIds = this.userSessions.get(userId) || new Set();
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((session): session is CollaborationSession => session !== undefined && session.isActive);
  }

  public getSessionComments(sessionId: string): CollaborationComment[] {
    return this.comments.get(sessionId) || [];
  }

  public getOnlineParticipants(sessionId: string): CollaborationParticipant[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return session.participants.filter(p => p.isOnline);
  }

  // Utility Methods
  private generateSessionId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addUserToSession(userId: string, sessionId: string): void {
    const userSessions = this.userSessions.get(userId) || new Set();
    userSessions.add(sessionId);
    this.userSessions.set(userId, userSessions);
  }

  private removeUserFromSession(userId: string, sessionId: string): void {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  // Connection Management
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    this.isConnected = false;
    this.emit('disconnected');
  }

  public reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.simulateConnection();
    }, this.reconnectDelay * this.reconnectAttempts);
  }
}

export const realTimeCollaboration = new RealTimeCollaboration();
