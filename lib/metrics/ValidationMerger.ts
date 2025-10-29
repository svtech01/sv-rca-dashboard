import { normalizePhonesLast10 } from "../loaders";

export type CSVRecord = Record<string, any>;
export type CSVData = CSVRecord[];

export class ValidationMerger {
  private kixie: CSVData;
  private powerlist: CSVData;
  private telesign: CSVData;

  constructor(data: { kixie?: CSVData; powerlist?: CSVData; telesign?: CSVData }) {
    this.kixie = data.kixie || [];
    this.powerlist = data.powerlist || [];
    this.telesign = data.telesign || [];
  }

  crossReferenceData() {
    if (!this.kixie.length || !this.powerlist.length || !this.telesign.length) {
      return this.emptyResults();
    }

    // Merge powerlist ↔ telesign
    const powerlistTelesign = this.mergeOnKey(this.powerlist, this.telesign, "phoneNormalized");

    // Merge all_data with kixie
    const allData = this.mergeOnKey(powerlistTelesign, this.kixie, "phoneNormalized");

    // Categorization
    const validatedDialed = allData.filter(
      (r) => r.is_reachable !== undefined && r.datetime
    );
    const validatedOnly = allData.filter(
      (r) => r.is_reachable !== undefined && !r.datetime
    );
    const dialedOnly = allData.filter(
      (r) => r.is_reachable === undefined && r.datetime
    );

    // Carrier summary
    const carrierGroups: Record<
      string,
      { total_validated: number; reachable_count: number; reachable_pct: number }
    > = {};

    for (const r of this.telesign) {
      const carrier = r.carrier || "Unknown";
      if (!carrierGroups[carrier]) {
        carrierGroups[carrier] = {
          total_validated: 0,
          reachable_count: 0,
          reachable_pct: 0,
        };
      }
      carrierGroups[carrier].total_validated += 1;
      if (r.is_reachable === true) {
        carrierGroups[carrier].reachable_count += 1;
      }
    }

    for (const c in carrierGroups) {
      const g = carrierGroups[c];
      g.reachable_pct = parseFloat(((g.reachable_count / g.total_validated) * 100).toFixed(2));
    }

    // False negatives
    const falseNegatives = allData.filter(
      (r) =>
        r.is_reachable === false &&
        ["Connected", "Left voicemail"].includes(r.Disposition || "")
    );

    return {
      validated_dialed: {
        count: validatedDialed.length,
        data: validatedDialed.map((r) => ({
          phoneNumber: r.PhoneNumber,
          listName: r.ListName,
          is_reachable: r.is_reachable,
          carrier: r.carrier,
          Disposition: r.Disposition,
          datetime: r.datetime,
        })),
      },
      validated_only: {
        count: validatedOnly.length,
        data: validatedOnly.map((r) => ({
          phoneNumber: r.PhoneNumber,
          listName: r.ListName,
          is_reachable: r.is_reachable,
          carrier: r.carrier,
        })),
      },
      dialed_only: {
        count: dialedOnly.length,
        data: dialedOnly.map((r) => ({
          phoneNumber: r.PhoneNumber,
          listName: r.ListName,
          Disposition: r.Disposition,
          datetime: r.datetime,
        })),
      },
      carrier_summary: carrierGroups,
      false_negatives: {
        count: falseNegatives.length,
        data: falseNegatives.map((r) => ({
          phoneNumber: r.PhoneNumber,
          listName: r.ListName,
          is_reachable: r.is_reachable,
          Disposition: r.Disposition,
          datetime: r.datetime,
        })),
      },
    };
  }

  calculateDataHygieneMetrics() {
    if (!this.telesign.length) {
      return {};
    }

    const totalValidated = this.telesign.length;
    const reachableCount = this.telesign.filter((r) => r.is_reachable === true).length;
    const invalidCount = totalValidated - reachableCount;

    let validatedDialedCount = 0;
    if (this.kixie.length) {
      const validatedDialed = this.telesign.filter(t =>
        this.kixie.some(k => k.phoneNormalized === t.phoneNormalized)
      );
      validatedDialedCount = validatedDialed.length;
    }

    return {
      total_validated: totalValidated,
      reachable_count: reachableCount,
      reachable_rate: reachableCount / (totalValidated || 1) * 100,
      invalid_count: invalidCount,
      invalid_pct:
        totalValidated > 0 ? parseFloat(((invalidCount / totalValidated) * 100).toFixed(2)) : 0,
      validated_dialed_count: validatedDialedCount,
      validated_dialed_pct:
        totalValidated > 0
          ? parseFloat(((validatedDialedCount / totalValidated) * 100).toFixed(2))
          : 0,
    };
  }

  private mergeOnKey<T extends Record<string, any>>(a: T[], b: T[], key: string): T[] {
    const bMap = new Map(b.map((r) => [r[key], r]));
    return a.map((r) => ({
      ...r,
      ...(bMap.get(r[key]) || {}),
    }));
  }

  private emptyResults() {
    return {
      validated_dialed: { count: 0, data: [] },
      validated_only: { count: 0, data: [] },
      dialed_only: { count: 0, data: [] },
      carrier_summary: {},
      false_negatives: { count: 0, data: [] },
    };
  }
}
