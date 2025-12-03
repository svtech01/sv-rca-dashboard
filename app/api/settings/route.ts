// GET → fetch all types
// POST → add new type
import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabase.from("app_config_settings").select("*").eq("id", 1).single();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data));
}

export async function POST(req: Request) {
  const payload = await req.json();
  console.log("Update Settings:", payload);
  const { data, error } = await supabase.from("app_config_settings").update(payload).eq("id", 1).select();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data[0]));
}