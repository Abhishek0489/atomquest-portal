"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

type LoginFieldProps = {
  id: string;
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  onAutofill?: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  pulse?: boolean;
};

export function LoginField({
  id,
  label,
  type,
  value,
  onChange,
  onAutofill,
  placeholder,
  autoComplete,
  error,
  pulse,
}: LoginFieldProps) {
  const filled = value.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {filled && !error && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <Check className="h-3 w-3" />
            Filled
          </span>
        )}
      </div>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onAnimationStart={(e) => {
          if (e.animationName === "login-autofill-start" && onAutofill) {
            onAutofill((e.target as HTMLInputElement).value);
          }
        }}
        className={cn(
          "login-field-input h-10 transition-all duration-300",
          filled && "login-field-filled",
          pulse && "login-field-pulse",
          error && "border-red-500 bg-red-50/50"
        )}
      />
      {type === "password" && filled && (
        <div className="flex gap-1 pt-0.5" aria-hidden>
          {Array.from({ length: Math.min(8, Math.max(4, value.length)) }).map(
            (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  i < value.length ? "bg-[#1E40AF]" : "bg-[#1E40AF]/25"
                )}
                style={{ transitionDelay: `${i * 40}ms` }}
              />
            )
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
