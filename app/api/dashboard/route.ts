import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as csv from "csv-parse/sync";
import { supabase } from "@/lib/supabaseServerClient";

const CACHE_TTL_MINUTES = 0; // cache for 30 minutes

// --- Metrics helper functions ---
function calculateBaselineMetrics(kixieData: any[]) {
  if (!kixieData.length) return {};
  const totalCalls = kixieData.length;
  const connectedCalls = kixieData.filter(
    (row) =>
      String(row.Disposition || row.disposition || "").toLowerCase() ===
      "connected"
  ).length;
  const connectRate = totalCalls ? (connectedCalls / totalCalls) * 100 : 0;

  return {
    connectRate: connectRate.toFixed(1) + "%",
    totalCalls,
    connectedCalls,
  };
}

function calculatePilotMetrics(powerlistData: any[]) {
  if (!powerlistData.length) return {};
  const uniqueContacts = new Set(
    powerlistData.map((r) => r["Phone Number"] || r.phone_number)
  ).size;
  const targetConnectRate = 30;
  const uplift = 0;
  return { uniqueContacts, targetConnectRate, uplift };
}

function calculateValidationMetrics(telesignData: any[]) {
  if (!telesignData.length) return {};
  const total = telesignData.length;
  const reachable = telesignData.filter((r) => r.status === "reachable").length;
  const invalid = telesignData.filter((r) => r.status === "invalid").length;
  return {
    total,
    reachable,
    invalid,
    reachablePct: ((reachable / total) * 100).toFixed(1) + "%",
    invalidPct: ((invalid / total) * 100).toFixed(1) + "%",
  };
}

function calculateCooldownMetrics(powerlistData: any[]) {
  if (!powerlistData.length) return {};
  const cooldownContacts = powerlistData.filter(
    (r) => Number(r["Attempt Count"] || 0) >= 10
  ).length;
  const reattemptPotential = Math.round(cooldownContacts * 0.2);
  return { cooldownContacts, reattemptPotential };
}

// --- Load and parse CSVs ---
async function loadCSVData() {
  const bucket = "data-files";
  const sources = [
    { key: "kixie", path: "kixie/kixie.csv" },
    { key: "powerlist", path: "powerlist/powerlist.csv" },
    { key: "telesign", path: "telesign_with/telesign_with.csv" },
  ];

  const data: Record<string, any[]> = {};

  for (const src of sources) {
    const { data: fileData, error } = await supabase.storage
      .from(bucket)
      .download(src.path);

    if (error) {
      console.warn(`Missing or unreadable file: ${src.path}`);
      data[src.key] = [];
      continue;
    }

    const text = await fileData.text();
    const parsed = csv.parse(text, { columns: true, skip_empty_lines: true });
    data[src.key] = parsed;
  }

  return data;
}

// --- Main API route ---
export async function GET() {
  try {
    // 1️⃣ Try to load cached metrics
    const { data: cachedRows } = await supabase
      .from("dashboard_cache")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedRows && cachedRows.last_updated) {
      const ageMs = Date.now() - new Date(cachedRows.last_updated).getTime();
      const ageMinutes = ageMs / 1000 / 60;

      if (ageMinutes < CACHE_TTL_MINUTES) {
        console.log(`✅ Returning cached dashboard metrics (${ageMinutes.toFixed(1)} min old)`);
        return NextResponse.json({
          ...cachedRows.metrics,
          last_updated: cachedRows.last_updated,
          cached: true,
        });
      }
    }

    // 2️⃣ Load CSVs and compute metrics
    console.log("♻️ Cache expired, recomputing dashboard metrics...");
    const data = await loadCSVData();

    const metrics = {
      baseline: calculateBaselineMetrics(data.kixie),
      pilot: calculatePilotMetrics(data.powerlist),
      validation: calculateValidationMetrics(data.telesign),
      cooldown: calculateCooldownMetrics(data.powerlist),
    };

    const now = new Date().toISOString();

    // 3️⃣ Save to cache
    await supabase.from("dashboard_cache").insert({
      metrics,
      last_updated: now,
    });

    console.log("✅ Dashboard metrics cached successfully");

    return NextResponse.json({ ...metrics, last_updated: now, cached: false });
  } catch (err: any) {
    console.error("Dashboard metrics error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
