import Papa from "papaparse";
import fs from "fs";
import path from "path";
import { supabase } from "./supabaseServerClient";

export type CSVData = Record<string, any>[];
export type FileMap = {
  kixie?: string;
  telesignWith?: string;
  telesignWithout?: string;
  powerlist?: string;
};

/** Normalize phone numbers → last 10 digits */
export function normalizePhonesLast10(phone: string | number | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

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
export async function loadKixie(url: string): Promise<CSVData> {
  const rows = await parseCSV(url);
  return rows.map((r) => ({
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
export async function loadTelesign(withUrl?: string, withoutUrl?: string): Promise<CSVData> {
  const urls = [withUrl, withoutUrl].filter(Boolean) as string[];
  const allRows: CSVData = [];

  for (const url of urls) {
    const rows = await parseCSV(url);
    const normalized = rows.map((r) => ({
      phoneE164: r["phone_e164"] || r["contact_mobile_phone"] || r["phone"] || "",
      is_reachable:
        r["is_reachable"] ??
        r["reachable"] ??
        r["live"] ??
        (url.toLowerCase().includes("with") ? true : false),
      carrier: r["carrier"] || r["phone_carrier"] || "Unknown",
      riskLevel: r["risk_level"] || r["risk"] || "Unknown",
      validationType: r["validation_type"] || r["validation"] || "Unknown",
      source_file: url.toLowerCase().includes("with") ? "with_live" : "without_live",
      phoneNormalized: normalizePhonesLast10(
        r["phone_e164"] || r["contact_mobile_phone"] || r["phone"]
      ),
    }));
    allRows.push(...normalized);
  }

  return allRows;
}

/** Load Powerlist CSV */
export async function loadPowerlist(url: string): Promise<CSVData> {
  const rows = await parseCSV(url);
  return rows.map((r) => ({
    "Phone Number": r["Phone Number"] || r["phone"] || "",
    Connected: Number(r["Connected"] || r["is_connected"] || 0),
    attemptCount: Number(r["Attempt Count"] || r["attempts"] || 0),
    "List Name": r["List Name"] || r["list_name"] || "Default List",
    phoneNormalized: normalizePhonesLast10(r["Phone Number"] || r["phone"]),
  }));
}

type CSVRow = Record<string, any>; // generic row type

function loadKixieFromText(csvText: string): CSVRow[] {
  const { data } = Papa.parse<CSVRow>(csvText, { header: true, skipEmptyLines: true });
  return data;
}

function loadTelesignFromText(withLive: string, withoutLive: string): CSVRow[] {
  const merged: CSVRow[] = [];
  if (withLive) {
    const { data } = Papa.parse<CSVRow>(withLive, { header: true, skipEmptyLines: true });
    merged.push(...data.map((d: any) => ({ ...d, source: "with_live" })));
  }
  if (withoutLive) {
    const { data } = Papa.parse<CSVRow>(withoutLive, { header: true, skipEmptyLines: true });
    merged.push(...data.map((d: any) => ({ ...d, source: "without_live" })));
  }
  return merged;
}

function loadPowerlistFromText(csvText: string): CSVRow[] {
  const { data } = Papa.parse<CSVRow>(csvText, { header: true, skipEmptyLines: true });
  return data;
}

export async function loadCSVData() {
  // Try Supabase first, unless forced to local mode
  const USE_LOCAL = process.env.FORCE_LOCAL === "true"

  let files: any[] | null = null;
  let error: any = null;

  if (!USE_LOCAL) {
    console.log("Getting supabase storage data files...")
    const res = await supabase.storage.from("data-files").list("");
    files = res.data;
    error = res.error;
  }

  if (error || !files) {
    console.warn("⚠️ Supabase Storage unavailable or timed out, switching to local /tmp data...");
  }

  const findUrl = (keyword: string) => {
    if (!files) return null;
    const file = files.find((f) => f.name.toLowerCase().includes(keyword.toLowerCase()));
    if (!file) return null;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/data-files/${file.name}`;
  };

  const urls = {
    kixie: !USE_LOCAL ? findUrl("kixie") : null,
    telesignWith: !USE_LOCAL ? findUrl("with_live") : null,
    telesignWithout: !USE_LOCAL ? findUrl("without_live") : null,
    powerlist: !USE_LOCAL ? findUrl("powerlist") : null,
  };

  // Helper: load CSV text from /tmp
  const loadLocalCSV = (keyword: string) => {
    try {
      const files = fs.readdirSync("/tmp");
      const match = files.find((f) => f.toLowerCase().includes(keyword.toLowerCase()));
      if (!match) return null;
      const fullPath = path.join("/tmp", match);
      return fs.readFileSync(fullPath, "utf8");
    } catch (err: any) {
      console.error(`❌ Local CSV read failed (${keyword}):`, err.message);
      return null;
    }
  };

  // 1️⃣ Try to load from Supabase
  let [kixie, telesign, powerlist] = await Promise.all([
    urls.kixie ? loadKixie(urls.kixie) : [],
    loadTelesign(urls.telesignWith ?? undefined, urls.telesignWithout ?? undefined),
    urls.powerlist ? loadPowerlist(urls.powerlist) : [],
  ]);

  // 2️⃣ Fallback to local /tmp if any of them failed or empty
  if (!kixie?.length) {
    const kixieLocal = loadLocalCSV("kixie");
    if (kixieLocal){
      console.log("📂 Parsing local Kixie CSV...");
      kixie = loadKixieFromText(kixieLocal);
    }
  }

  if (!telesign?.length) {
    const withLocal = loadLocalCSV("with_live");
    const withoutLocal = loadLocalCSV("without_live");
    if (withLocal && withoutLocal){
      console.log("📂 Parsing local Telesign CSVs...");
      telesign = loadTelesignFromText(withLocal ?? undefined, withoutLocal ?? undefined);
    }      
  }

  if (!powerlist?.length) {
    const powerlistLocal = loadLocalCSV("powerlist");
    if (powerlistLocal){
      console.log("📂 Parsing local Powerlist CSV...");
      powerlist = loadPowerlistFromText(powerlistLocal);
    }
  }

  return { kixie, telesign, powerlist };
}