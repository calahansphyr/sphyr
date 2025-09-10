/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '../lib/supabase/client';
import { productAnalytics } from '../lib/analytics';
import { logger } from '../lib/logger';
import type { User } from '@supabase/supabase-js';
// import type { AuthTokens } from '../components/auth/utils/auth-helpers';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const isAuthenticated = !!user;

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Set up auth state listener
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  /**
   * Initialize authentication on app start
   */
  async function initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      logger.error('Auth initialization failed', error, {
        operation: 'auth_initialization',
        component: 'AuthContext'
      });
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Login user
   */
  async function login(email: string, password: string): Promise<void> {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      logger.error('User login failed', error, {
        operation: 'user_login',
        component: 'AuthContext',
        email: email // Email is safe to log as it's user input
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Register new user
   */
  async function register(email: string, password: string, name: string): Promise<void> {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(data.user);
        
        // Track user signup event
        try {
          await productAnalytics.trackUserSignup(
            data.user.id,
            data.user.user_metadata?.organization_id || 'unknown',
            {
              email: data.user.email || 'unknown',
              name: name,
              signup_method: 'email',
            }
          );
        } catch (analyticsError) {
          logger.warn('Failed to track user signup analytics', {
            operation: 'analytics_tracking',
            component: 'AuthContext',
            event: 'user_signup',
            error: analyticsError instanceof Error ? analyticsError.message : 'Unknown analytics error'
          });
        }
      }
    } catch (error) {
      logger.error('User registration failed', error, {
        operation: 'user_registration',
        component: 'AuthContext',
        email: email // Email is safe to log as it's user input
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Logout user
   */
  async function logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = '/auth/login';
    } catch (error) {
      logger.error('User logout failed', error, {
        operation: 'user_logout',
        component: 'AuthContext',
        userId: user?.id
      });
    }
  }

  /**
   * Refresh authentication token
   */
  async function refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        logger.error('Token refresh failed', error, {
          operation: 'token_refresh',
          component: 'AuthContext',
          userId: user?.id
        });
        await logout();
        return false;
      }

      if (data.session?.user) {
        setUser(data.session.user);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Token refresh failed with exception', error, {
        operation: 'token_refresh',
        component: 'AuthContext',
        userId: user?.id
      });
      await logout();
      return false;
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
