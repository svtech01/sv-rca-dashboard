
import { supabase } from "@/lib/supabaseServerClient";
import Papa from "papaparse";

export interface PowerlistContact {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website: string | null;
  title: string | null;
  source_file?: string | null; // optional
  list_type: string | null;
}

export function normalizeUploadFilePath(name: string) {
  return name.toLowerCase()
      .replace(/\s+/g, "_")        // replace spaces with underscores
      .replace(/[()]/g, "")        // remove parentheses
      .replace(/[^a-z0-9_-]/g, ""); // remove any other invalid chars
}

export function normalizePowerlist(rows: any, type: string) {

  // Helper – safely convert "10/21/25" into YYYY-MM-DD
  const parseDate = (val: string) => {
    if (!val) return null;
    const [m, d, y] = val.split("/");
    if (!m || !d || !y) return null;
    return `20${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`; // 2025 format
  };

  // Helper – "1" → true, "0" → false
  const parseBool = (val: string) => val === "1";

  const contacts: PowerlistContact[] = rows.map((raw: any) => ({
    target_time_zone: raw["Target Time Zone"] || null,
    phone_number: raw["Phone Number"] || null,
    email: raw["Email"] || null,
    contact_name: raw["Contact Name"] || null,
    title: raw["Title"] || null,
    status: raw["Status"] || null,
    deferred_reason: raw["Deferred Reason"] || null,
    attempt_count: raw["Attempt Count"] ? Number(raw["Attempt Count"]) : null,
    last_attempt_date: parseDate(raw["Last Attempt Date"]),
    retry_after_date: parseDate(raw["Retry After Date"]),
    date_added: parseDate(raw["Date Added"]),
    connected: parseBool(raw["Connected"]),
    answered: parseBool(raw["Answered"]),
    last_dial_outcome: raw["Last Dial Outcome"] || null,
    owner_username: raw["ownerUserName"]?.trim() || null,
    reserved_for: raw["Reserved For"]?.trim() || null,
    ssdata: raw["ssData"] ? JSON.parse(raw["ssData"]) : {},
    list_type: type || null
  }));

  return contacts;
}

export function normalizePowerlistx(rows: any, type: string) {
  // -----------------------------------------------
  // 2. Normalize each row into DB format
  // -----------------------------------------------
  const contacts: PowerlistContact[] = rows.map((item: any) => ({
    first_name: item.first_name ?? item.firstName ?? null,
    last_name: item.last_name ?? item.lastName ?? null,
    company: item.company ?? item.company_name ?? null,
    email: item.email ?? null,
    phone: item.phone ?? item.phone_e164 ?? item.mobile ?? null,
    linkedin_url: item.linkedin_url ?? item.linkedin ?? null,
    website: item.website ?? null,
    title: item.title ?? null,
    source_file: item.source_file ?? null,
    list_type: type ?? null
  }));

  return contacts;
}

export async function addToPowerlist(csvData: string, type: string) {
  try {
    if (!csvData || typeof csvData !== "string") {
      throw new Error("addToPowerlist: Invalid CSV data");
    }

    // -----------------------------------------------
    // 1. Parse CSV into objects
    // -----------------------------------------------
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      console.error("CSV Parse Errors:", parsed.errors);
      throw new Error("Failed parsing CSV data — check input format.");
    }

    const rows: any[] = parsed.data;

    if (rows.length === 0) {
      throw new Error("No rows found in CSV.");
    }

    const contacts = normalizePowerlist(rows, type);

    console.log("🔥 Contacts:", JSON.stringify(contacts[0], null, 2));

    // Batch save records
    const response = await fetch("/api/powerlist/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: contacts })
    });

    const results = await response.json();

    if(results?.error){
      return {
        success: false,
        total: 0,
        message: results.error
      }
    }

    return {
      success: true,
      total: results?.inserted,
      message: `Successfully added ${results.inserted} contacts to powerlist.`,
    };

  } catch (error: any) {
    console.error("addToPowerlist Error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
}