import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + hint + error wrapper with correct aria wiring. The control must use `id`. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden className="ml-0.5 text-violet">*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-border pt-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
      <div className="space-y-1.5">
        <h2 className="text-base font-medium">{title}</h2>
        {description && <p className="text-sm text-subtle">{description}</p>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}
