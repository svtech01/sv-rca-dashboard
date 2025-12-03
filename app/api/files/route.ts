import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";
import { normalizeUploadFilePath } from "@/services/PowerlistService";

const FOLDERS = {
  "Kixie Call History": "kixie_call_history",
  "Telesign (With Live)": "telesign_with_live",
  "Telesign (Without Live)": "telesign_without_live",
  "Powerlist Contacts": "powerlist_contacts",
};

export async function GET() {
  try {
    // 1. Get powerlist types from DB
    const { data: types, error: typesError } = await supabase
      .from("powerlist_types")
      .select("*");

    if (typesError) {
      return NextResponse.json({ error: typesError.message }, { status: 500 });
    }

    const results = [];

    // 2. Loop through each type and read its storage folder
    for (const type of types) {

      const folderName = normalizeUploadFilePath(type.name);

      const { data: files, error: filesError } = await supabase.storage
        .from("live-data-files")
        .list(folderName, { limit: 100 });

      if (filesError) {
        results.push({
          ...type,
          files: [],
          error: filesError.message,
        });
        continue;
      }

      // 3. Generate public URLs for each file
      const filesWithUrls = files.map((file) => {
        const { data: publicUrl } = supabase.storage
          .from("live-data-files")
          .getPublicUrl(`${type.name}/${file.name}`);

        return {
          name: file.name,
          updated_at: file.updated_at,
          url: publicUrl.publicUrl,
        };
      });

      results.push({
        ...type,
        files: filesWithUrls,
      });
    }

    console.log("/api/files", results);

    // 4. Return combined results
    return NextResponse.json({ types: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GETX() {
  try {
    const bucket = process.env.SUPABASE_BUCKET || "test-data-files";

    const folderStatuses = await Promise.all(
      Object.entries(FOLDERS).map(async ([label, folder]) => {
        const { data: files, error } = await supabase.storage.from(bucket).list(folder);

        if (error) {
          console.error(`Error listing folder '${folder}':`, error.message);
          return {
            name: label,
            status: "Error",
            className: "bg-yellow-600",
            updatedAt: null,
            fileCount: 0,
          };
        }

        if (!files || files.length === 0) {
          return {
            name: label,
            status: "Missing",
            className: "bg-red-600",
            updatedAt: null,
            fileCount: 0,
          };
        }

        // Find the most recently updated file
        const latestFile = files.reduce((a, b) =>
          (a.updated_at || "") > (b.updated_at || "") ? a : b
        );

        return {
          name: label,
          status: "Loaded",
          className: "bg-green-600",
          updatedAt: latestFile.updated_at || null,
          fileCount: files.length,
        };
      })
    );

    return NextResponse.json({ files: folderStatuses });
  } catch (error: any) {
    console.error("Unexpected error listing folders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
