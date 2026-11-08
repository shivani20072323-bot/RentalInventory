import type { LucideIcon } from "lucide-react";
import { Camera, Cpu, Mic2, PartyPopper, Tent, Trophy, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";
import type { DisplayStatus } from "@/lib/rental-utils";

const statusStyles: Record<DisplayStatus | "available" | "low" | "out", { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-warning-soft text-warning" },
  active: { label: "Active", cls: "bg-brand-soft text-brand" },
  overdue: { label: "Overdue", cls: "bg-destructive-soft text-destructive" },
  returned: { label: "Returned", cls: "bg-success-soft text-success" },
  rejected: { label: "Rejected", cls: "bg-muted text-muted-foreground" },
  available: { label: "Available", cls: "bg-success-soft text-success" },
  low: { label: "Low stock", cls: "bg-warning-soft text-warning" },
  out: { label: "Unavailable", cls: "bg-destructive-soft text-destructive" },
};

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  const s = statusStyles[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", s.cls)}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export const availabilityStatus = (available: number, total: number) =>
  available === 0 ? "out" : available / total <= 0.25 ? "low" : "available";

const categoryIcon: Record<Category, LucideIcon> = {
  Audio: Mic2, Camera: Camera, Computing: Cpu, Sports: Trophy, Outdoor: Tent, Event: PartyPopper,
};

export function EquipmentThumb({ category, imageUrl, size = "md" }: { category: Category; imageUrl?: string; size?: "sm" | "md" | "lg" }) {
  const Icon = categoryIcon[category];
  const dims = size === "sm" ? "size-8" : size === "lg" ? "size-16" : "size-10";
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-md border bg-gradient-to-b from-card to-muted text-primary", dims)}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
      ) : (
        <Icon className={size === "lg" ? "size-7" : "size-4"} strokeWidth={1.75} />
      )}
    </div>
  );
}

export function Panel({ title, description, action, children, className }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "default" }: { label: string; value: number | string; icon: LucideIcon; hint?: ReactNode; tone?: "default" | "success" | "brand" | "danger" }) {
  const toneCls = { default: "bg-muted text-primary", success: "bg-success-soft text-success", brand: "bg-brand-soft text-brand", danger: "bg-destructive-soft text-destructive" }[tone];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-pop">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-md", toneCls)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Table primitives styled for the app. */
export const tableCls = {
  wrap: "overflow-x-auto",
  table: "w-full text-sm",
  th: "h-10 px-4 text-left text-xs font-medium text-muted-foreground whitespace-nowrap border-b bg-muted/40",
  td: "px-4 py-3 border-b align-middle",
  tr: "transition-colors hover:bg-muted/40 last:[&>td]:border-b-0",
};
