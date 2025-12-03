import { supabase } from "@/lib/supabaseServerClient";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/powerlist/types/:id
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;

  const { error } = await supabase
    .from("powerlist_types")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT /api/powerlist/types/:id
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const body = await req.json();
  const { name } = body;

  const { data, error } = await supabase
    .from("powerlist_types")
    .update({ name })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0]);
}
