import { NextResponse } from "next/server";

import { getReattemptPotential } from "@/services/SupabaseMetricsService";

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

    const cooldown = await getReattemptPotential(filter);
    // console.log(cooldown);
    return NextResponse.json(cooldown, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}