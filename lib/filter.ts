import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// Always default to Asia/Manila
const TZ = "Asia/Manila";

export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  filter: "all" | "today" | "week" | "month" = "all",
  dateKey: keyof T = "datetime" as keyof T
): T[] {
  if (!data?.length || filter === "all") return data;

  const now = dayjs().tz(TZ);
  const startOfDay = now.startOf("day");
  const startOfWeek = now.startOf("week");
  const startOfMonth = now.startOf("month");

  return data.filter((row) => {
    const rawDate = row[dateKey];
    if (!rawDate) return false;

    const formats = ["M/D/YYYY", "M/D/YY", "MM/DD/YYYY", "MM/DD/YY"];
    let date: dayjs.Dayjs | null = null;

    for (const fmt of formats) {
      const parsed = dayjs.tz(rawDate, fmt, TZ);
      if (parsed.isValid()) {
        date = parsed;
        break;
      }
    }

    if (!date) return false;

    switch (filter) {
      case "today":
        return date.isSame(now, "day");
      case "week":
        return date.isAfter(startOfWeek);
      case "month":
        return date.isAfter(startOfMonth);
      default:
        return true;
    }
  });
}
