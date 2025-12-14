import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "@/types/reports";

interface ReportsLayoutProps {
  title: string;
  children: ReactNode;
  onDateRangeChange: (dateRange: DateRange) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ReportsLayout({
  title,
  children,
  onDateRangeChange,
  onExportPDF,
  onExportExcel,
  onPrint,
}: ReportsLayoutProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      const newRange = { ...dateRange, startDate: date };
      setDateRange(newRange);
      onDateRangeChange(newRange);
      setIsStartDateOpen(false);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const newRange = { ...dateRange, endDate: date };
      setDateRange(newRange);
      onDateRangeChange(newRange);
      setIsEndDateOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">
            Periode: {format(dateRange.startDate, "dd MMM yyyy", { locale: id })} -{" "}
            {format(dateRange.endDate, "dd MMM yyyy", { locale: id })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.startDate, "dd MMM yyyy", { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-gray-500">-</span>

            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.endDate, "dd MMM yyyy", { locale: id })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}