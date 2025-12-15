import { NextResponse } from "next/server";

import { getDataHygieneMetrics } from "@/services/SupabaseMetricsService";

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

    const hygiene = await getDataHygieneMetrics();

    return NextResponse.json(hygiene, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}