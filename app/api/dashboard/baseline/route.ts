import { NextResponse } from "next/server";

import { getBaselineMetrics, getKixieCallTimespan } from "@/services/SupabaseMetricsService";

export async function GET(req: Request) {

  try {
    // Get filtering params
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") || "") as
      | ""
      | "all"
      | "today"
      | "week"
      | "month";

    const timespan = await getKixieCallTimespan(filter);
    const baseline = await getBaselineMetrics(filter);

    return NextResponse.json({ baseline, timespan }, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}