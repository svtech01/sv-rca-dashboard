import { supabase } from "@/lib/supabaseServerClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (req.headers.get("x-kixie-webhook-secret") !== process.env.KIXIE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = body?.data;
    if (!data) {
      return NextResponse.json({ error: "Missing data object" }, { status: 400 });
    }

    // Parse timestamps
    const calldate = data.calldate ? new Date(data.calldate) : null;

    const record = {
      // normalized datetime fields
      calldate: calldate ? calldate.toISOString() : null,
      date: calldate ? calldate.toISOString().split("T")[0] : null,
      time: calldate ? calldate.toISOString().split("T")[1].split(".")[0] : null,

      // agent info
      fname: data.fname || null,
      lname: data.lname || null,
      agent_name: `${data.fname ?? ""} ${data.lname ?? ""}`.trim() || null,

      // call information
      disposition: data.disposition || null,
      status: data.callstatus || null,
      duration: data.duration ? Number(data.duration) : null,
      source: data.calltype || null,
      to_number: data.tonumber || null,
      phone_normalized: data.tonumber || null, // or your normalization fn

      // unique call ID from Kixie
      call_id: data.callid,

      // store everything for debugging
      raw: data,
    };

    const { error } = await supabase.from("kixie_call_logs").insert([record]);

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
