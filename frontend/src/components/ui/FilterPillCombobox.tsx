import * as React from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterPillComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  options: readonly string[];
  labels?: Record<string, string>;
  className?: string;
  triggerClassName?: string;
  searchPlaceholder?: string;
}

export const FilterPillCombobox = ({
  value,
  onValueChange,
  onClear,
  placeholder,
  options,
  labels,
  className,
  triggerClassName,
  searchPlaceholder = "Search...",
}: FilterPillComboboxProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-1 shrink-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "rounded-full border text-sm font-medium focus:ring-ring h-10 justify-between transition-colors",
              value
                ? "border-primary bg-primary-subtle text-primary hover:bg-primary-subtle hover:text-primary"
                : "border-border bg-card text-foreground hover:border-primary hover:text-primary hover:bg-card",
              triggerClassName
            )}
          >
            <span className="truncate">
              {value ? (labels?.[value] ?? value) : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0 bg-popover border-border">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onValueChange(option);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {labels?.[option] ?? option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
};
