import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A small decorative icon in front of a label; it takes the colour of the text around it. */
export function IconLabel({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children}
    </span>
  );
}
