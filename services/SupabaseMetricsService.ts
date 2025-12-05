
import { supabase, telesignSupabase } from "@/lib/supabaseServerClient";

type FilterOptions = "all" | "today" | "week" | "month" | "";

export async function getKixieCallTimespan(timeFilter: FilterOptions) {
  try {
    // Build dynamic filter date
    let filterDate: string | null = null;
    const now = new Date();

    if (timeFilter === "today") {
      filterDate = now.toISOString().split("T")[0];
    }

    if (timeFilter === "week") {
      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() - now.getDay());
      filterDate = firstDay.toISOString().split("T")[0];
    }

    if (timeFilter === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      filterDate = firstDay.toISOString().split("T")[0];
    }

    // 🟦 Separate queries so order does NOT conflict
    let earliestQuery = supabase.from("kixie_call_logs").select("calldate");
    let latestQuery = supabase.from("kixie_call_logs").select("calldate");

    if (filterDate) {
      earliestQuery = earliestQuery.gte("calldate", filterDate);
      latestQuery = latestQuery.gte("calldate", filterDate);
    }

    const { data: minData, error: minError } = await earliestQuery
      .order("calldate", { ascending: true })
      .limit(1);

    const { data: maxData, error: maxError } = await latestQuery
      .order("calldate", { ascending: false })
      .limit(1);

    if (minError) throw minError;
    if (maxError) throw maxError;

    if (!minData?.[0]?.calldate || !maxData?.[0]?.calldate) {
      return { earliest: null, latest: null, timespanDays: 0 };
    }

    const earliest = new Date(minData[0].calldate);
    const latest = new Date(maxData[0].calldate);

    const timespanMs = latest.getTime() - earliest.getTime();
    const timespanDays = Math.ceil(timespanMs / (1000 * 60 * 60 * 24));

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "2-digit",
    };

    return {
      earliest: earliest.toLocaleDateString("en-US", formatOptions),
      latest: latest.toLocaleDateString("en-US", formatOptions),
      timespanDays,
    };

  } catch (err: any) {
    console.error("Error fetching timespan:", err);
    return { earliest: null, latest: null, timespanDays: 0, error: err.message };
  }
}

// Kixie
export async function getBaselineMetrics(filter: FilterOptions) {

  const { data, error } = await supabase.rpc("calculate_baseline_metrics_filtered", {
    time_filter: filter
  });

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

// Telesign
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
  // console.log(telesignData.slice(0, 10));

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

// Powerlist
export async function getPilotMetrics(filterByTime: FilterOptions, filterByList: string) {

  const sampleSize = 100;
  const testDurationDays = 3;
  const { data: config, error: configError } = await supabase.from("app_config_settings").select("*").eq("id", 1).single();

  if (configError) {
    console.error("Config fetch error:", configError);
    throw new Error("Failed to fetch config");
  }

  let queryFunction = "";
  let queryParams = {
    pilot_list_name: config?.pilot_list_name,
    target_uplift_pct: config?.target_connect,
    success_uplift_pct: config?.success_connect,
    test_duration: testDurationDays,
    sample_limit: sampleSize,
    date_filter: filterByTime
  }

  if(filterByList.toLowerCase() == "all"){
    // Get all powerlist
    queryFunction = "get_baseline_pilot_metrics_filtered";
  }else{
    // Get from specific powerlist
    queryFunction = "get_pilot_metrics_by_list_filtered";
    queryParams.pilot_list_name = filterByList
  }

  // console.log("Query Function to run:", queryFunction);
  // console.log("Query Params: ", queryParams);

  const { data, error } = await supabase
    .rpc(queryFunction, queryParams).single<{ target_connect_rate: number }>();

  if (error) console.error(error);

  // console.log(data);

  return {
    sample_size: sampleSize,
    target_connect_uplift_pct: config?.target_connect,
    target_connect_rate: data?.target_connect_rate ? Number(data?.target_connect_rate?.toFixed(2)) : 0,
    success_connect_uplift_pct: config?.success_connect,
    success_voicemail_uplift_pct: config?.success_voicemail,
    test_duration_days: testDurationDays,
    dial_at_a_time: config?.dial_at_a_time,
    max_attempts: config?.max_attempts,
    rpc: data
  };

}

export async function getReattemptPotential(filter: FilterOptions) {

  const { data: config, error: configError } = await supabase.from("app_config_settings").select("*").eq("id", 1).single();

  if (configError) {
    console.error("Config fetch error:", configError);
    throw new Error("Failed to fetch config");
  }

  const { data, error } = await supabase
    .rpc("get_cooldown_contacts_filtered", { 
      max_attempts: config?.max_attempts, 
      cooldown_days_param: config?.cooldown_days,
      date_filter: filter
    });

  if (error) throw error;

  return data?.[0] ?? {
    cooldown_contacts_count: 0,
    reattempt_potential: 0,
    target_kpi: 15,
    cooldown_days: config?.cooldown_days,
    cooldown_contacts: []
  };
}

export async function getWeeklyTrends() {

  try {
    const { data, error } = await supabase.rpc("get_weekly_trends").single<{
      week_label: string[]; 
      total_calls: number[]; 
      connected_calls: number[]; 
      voicemail_calls: number[]; 
      no_answer_calls: number[]
    }>();

    if (error) {
      console.error("Metrics RPC error:", error);
      throw new Error("Failed to load baseline metrics");
    }

    return {
      weeks: data.week_label,
      total_calls: data.total_calls,
      connected_calls: data.connected_calls,
      voicemail_calls: data.voicemail_calls,
      no_answer_calls: data.no_answer_calls,
    };

  } catch (error) {
    return error
  }
}