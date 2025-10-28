import { Config } from "./config";

export interface KixieRecord {
  Disposition?: string;
  "To Number"?: string;
  datetime?: string;
  phoneNormalized?: string;
}

export interface PowerlistRecord {
  "Phone Number"?: string;
  attemptCount?: number;
  "List Name"?: string;
  Connected?: number;
}

export interface TelesignRecord {
  phone_e164?: string;
  is_reachable?: boolean;
  source_file?: string;
  phoneNormalized?: string;
}

export interface DashboardData {
  kixie?: KixieRecord[];
  powerlist?: PowerlistRecord[];
  telesign?: TelesignRecord[];
}

export class MetricsCalculator {
  private data: DashboardData;
  private config: Config;
  private kixie: KixieRecord[];
  private powerlist: PowerlistRecord[];
  private telesign: TelesignRecord[];

  constructor(data: DashboardData) {
    this.data = data;
    this.config = new Config();

    this.kixie = data.kixie ?? [];
    this.powerlist = data.powerlist ?? [];
    this.telesign = data.telesign ?? [];
  }

  calculateBaselineMetrics() {
    if (!this.kixie.length) return {};

    const totalCalls = this.kixie.length;

    // Connected calls
    const connectedCalls = this.kixie.filter((r) =>
      this.config.CONNECT_DISPOSITIONS.includes(r.Disposition ?? "")
    ).length;

    const connectRate =
      totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;

    // Answer event %
    const dialAtATime = this.config.DEFAULT_DIAL_AT_A_TIME;
    const callsLogged = totalCalls;
    const lostRaceAttempts = callsLogged * ((dialAtATime - 1) / dialAtATime);

    const answerEventPct =
      callsLogged + lostRaceAttempts > 0
        ? (callsLogged / (callsLogged + lostRaceAttempts)) * 100
        : 0;

    // Avg attempts per lost-race number
    const lostRace = this.kixie.filter(
      (r) => !this.config.CONNECT_DISPOSITIONS.includes(r.Disposition ?? "")
    );

    let avgAttemptsLostRace = 0;
    if (lostRace.length) {
      const counts: Record<string, number> = {};
      for (const r of lostRace) {
        const phone = r.phoneNormalized;
        if (!phone) continue;
        counts[phone] = (counts[phone] || 0) + 1;
      }
      const values = Object.values(counts);
      avgAttemptsLostRace =
        values.reduce((a, b) => a + b, 0) / (values.length || 1);
    }

    // Cooldown/day
    const maxAttempts = this.config.DEFAULT_MAX_ATTEMPTS;
    let cooldownPerDay = 0;
    if (this.powerlist.length) {
      const cooldownContacts = this.powerlist.filter(
        (r) => (r.attemptCount ?? 0) >= maxAttempts
      );
      cooldownPerDay =
        cooldownContacts.length > 0 ? cooldownContacts.length / 7 : 0;
    }

    return {
      connect_rate: Number(connectRate.toFixed(2)),
      answer_event_pct: Number(answerEventPct.toFixed(2)),
      avg_attempts_lost_race: Number(avgAttemptsLostRace.toFixed(2)),
      cooldown_per_day: cooldownPerDay,
      total_calls: totalCalls,
      connected_calls: connectedCalls,
    };
  }

  calculatePilotMetrics(
    dialAtATimeOverride?: number,
    maxAttemptsOverride?: number
  ) {
    if (!this.powerlist.length) return {};

    let pilot = this.powerlist.filter((r) =>
      (r["List Name"] ?? "")
        .toLowerCase()
        .includes(this.config.PILOT_LIST_NAME.toLowerCase())
    );

    if (!pilot.length) {
      const sampleSize = Math.min(100, this.powerlist.length);
      pilot = this.powerlist.slice(0, sampleSize);
    }

    if (!pilot.length) return {};

    const sampleSize = pilot.length;
    const dialAtATime =
      dialAtATimeOverride ?? this.config.DEFAULT_DIAL_AT_A_TIME;
    const maxAttempts = maxAttemptsOverride ?? this.config.DEFAULT_MAX_ATTEMPTS;

    const baseline = this.calculateBaselineMetrics() as any;
    const baselineConnectRate = baseline.connect_rate ?? 0;
    const targetConnectRate =
      baselineConnectRate * (1 + this.config.TARGET_CONNECT_UPLIFT_PCT / 100);

    return {
      sample_size: sampleSize,
      target_connect_uplift_pct: this.config.TARGET_CONNECT_UPLIFT_PCT,
      target_connect_rate: Number(targetConnectRate.toFixed(2)),
      success_connect_uplift_pct: this.config.SUCCESS_CRITERIA_CONNECT_UPLIFT_PCT,
      success_voicemail_uplift_pct:
        this.config.SUCCESS_CRITERIA_VOICEMAIL_UPLIFT_PCT,
      test_duration_days: 3,
      dial_at_a_time: dialAtATime,
      max_attempts: maxAttempts,
    };
  }

  calculateWeeklyTrends() {
    if (!this.kixie.length || !this.kixie[0].datetime) return {};

    const weeklyStats: Record<
      string,
      { total_calls: number; connected_calls: number; voicemail_calls: number; no_answer_calls: number }
    > = {};

    for (const r of this.kixie) {
      const dt = new Date(r.datetime ?? "");
      if (isNaN(dt.getTime())) continue;

      const week = `${dt.getFullYear()}-W${Math.ceil(dt.getDate() / 7)}`;

      if (!weeklyStats[week]) {
        weeklyStats[week] = {
          total_calls: 0,
          connected_calls: 0,
          voicemail_calls: 0,
          no_answer_calls: 0,
        };
      }

      weeklyStats[week].total_calls++;
      const disp = r.Disposition ?? "";

      if (this.config.CONNECT_DISPOSITIONS.includes(disp)) {
        weeklyStats[week].connected_calls++;
      } else if (disp === "Left voicemail") {
        weeklyStats[week].voicemail_calls++;
      } else {
        weeklyStats[week].no_answer_calls++;
      }
    }

    const weeks = Object.keys(weeklyStats);
    const totals = Object.values(weeklyStats);

    return {
      weeks,
      total_calls: totals.map((t) => t.total_calls),
      connected_calls: totals.map((t) => t.connected_calls),
      voicemail_calls: totals.map((t) => t.voicemail_calls),
      no_answer_calls: totals.map((t) => t.no_answer_calls),
    };
  }

  calculateAttemptDistribution(listName?: string) {
    if (!this.powerlist.length) return {};

    let df = this.powerlist;
    if (listName) {
      df = df.filter((r) =>
        (r["List Name"] ?? "")
          .toLowerCase()
          .includes(listName.toLowerCase())
      );
    }
    if (!df.length) return {};

    const counts: Record<number, number> = {};
    for (const r of df) {
      const attempt = r.attemptCount ?? 0;
      counts[attempt] = (counts[attempt] || 0) + 1;
    }

    const sorted = Object.keys(counts)
      .map(Number)
      .sort((a, b) => a - b);

    return {
      attempt_counts: sorted,
      contact_counts: sorted.map((k) => counts[k]),
    };
  }

  calculateCooldownMetrics() {
    if (!this.powerlist.length) return {};

    const maxAttempts = this.config.DEFAULT_MAX_ATTEMPTS;
    const cooldownContacts = this.powerlist.filter(
      (r) => (r.attemptCount ?? 0) >= maxAttempts
    );

    const cooldownDays = this.config.COOLDOWN_DAYS;
    const reattemptDate = new Date();
    reattemptDate.setDate(reattemptDate.getDate() + cooldownDays);

    return {
      cooldown_contacts: cooldownContacts.length,
      cooldown_days: cooldownDays,
      reattempt_date: reattemptDate.toISOString().split("T")[0],
      max_attempts: maxAttempts,
    };
  }
}
