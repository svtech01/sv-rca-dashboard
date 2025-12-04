import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServerClient";

import { loadKixie, loadTelesign, loadPowerlist, loadCSVData } from "@/lib/loaders";
import { MetricsCalculator } from "@/lib/metrics/MetricsCalculator";
import { getWeeklyTrends } from "@/services/SupabaseMetricsService";

const CACHE_TTL_MINUTES = 30; // cache for 30 minutes

// --- Main API route ---
export async function GET(req: Request) {
  try {
    
    const now = new Date();
    const trends = await getWeeklyTrends();

    return NextResponse.json({ trends, last_updated: now, cached: false });

  } catch (err: any) {
    console.error("Dashboard metrics error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
