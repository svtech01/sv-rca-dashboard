import { supabase } from "@/lib/supabaseServerClient";
import { stat } from "fs";
import { NextResponse } from "next/server";

const WebhookLogger = async (service: string, body: any, status: string, message: string) => {
  const { error } = await supabase.from("kixie_hook_logs").insert([{
    service: service,
    data: body,
    status: status,
    message: message,
  }]);
  return error;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (req.headers.get("x-kixie-webhook-secret") !== process.env.KIXIE_WEBHOOK_SECRET) {
      await WebhookLogger("kixie", body, "error", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if(!body || Object.keys(body).length === 0) {
      await WebhookLogger("kixie", body, "error", "Empty payload");
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const data = body?.data;
    if (!data) {
      await WebhookLogger("kixie", body, "error", "Missing data object");      
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
      await WebhookLogger("kixie", body, "error", `Supabase upsert error: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await WebhookLogger("kixie", body, "success", "Call log inserted successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    await WebhookLogger("kixie", err, "error", `try catch error: ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
