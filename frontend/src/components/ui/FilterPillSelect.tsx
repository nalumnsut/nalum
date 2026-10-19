import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterPillSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  options: readonly string[];
  /** Optional display override, keyed by option value (defaults to the value itself). */
  labels?: Record<string, string>;
  className?: string;
  triggerClassName?: string;
}

// Rounded-pill dropdown used across the dashboard's inline filter rows
// (Alumni Directory, and future pages migrating off the old modal-filter
// pattern). Pairs a Select with a clear (X) button that only appears once
// a value is chosen.
export const FilterPillSelect = ({
  value,
  onValueChange,
  onClear,
  placeholder,
  options,
  labels,
  className,
  triggerClassName,
}: FilterPillSelectProps) => (
  <div className={cn("flex items-center gap-1 shrink-0", className)}>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "rounded-full border text-sm font-medium focus:ring-ring h-10 transition-colors",
          value
            ? "border-primary bg-primary-subtle text-primary hover:border-primary hover:text-primary"
            : "border-border bg-card text-foreground hover:border-primary hover:text-primary hover:bg-card",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border text-foreground max-h-72">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels?.[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {value && (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
);
