import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";

const FILE_MAP = {
  "Kixie Call History": "kixie_call_history.csv",
  "Telesign (With Live)": "telesign_with_live.csv",
  "Telesign (Without Live)": "telesign_without_live.csv",
  "Powerlist Contacts": "powerlist_contacts.csv",
};

export async function GET() {
  try {
    const bucket = "data-files";

    // Get list of files from Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 10,
    });

    if (error) {
      console.error("Error listing files:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build file status mapping
    const fileStatuses = Object.entries(FILE_MAP).map(([label, filename]) => {
      const found = data?.find((f) => f.name === filename);
      return {
        name: label,
        status: found ? "Loaded" : "Missing",
        className: found ? "bg-green-600" : "bg-red-600",
        updatedAt: found?.updated_at || null,
        sizeKB: found ? (found.metadata?.size / 1024).toFixed(1) : null,
      };
    });

    return NextResponse.json({ files: fileStatuses });
  } catch (error: any) {
    console.error("Unexpected error listing files:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
