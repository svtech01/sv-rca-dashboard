import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache file (works for Vercel / local)
const CACHE_FILE = process.env.VERCEL ? "/tmp/cache.json" : "./data/cache.json";

// Example: Simulated metric calculation
async function computeMetrics() {
  // 🧮 Replace this with your actual data-loading and calculation logic
  const data = {
    baseline: {
      connect_rate: 0.0,
      answer_event: 0.0,
      avg_attempts_lost_race: 0,
      cooldown_day: 0,
    },
    pilot: {
      sample_size: 0,
      target_connect_rate: 0,
      success_criteria: 0,
      test_duration: 0,
    },
    hygiene: {
      total_validated: 0,
      reachable: 0,
      invalid: 0,
      validated_dialed: 0,
    },
    cooldown: {
      cooldown_contacts: 0,
      reattempt_potential: 0,
      target_kpi: 0,
    },
  };

  // Pretend we did math here based on CSVs
  return {
    ...data,
    last_updated: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    // ✅ Try loading cached data first
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      const cacheTime = new Date(cacheData.timestamp);
      const now = new Date();

      // Cache valid for 1 hour
      if (now.getTime() - cacheTime.getTime() < 3600 * 1000) {
        return NextResponse.json({
          source: "cache",
          ...cacheData.data,
        });
      }
    }

    // 🧮 Recompute data if cache expired or missing
    const computed = await computeMetrics();

    // ✅ Save to cache
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(
        CACHE_FILE,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          data: computed,
        })
      );
    } catch (e) {
      console.warn("⚠️ Could not save cache:", e);
    }

    return NextResponse.json({
      source: "fresh",
      ...computed,
    });
  } catch (error) {
    console.error("Error in dashboard-data API:", error);
    return NextResponse.json(
      { error: "Failed to compute dashboard data" },
      { status: 500 }
    );
  }
}
