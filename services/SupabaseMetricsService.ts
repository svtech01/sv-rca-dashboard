import { supabase, telesignSupabase } from "@/lib/supabaseServerClient";

export async function getBaselineMetrics() {
  const { data, error } = await supabase.rpc("calculate_baseline_metrics");

  if (error) {
    console.error("Metrics RPC error:", error);
    throw new Error("Failed to load baseline metrics");
  }

  // RPC returns a single row array
  return data?.[0] || {
    total_calls: 0,
    connected_calls: 0,
    connect_rate: 0,
    answer_event_pct: 0,
    avg_attempts_lost_race: 0,
    cooldown_per_day: 0,
  };
}

export async function getDataHygieneMetrics() {
  
  // 1️⃣ Fetch telesign contacts
  const { data: telesignData, error: telesignError } = await telesignSupabase
    .from("contacts")
    .select("phone_number_e164, is_reachable", { count: "exact" })
    .limit(1000000); // <-- fetch all rows

  if (telesignError) {
    console.error("Telesign fetch error:", telesignError);
    throw new Error("Failed to fetch telesign contacts");
  }

  // 2️⃣ Fetch kixie call logs
  const { data: kixieData, error: kixieError } = await supabase
    .from("kixie_call_logs")
    .select("phone_normalized");

  if (kixieError) {
    console.error("Kixie fetch error:", kixieError);
    throw new Error("Failed to fetch kixie call logs");
  }

  const totalValidated = telesignData.length;
  console.log(telesignData.slice(0, 10));

  // Reachable count
  const reachableCount = telesignData.filter((r) => r.is_reachable === true).length;

  const invalidCount = totalValidated - reachableCount;

  // Validated numbers that were dialed
  const kixieNumbersSet = new Set(kixieData.map((k) => k.phone_normalized));
  const validatedDialedCount = telesignData.filter((t) =>
    kixieNumbersSet.has(t.phone_number_e164)
  ).length;

  return {
    total_validated: totalValidated,
    reachable_count: reachableCount,
    reachable_rate: totalValidated > 0 ? (reachableCount / totalValidated) * 100 : 0,
    invalid_count: invalidCount,
    invalid_pct: totalValidated > 0 ? parseFloat(((invalidCount / totalValidated) * 100).toFixed(2)) : 0,
    validated_dialed_count: validatedDialedCount,
    validated_dialed_pct: totalValidated > 0 ? parseFloat(((validatedDialedCount / totalValidated) * 100).toFixed(2)) : 0,
  };

  

}

export async function getReattemptPotential() {
  
}