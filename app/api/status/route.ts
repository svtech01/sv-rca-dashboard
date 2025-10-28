import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET() {
  const systemDate = new Date();
  const utcDate = dayjs().utc().format();
  const manilaDate = dayjs().tz("Asia/Manila").format();
  const guessedTz = dayjs.tz.guess?.() || "unknown";

  console.log("🕐 System Date:", systemDate);
  console.log("🌍 UTC Date:", utcDate);
  console.log("🇵🇭 Manila Date:", manilaDate);
  console.log("🔍 Guessed TZ:", guessedTz);
  console.log("🌐 process.env.TZ:", process.env.TZ);

  return new Response(
    JSON.stringify(
      { systemDate, utcDate, manilaDate, guessedTz, tzEnv: process.env.TZ },
      null,
      2
    ),
    { headers: { "Content-Type": "application/json" } }
  );
}
