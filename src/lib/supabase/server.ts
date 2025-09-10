/**
 * Supabase Client for Server
 * Creates a Supabase client for server-side operations
 */

import { createServerClient } from '@supabase/ssr';
import { NextApiRequest, NextApiResponse } from 'next';

export function createClient(req?: NextApiRequest, res?: NextApiResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (req?.headers.cookie) {
            return req.headers.cookie.split(';').map(cookie => {
              const [name, value] = cookie.trim().split('=');
              return { name, value };
            });
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (res) {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${value}`;
              if (options?.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
              if (options?.path) cookieString += `; Path=${options.path}`;
              if (options?.domain) cookieString += `; Domain=${options.domain}`;
              if (options?.secure) cookieString += `; Secure`;
              if (options?.httpOnly) cookieString += `; HttpOnly`;
              if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`;
              res.setHeader('Set-Cookie', cookieString);
            });
          }
        },
      },
    }
  );
}

// For services that don't have access to request/response objects
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for service clients
        },
      },
    }
  );
}
