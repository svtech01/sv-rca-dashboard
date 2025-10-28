import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const TZ = "Asia/Manila";
dayjs.tz.setDefault(TZ);

const FORMATS = ["M/D/YYYY", "M/D/YY", "MM/DD/YYYY", "MM/DD/YY", "YYYY-MM-DD"];

export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  filter: "all" | "today" | "week" | "month" = "all",
  dateKey: keyof T = "date" as keyof T
): T[] {
  if (!data?.length || filter === "all") return data;

  const now = dayjs().tz(TZ);
  let start: dayjs.Dayjs;

  if (filter === "today") {
    start = now.startOf("day");
  } else if (filter === "week") {
    start = now.subtract(6, "day").startOf("day"); // ✅ 7 days including today
  } else {
    start = now.subtract(29, "day").startOf("day");
  }

  const end = now.endOf("day");

  console.log(`📂 Filtering from ${start.format()} to ${end.format()} (${TZ})`);

  return data.filter((row) => {
    const raw = row[dateKey];
    if (!raw || typeof raw !== "string") return false;

    let parsed: dayjs.Dayjs | null = null;

    for (const fmt of FORMATS) {
      try {
        const attempt = dayjs.tz(raw, fmt, TZ);
        if (attempt.isValid()) {
          parsed = attempt;
          break;
        }
      } catch {
        continue; // skip invalid format attempts safely
      }
    }

    if (!parsed || !parsed.isValid()) {
      // fallback: try generic parse (fastest safe option)
      parsed = dayjs(raw).tz(TZ);
      if (!parsed.isValid()) return false;
    }

    return parsed.isBetween(start, end, null, "[]");
  });
}
