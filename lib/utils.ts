import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFiltersByParams(req: Request) {

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all";

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = new Date();

  switch (filter.toLowerCase()) {
    case "today":
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "week":
      const day = now.getDay(); // 0 = Sunday
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "all":
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return {
    startDate,
    endDate
  }
}

export function applyFilter(data: any, start: string, end: string) {
  
}