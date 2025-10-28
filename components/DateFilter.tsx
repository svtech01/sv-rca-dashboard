type FilterOption = "all" | "today" | "week" | "month";

interface DateRangeFilterProps {
  value: string; // 👈 current active filter
  onRangeChange: (filter: FilterOption) => void;
}

export default function DateRangeFilter({
  value,
  onRangeChange,
}: DateRangeFilterProps) {
  const filters: FilterOption[] = ["all", "today", "week", "month"];

  return (
    <div className="flex gap-2 items-center">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onRangeChange(filter)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            value === filter
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          {filter === "all"
            ? "All"
            : filter === "today"
            ? "Today"
            : filter === "week"
            ? "This Week"
            : "This Month"}
        </button>
      ))}
    </div>
  );
}
