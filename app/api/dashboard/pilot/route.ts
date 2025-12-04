import { NextResponse } from "next/server";

import { getPilotMetrics } from "@/services/SupabaseMetricsService";
import { getPowerlistConfigs } from "@/services/PowerlistService";

export async function GET(req: Request) {
  
  // Get filtering params
  const { searchParams } = new URL(req.url);
  const filterByTime = (searchParams.get("filterByTime") || "") as
    | ""
    | "all"
    | "today"
    | "week"
    | "month";
  
  const filterByList = searchParams.get("filterByList") || "";

  const pilot = await getPilotMetrics(filterByTime, filterByList);
  // Get Powerlist Types and Pilot List name
  const powerlistConfigs = await getPowerlistConfigs();

  return NextResponse.json({
    pilot: pilot,
    powerlistConfig: powerlistConfigs
  }, { status: 200 });
}