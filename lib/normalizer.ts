import Papa from "papaparse";

export const runtime = "nodejs"; // ensure full file system + buffer support

// Default file names set to supabase storage bucket
export const FILE_MAP: Record<string, string> = {
  "Kixie Call History": "kixie_call_history.csv",
  "Telesign (With Live)": "telesign_with_live.csv",
  "Telesign (Without Live)": "telesign_without_live.csv",
  "Powerlist Contacts": "powerlist_contacts.csv",
};

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

export interface NormalizeResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  error?: string;
}

/** Normalize phone numbers → last 10 digits */
export function normalizePhonesLast10(phone: string | number | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * ✅ Normalize and validate CSV file by type using PapaParse
 * @param text CSV file content as string
 * @param fileType file type identifier (kixie, telesign_with, telesign_without, powerlist)
 * @returns NormalizeResult
 */
export function normalizeCSV(text: string, fileType: string): NormalizeResult {
  // Parse CSV using PapaParse

  console.log("File normalizer started...");

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      error: `Failed to parse CSV: ${parsed.errors[0].message}`,
    };
  }

  const df = parsed.data as Record<string, any>[];

  if (df.length === 0) {
    return { success: false, error: "CSV file is empty." };
  }

  const columns = Object.keys(df[0]);
  const required = requiredColumns[fileType] || [];
  const mappings = columnMappings[fileType] || {};
  const missingColumns: string[] = [];

  // Validate required columns
  for (const requiredCol of required) {
    const possibleNames = mappings[requiredCol] || [requiredCol];
    const found = possibleNames.some((name) =>
      columns.includes(name.trim())
    );
    if (!found) missingColumns.push(requiredCol);
  }

  if (missingColumns.length > 0) {
    return {
      success: false,
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    };
  }

  // ✅ Normalize column names to consistent keys
  const normalized = df.map((row) => {
    const newRow: Record<string, any> = {};
    for (const [target, aliases] of Object.entries(mappings)) {
      const matchedKey = Object.keys(row).find((key) =>
        aliases.includes(key.trim())
      );
      if (matchedKey) newRow[target] = row[matchedKey];
    }

    // Include untouched fields
    for (const key in row) {
      if (!(key in newRow)) newRow[key] = row[key];
    }

    return newRow;
  });

  return { success: true, data: normalized, columns };
}

