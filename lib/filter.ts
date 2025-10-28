import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  filter: "all" | "today" | "week" | "month" = "all",
  dateKey: keyof T = "datetime" as keyof T
): T[] {
  if (!data?.length || filter === "all") return data;

  const now = dayjs();
  const startOfDay = now.startOf("day");
  const startOfWeek = now.startOf("week");
  const startOfMonth = now.startOf("month");

  return data.filter((row) => {
    const rawDate = row[dateKey];
    if (!rawDate) return false;

    // Try parsing multiple formats
    const formats = ["M/D/YYYY", "M/D/YY", "MM/DD/YYYY", "MM/DD/YY"];
    let date = null;

    for (const fmt of formats) {
      const parsed = dayjs(rawDate, fmt, true);
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
