import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";

import { loadCSVData } from "@/lib/loaders";
import { MetricsCalculator } from "@/lib/metrics/MetricsCalculator";
import { ValidationMerger } from "@/lib/metrics/ValidationMerger";
import { CooldownManager } from "@/lib/metrics/CooldownManager";

const CACHE_TTL_MINUTES = 30; // cache for 30 minutes

// --- Main API route ---
export async function GET(req: Request) {
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

    // Get filtering params
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "") as
    | ""
    | "all"
    | "today"
    | "week"
    | "month";

    // 2️⃣ Load CSVs and compute metrics
    console.log("♻️ Cache expired, recomputing dashboard metrics...");
    const data = await loadCSVData(filter);

    const metricCalc = new MetricsCalculator(data);
    const validationMerger = new ValidationMerger(data);
    const cooldownManager = new CooldownManager(data);

    const metrics = {
      baseline: metricCalc.calculateBaselineMetrics(),
      pilot: metricCalc.calculatePilotMetrics(),
      validation: validationMerger.calculateDataHygieneMetrics(),
      cooldown: cooldownManager.calculateReattemptPotential(),
    };

    const now = new Date().toISOString();

    // 3️⃣ Save to cache
    const _cache = await supabase.from("dashboard_cache").upsert({
      id: "dashboard_cache_latest",
      metrics,
      // data,
      last_updated: now,
    });

    if(_cache){
      console.log("✅ Dashboard metrics cached successfully");
    }

    return NextResponse.json({ ...metrics, last_updated: now, cached: false });
  } catch (err: any) {
    console.error("Dashboard metrics error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
