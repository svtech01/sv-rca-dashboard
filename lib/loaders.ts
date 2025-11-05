import Papa from "papaparse";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";

import { supabase } from "./supabaseServerClient";

import { filterByDateRange } from "./filter";
import { normalizePhonesLast10 } from "./normalizer";

export type CSVData = Record<string, any>[];
export type FileMap = {
  kixie?: string;
  telesignWith?: string;
  telesignWithout?: string;
  powerlist?: string;
};

/** Generic CSV parser */
export async function parseCSV(fileUrl: string): Promise<CSVData> {
  const res = await fetch(fileUrl);
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as CSVData),
      error: (err: any) => reject(err),
    });
  });
}

/** Load & normalize Kixie CSV */
export async function loadKixie(rows: CSVData): Promise<CSVData> {
  // const rows = await parseCSV(url);
  return rows.map((r) => ({
    datetime: ("Date" in r && "Time" in r) ? (dayjs(`${r.Date} ${r.Time}`).isValid() ? dayjs(`${r.Date} ${r.Time}`).toDate() : null)
             : ("Date" in r) ? (dayjs(r.Date).isValid() ? dayjs(r.Date).toDate() : null)
             : null,
    date: r["Date"] || r["call_date"] || r["Call Date"],
    time: r["Time"] || r["call_time"] || "",
    agentFirstName: r["Agent First Name"] || r["first_name"] || "",
    agentLastName: r["Agent Last Name"] || r["last_name"] || "",
    Disposition: r["Disposition"] || r["outcome"] || "",
    status: r["Status"] || r["call_status"] || "",
    duration: r["Duration"] || r["call_duration"] || "",
    source: r["Source"] || r["call_source"] || "",
    "To Number": r["To Number"] || r["phone"] || r["number"] || "",
    phoneNormalized: normalizePhonesLast10(r["To Number"] || r["phone"] || r["number"]),
    agentName:
      `${r["Agent First Name"] || r["first_name"] || ""} ${r["Agent Last Name"] || r["last_name"] || ""}`.trim() ||
      "Unknown",
  }));
}

/** Load & merge Telesign CSVs */
export async function loadTelesign(withRows?: CSVData, withoutRows?: CSVData): Promise<CSVData> {
  const items = [withRows, withoutRows].filter(Boolean) as CSVData[];
  const allRows: CSVData = [];

  for (const [index, item] of items.entries()) {
    // const rows = await parseCSV(url);

    const normalized = item.map((r) => ({
      phoneE164: r["phone_e164"] || r["contact_mobile_phone"] || r["phone"] || "",
      is_reachable:
        r["is_reachable"] ??
        r["reachable"] ??
        r["live"] ??
        (index == 0 ? true : false), // index 0 == with_live, index 1 == without_live
      carrier: r["carrier"] || r["phone_carrier"] || "Unknown",
      riskLevel: r["risk_level"] || r["risk"] || "Unknown",
      validationType: r["validation_type"] || r["validation"] || "Unknown",
      source_file: index == 0 ? "with_live" : "without_live", // index 0 == with_live, index 1 == without_live
      phoneNormalized: normalizePhonesLast10(
        r["phone_e164"] || r["contact_mobile_phone"] || r["phone"]
      ),
    }));
    
    allRows.push(...normalized);
  }

  return allRows;
}

/** Load Powerlist CSV */
export async function loadPowerlist(rows: CSVData): Promise<CSVData> {
  // const rows = await parseCSV(url);
  return rows.map((r) => ({
    "Phone Number": r["Phone Number"] || r["phone"] || "",
    Connected: Number(r["Connected"] || r["is_connected"] || 0),
    attemptCount: Number(r["Attempt Count"] || r["attempts"] || 0),
    "List Name": r["List Name"] || r["list_name"] || "Default List",
    phoneNormalized: normalizePhonesLast10(r["Phone Number"] || r["phone"]),
    date: r["Date Added"] || ''
  }));
}

export async function loadCSVData(filter: "all" | "today" | "week" | "month" | "") {
  // Try Supabase first, unless forced to local mode
  const USE_LOCAL = process.env.FORCE_LOCAL === "true"
  const bucket = process.env.SUPABASE_BUCKET || 'test-data-files' // for local development, use data-files for prod

  let files: any[] | null = null;
  let error: any = null;

  if (!USE_LOCAL) {
    console.log("Getting supabase storage data files...", bucket)
    const res = await supabase.storage.from(bucket).list("");
    files = res.data;
    error = res.error;
  }

  if (error || !files) {
    console.warn("⚠️ Supabase Storage unavailable or timed out, switching to local /tmp data...");
  }

  // Load + merge all CSVs per folder
  const _kixie = await mergeCsvFolder("kixie_call_history", bucket);
  const _telesign_live = await mergeCsvFolder("telesign_with_live", bucket);
  const _telesign_no_live = await mergeCsvFolder("telesign_without_live", bucket);
  const _powerlist = await mergeCsvFolder("powerlist_contacts", bucket);

  // Normalize 
  const kixie = await loadKixie(_kixie);
  const telesign = await loadTelesign(_telesign_live, _telesign_no_live);
  const powerlist = await loadPowerlist(_powerlist);

  // 2️⃣ Fallback to local /tmp if any of them failed or empty
  // TODO

  // Apply Filters
  if(filter != ""){
    console.log("📂 Applying filters", filter);
    const filteredKixie = filterByDateRange(kixie, filter, "date");
    const filteredPowerlist = filterByDateRange(powerlist, filter, "date");
    console.log("Before filtering: Kixie List", kixie.length);
    console.log("After filtering: Kixie List", filteredKixie.length);
    // console.log("Sample Kixie:", kixie.slice(0, 5).map(d => d.datetime || d.date || d["Call Date"]));

    console.log("Before filtering: Powerlist", powerlist.length);
    console.log("After filtering: Powerlist", filteredPowerlist.length);
    // console.log("Sample Powerlist:", powerlist.slice(0, 5).map(d => d.datetime || d.date || d["Call Date"]));
    return {
      telesign,
      kixie: filteredKixie,
      powerlist: filteredPowerlist
    }
  }

  return { kixie, telesign, powerlist };
}

/**
 * Fetch all CSV files from a folder in Supabase and merge their contents
 * @param folderName - e.g. "kixie_call_history" or "powerlist"
 * @param bucket - e.g. "test-data-files"
 * @returns Merged array of parsed CSV rows
 */
export async function mergeCsvFolder(folderName: string, bucket = "test-data-files") {
  // 1️⃣ List all files in the folder
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(folderName, { limit: 1000 }); // adjust limit if needed

  if (listError) throw new Error(`Failed to list files: ${listError.message}`);
  if (!files || files.length === 0) return [];

  let mergedData: any[] = [];

  // 2️⃣ Loop through each file
  for (const file of files) {
    if (!file.name.endsWith(".csv")) continue; // skip non-CSV files

    const filePath = `${folderName}/${file.name}`;

    // 3️⃣ Download CSV
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.warn(`Skipping ${filePath} — ${downloadError.message}`);
      continue;
    }

    // 4️⃣ Parse CSV text
    const text = await fileData.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.data && Array.isArray(parsed.data)) {
      mergedData = mergedData.concat(parsed.data);
    }
  }

  // 5️⃣ Return all merged rows
  return mergedData;
}