import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-1 flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
          <Icon aria-hidden className="size-5" />
        </span>
      )}
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
