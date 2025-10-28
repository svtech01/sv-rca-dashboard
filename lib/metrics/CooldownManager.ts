import dayjs from "dayjs";
import { Config } from "./config";

// Generic CSV types
export type CSVRecord = Record<string, any>;
export type CSVData = CSVRecord[];

export interface DashboardData {
  kixie?: CSVData;
  telesign?: CSVData;
  powerlist?: CSVData;
}

export class CooldownManager {
  private powerlist: CSVData;
  private kixie: CSVData;
  private config: Config;

  constructor(data: DashboardData) {
    this.powerlist = data.powerlist ?? [];
    this.kixie = data.kixie ?? [];
    this.config = new Config();
  }

  /**
   * Identify contacts that reached max attempts threshold.
   */
  identifyCooldownContacts() {
    if (this.powerlist.length === 0) return [];

    const maxAttempts = this.config.DEFAULT_MAX_ATTEMPTS;
    const cooldownDays = this.config.COOLDOWN_DAYS;
    const now = dayjs();

    const contacts = this.powerlist
      .filter((r) => {
        const attempts =
          Number(r["Attempt Count"]) ||
          Number(r["attemptCount"]) ||
          Number(r["attempts"]) ||
          Number(r.attemptCount) || 
          0;
        return attempts >= maxAttempts;
      })
      .map((r) => {
        const cooldownEnd = now.add(cooldownDays, "day");
        const attemptCount =
          Number(r["Attempt Count"]) ||
          Number(r["attemptCount"]) ||
          Number(r["attempts"]) ||
          Number(r.attemptCount) || 
          0;

        return {
          phoneNumber:
            r["Phone Number"] ?? r.phoneNumber ?? r.phone ?? "Unknown",
          listName: r["List Name"] ?? r.listName ?? "Unknown",
          attemptCount,
          cooldownStart: now.format("YYYY-MM-DD"),
          cooldownEnd: cooldownEnd.format("YYYY-MM-DD"),
          owner: "System",
          reviewDate: cooldownEnd.format("YYYY-MM-DD"),
          status: "In Cooldown",
        };
      });

    return contacts;
  }

  /**
   * Calculate potential for reattempt after cooldown period.
   */
  calculateReattemptPotential() {
    const cooldownContacts = this.identifyCooldownContacts();

    if (cooldownContacts.length === 0) {
      return {
        cooldown_contacts_count: 0,
        reattempt_potential: 0,
        target_kpi: 15,
        cooldown_days: this.config.COOLDOWN_DAYS,
      };
    }

    const totalCooldown = cooldownContacts.length;
    const targetSuccessRate = 0.15;
    const reattemptPotential = Math.floor(totalCooldown * targetSuccessRate);

    return {
      cooldown_contacts_count: totalCooldown,
      reattempt_potential: reattemptPotential,
      target_kpi: 15,
      cooldown_days: this.config.COOLDOWN_DAYS,
      cooldown_contacts: cooldownContacts,
    };
  }

  /**
   * Return a feed of cooldown contacts with their details.
   */
  getCooldownFeed() {
    return this.identifyCooldownContacts();
  }
}
