import { useEffect, useCallback } from 'react';

export interface UserEvent {
  id: string;
  type: 'page_view' | 'search' | 'click' | 'scroll' | 'focus' | 'blur' | 'form_submit' | 'integration_connect' | 'integration_disconnect' | 'error' | 'performance';
  timestamp: number;
  sessionId: string;
  userId?: string;
  properties: Record<string, unknown>;
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    referrer?: string;
    pageTitle: string;
  };
}

export interface UserSession {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: UserEvent[];
  userAgent: string;
  referrer?: string;
  userId?: string;
}

export interface UserProfile {
  userId: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: boolean;
    accessibility: {
      highContrast: boolean;
      largeText: boolean;
      reducedMotion: boolean;
    };
  };
  behavior: {
    searchPatterns: string[];
    frequentlyUsedIntegrations: string[];
    preferredSearchFilters: string[];
    averageSessionDuration: number;
    totalSearches: number;
    lastActive: number;
  };
  recommendations: {
    suggestedIntegrations: string[];
    searchSuggestions: string[];
    personalizedFilters: string[];
  };
}

class UserBehaviorTracker {
  private session: UserSession | null = null;
  private eventQueue: UserEvent[] = [];
  private isTracking = false;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.startTracking();
  }

  private initializeSession(): void {
    const sessionId = this.generateSessionId();
    this.session = {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      userId: this.getUserId()
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    // In a real application, this would come from your authentication system
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userId') || undefined;
    }
    return undefined;
  }

  private startTracking(): void {
    if (this.isTracking) return;
    
    // Only start tracking on the client side
    if (typeof window === 'undefined') return;
    
    this.isTracking = true;
    this.trackPageView();
    this.setupEventListeners();
    this.startFlushTimer();
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.trackEvent('page_view', {
          visibility: 'visible',
          timestamp: Date.now()
        });
      } else {
        this.trackEvent('page_view', {
          visibility: 'hidden',
          timestamp: Date.now()
        });
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.trackEvent('scroll', {
          depth: scrollDepth,
          maxDepth: maxScrollDepth
        });
      }
    });

    // Track form interactions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        formId: form.id,
        formClass: form.className,
        formAction: form.action
      });
    });

    // Track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (this.isInteractiveElement(target)) {
        this.trackEvent('click', {
          element: target.tagName.toLowerCase(),
          elementId: target.id,
          elementClass: target.className,
          text: target.textContent?.slice(0, 100),
          href: (target as HTMLAnchorElement).href
        });
      }
    });

    // Track focus events
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      this.trackEvent('focus', {
        element: target.tagName.toLowerCase(),
        elementId: target.id,
        elementClass: target.className
      });
    });

    // Track performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.trackEvent('performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        });
      }, 0);
    });
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
    
    return (
      interactiveTags.includes(element.tagName.toLowerCase()) ||
      interactiveRoles.includes(element.getAttribute('role') || '') ||
      element.hasAttribute('onclick') ||
      element.hasAttribute('tabindex')
    );
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
  }

  public trackEvent(type: UserEvent['type'], properties: Record<string, unknown> = {}): void {
    if (!this.session) return;

    const event: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      sessionId: this.session.id,
      userId: this.session.userId,
      properties,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer || undefined,
        pageTitle: document.title
      }
    };

    this.session.events.push(event);
    this.session.lastActivity = Date.now();
    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  public trackSearch(query: string, results: number, filters?: Record<string, unknown>): void {
    this.trackEvent('search', {
      query,
      resultsCount: results,
      filters,
      queryLength: query.length,
      hasFilters: !!filters && Object.keys(filters).length > 0
    });
  }

  public trackIntegrationAction(action: 'connect' | 'disconnect', integration: string, success: boolean): void {
    this.trackEvent('integration_connect', {
      action,
      integration,
      success,
      timestamp: Date.now()
    });
  }

  public trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      context
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In a real application, this would send to your analytics service
      await this.sendEventsToServer(eventsToFlush);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async sendEventsToServer(events: UserEvent[]): Promise<void> {
    // Simulate API call
    console.log('Sending analytics events:', events);
    
    // In a real application, you would send to your analytics service:
    // await fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events })
    // });
  }

  public getSession(): UserSession | null {
    return this.session;
  }

  public getEventQueue(): UserEvent[] {
    return [...this.eventQueue];
  }

  public stopTracking(): void {
    this.isTracking = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushEvents();
  }

  public updateUserId(userId: string): void {
    if (this.session) {
      this.session.userId = userId;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
  }

  public trackPageView(): void {
    if (!this.session) return;

    this.session.pageViews++;
    this.trackEvent('page_view', {
      page: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    });
  }
}

// Singleton instance
export const userBehaviorTracker = new UserBehaviorTracker();

// React hooks for easy integration
export const useAnalytics = () => {
  const trackEvent = useCallback((type: UserEvent['type'], properties?: Record<string, unknown>) => {
    userBehaviorTracker.trackEvent(type, properties);
  }, []);

  const trackSearch = useCallback((query: string, results: number, filters?: Record<string, unknown>) => {
    userBehaviorTracker.trackSearch(query, results, filters);
  }, []);

  const trackIntegrationAction = useCallback((action: 'connect' | 'disconnect', integration: string, success: boolean) => {
    userBehaviorTracker.trackIntegrationAction(action, integration, success);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    userBehaviorTracker.trackError(error, context);
  }, []);

  return {
    trackEvent,
    trackSearch,
    trackIntegrationAction,
    trackError
  };
};

export const usePageTracking = (pageName: string) => {
  useEffect(() => {
    userBehaviorTracker.trackPageView();
  }, [pageName]);
};

export default userBehaviorTracker;
