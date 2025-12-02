import { createClient } from "@supabase/supabase-js";

// Create Supabase client for server-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // requires service role for upload
);

export const telesignSupabase = createClient(
  process.env.TELESIGN_NEXT_PUBLIC_SUPABASE_URL!,
  process.env.TELESIGN_SUPABASE_SERVICE_ROLE_KEY! // requires service role for upload
);