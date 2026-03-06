import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  showTodayButton?: boolean;
  onTodayClick?: () => void;
  isCurrentMonth?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  month,
  year,
  onMonthChange,
  showTodayButton = true,
  onTodayClick,
  isCurrentMonth = false,
}) => {
  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 text-center">
        <h2 className="text-xl font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
      </div>

      {showTodayButton && !isCurrentMonth && onTodayClick && (
        <Button variant="outline" size="sm" onClick={onTodayClick}>
          Today
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
