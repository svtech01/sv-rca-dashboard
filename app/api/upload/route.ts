import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";
import { normalizeCSV, FILE_MAP } from "@/lib/normalizer";
import { normalizeUploadFilePath } from "@/services/PowerlistService";

export const runtime = "nodejs"; // ensure full file system + buffer support

export async function POST(req: Request) {
  try {
    const { fileType, upload_file_name } = await req.json();

    if (!fileType) {
      console.log("Missing file type", fileType);
      return NextResponse.json({ error: "Missing file type" }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_BUCKET || "test-data-files";

    const folderName = normalizeUploadFilePath(fileType);
      
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
      fileName: upload_file_name,
    });

  } catch (error: any) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}