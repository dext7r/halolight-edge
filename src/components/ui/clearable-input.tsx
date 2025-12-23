import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClearableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  ({ className, type, value, onChange, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== '';

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event to clear the input
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasValue && "pr-9",
            className,
          )}
          ref={ref}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="清除输入"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
ClearableInput.displayName = "ClearableInput";

export { ClearableInput };
