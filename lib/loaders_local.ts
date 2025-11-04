import Papa from "papaparse";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";

import { supabase } from "./supabaseServerClient";

import { filterByDateRange } from "./filter";
import { normalizePhonesLast10 } from "./normalizer";
import { loadKixie, loadTelesign, loadPowerlist } from "./loaders";

export type CSVData = Record<string, any>[];
export type FileMap = {
  kixie?: string;
  telesignWith?: string;
  telesignWithout?: string;
  powerlist?: string;
};


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

export async function loadCSVData(filter: "all" | "today" | "week" | "month" | "") {
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