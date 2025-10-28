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
const FORMATS = ["M/D/YYYY", "M/D/YY", "MM/DD/YYYY", "MM/DD/YY"];

export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  filter: "all" | "today" | "week" | "month" = "all",
  dateKey: keyof T = "date" as keyof T
): T[] {
  if (!data?.length || filter === "all") return data;

  const now = dayjs().tz(TZ);
  let start: dayjs.Dayjs;

  if (filter === "today") start = now.startOf("day");
  else if (filter === "week") start = now.subtract(7, "day").startOf("day");
  else start = now.subtract(30, "day").startOf("day");

  const end = now.endOf("day");

  console.log(`📂Filtering from ${start.toDate()} to ${end.toDate()}`);

  return data.filter((row) => {
    const raw = row[dateKey];
    if (!raw) return false;

    let parsed: dayjs.Dayjs | null = null;

    // Only try minimal known formats (fastest path)
    for (let i = 0; i < FORMATS.length; i++) {
      parsed = dayjs(raw, FORMATS[i]);
      if (parsed.isValid()) break;
    }

    if (!parsed || !parsed.isValid()) return false;

    // Convert once to Manila timezone
    parsed = parsed.tz(TZ);

    if(filter === "today") {
      return parsed.isSame(start);
    }else{
      return parsed.isAfter(start) && parsed.isBefore(end);
    }

  });
}
