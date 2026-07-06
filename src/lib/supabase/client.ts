import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';
  
  if (process.env.NODE_ENV === 'development' && url === 'https://dummy.supabase.co') {
    throw new Error("Missing Supabase configuration! Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
  }

  return createBrowserClient(url, key);
}
