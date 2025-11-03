import { NextResponse } from "next/server";
import * as csv from "csv-parse/sync";
import { supabase } from "@/lib/supabaseServerClient";

const FILE_MAP: Record<string, string> = {
  "Kixie Call History": "kixie_call_history.csv",
  "Telesign (With Live)": "telesign_with_live.csv",
  "Telesign (Without Live)": "telesign_without_live.csv",
  "Powerlist Contacts": "powerlist_contacts.csv",
};

export const runtime = "nodejs"; // ensure full file system + buffer support

// ✅ Required columns per file type
const requiredColumns: Record<string, string[]> = {
  kixie: ["Disposition", "To Number"],
  telesign_with: ["phone_e164"],
  telesign_without: ["phone_e164"],
  powerlist: ["Phone Number", "Connected", "Attempt Count"],
};

// ✅ Flexible mappings for column name variations
const columnMappings: Record<string, Record<string, string[]>> = {
  kixie: {
    Disposition: [
      "Disposition",
      "disposition",
      "Outcome",
      "outcome",
      "Call Outcome",
      "call_outcome",
    ],
    "To Number": [
      "To Number",
      "to_number",
      "To",
      "to",
      "Phone",
      "phone",
      "Phone Number",
      "phone_number",
      "Number",
      "number",
    ],
  },
  telesign_with: {
    phone_e164: [
      "phone_e164",
      "contact_mobile_phone",
      "phone",
      "mobile_phone",
      "Contact Mobile Phone",
    ],
  },
  telesign_without: {
    phone_e164: [
      "phone_e164",
      "contact_mobile_phone",
      "phone",
      "mobile_phone",
      "Contact Mobile Phone",
    ],
  },
  powerlist: {
    "Phone Number": [
      "Phone Number",
      "phone_number",
      "Phone",
      "phone",
      "PhoneNumber",
    ],
    Connected: ["Connected", "connected", "Is Connected", "is_connected"],
    "Attempt Count": [
      "Attempt Count",
      "attempt_count",
      "Attempts",
      "attempts",
      "Attempts Count",
    ],
    "List Name": [
      "List Name",
      "list_name",
      "List",
      "list",
      "ListName",
      "Powerlist Name",
      "powerlist_name",
    ],
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("file_type") as string)?.toLowerCase();

    if (!file || !fileType) {
      return NextResponse.json(
        { error: "Missing file or file type." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = buffer.toString("utf-8");

    // ✅ Parse CSV
    let df: any[] = [];
    try {
      df = csv.parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {

      return NextResponse.json(
        { error: "Failed to parse CSV. Please check your file format." },
        { status: 400 }
      );
    }

    if (df.length === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty. Please upload a file with data." },
        { status: 400 }
      );
    }

    const columns = Object.keys(df[0]);
    const required = requiredColumns[fileType] || [];
    const mappings = columnMappings[fileType] || {};
    const missingColumns: string[] = [];

    // Check flexible column matches
    for (const requiredCol of required) {
      const possibleNames = mappings[requiredCol] || [requiredCol];
      const found = possibleNames.some((name) =>
        columns.includes(name.trim())
      );
      if (!found) {
        missingColumns.push(requiredCol);
      }
    }

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid CSV format. Missing required columns: ${missingColumns.join(
            ", "
          )}. Available columns: ${columns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ✅ Save to Supabase Storage
    const bucket = process.env.SUPABASE_BUCKET || "test-data-files";
    const filePath = fileType;
    const _fileType = (formData.get("file_type") as string);

    const fileName = FILE_MAP[_fileType];
    if (!fileName) {
      console.error("❌ Invalid file type:", _fileType);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    return NextResponse.json({
      message: "File uploaded and validated successfully.",
      fileType,
      filePath,
      columns,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
