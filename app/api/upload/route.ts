import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";
import { normalizeCSV, FILE_MAP } from "@/lib/normalizer";

export const runtime = "nodejs"; // ensure full file system + buffer support

export async function POST(req: Request) {
  try {
    const { fileType, upload_file_name } = await req.json();

    if (!fileType) {
      return NextResponse.json({ error: "Missing file type" }, { status: 400 });
    }

    const fileName = FILE_MAP[fileType];
    if (!fileName) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_BUCKET || "test-data-files";

    // ✅ Folder path — category-based
    const folderName = fileType
      .toLowerCase()
      .replace(/\s+/g, "_")        // replace spaces with underscores
      .replace(/[()]/g, "")        // remove parentheses
      .replace(/[^a-z0-9_-]/g, ""); // remove any other invalid chars
      
    const filePath = `${folderName}/${upload_file_name}`;

    // ✅ Create a signed URL to upload directly to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath, {upsert: true}); // 2 hrs validity

    if (error) {
      console.error("Supabase signed URL error:", error);
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      bucket,
      fileName,
    });

  } catch (error: any) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}