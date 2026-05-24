import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      return null as any;
    }
    throw new Error(
      'Your project\'s URL and API key are required to create a Supabase client!\n\n' +
      'Check your Supabase project\'s API settings to find these values\n' +
      'https://supabase.com/dashboard/project/_/settings/api'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};
