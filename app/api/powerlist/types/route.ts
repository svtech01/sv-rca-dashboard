// GET → fetch all types
// POST → add new type
import { supabase } from "@/lib/supabaseServerClient";

export async function GET() {
  const { data, error } = await supabase.from("powerlist_types").select("*").order("id");
  if (error) throw error;
  return new Response(JSON.stringify(data));
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const { data, error } = await supabase.from("powerlist_types").insert({ name }).select();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data[0]));
}