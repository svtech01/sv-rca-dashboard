import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts = body.contacts;
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      
      const batch = contacts.slice(i, i + BATCH_SIZE);

      const batchStartTime = new Date().toISOString();

      const { data, error } = await supabase
        .from("powerlist_contacts")
        .upsert(batch, { onConflict: "phone_number" }) // unique key column
        .select(); // <-- returns inserted/updated rows

      if (error) {
        console.error("Error inserting batch:", error);
        return NextResponse.json({ error: "Failed inserting contacts to powerlist table" }, { status: 500 });
      }

      // Only keep newly inserted rows
      const newlyInserted = data.filter(
        row => new Date(row.created_at) >= new Date(batchStartTime)
      );

      inserted += newlyInserted.length;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
