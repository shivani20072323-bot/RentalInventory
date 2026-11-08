import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function Field({ label, htmlFor, error, required, children, className }: { label: string; htmlFor: string; error?: string | undefined; required?: boolean; children: ReactNode; className?: string | undefined }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
