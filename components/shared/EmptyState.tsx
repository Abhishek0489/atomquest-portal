import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Icon className="h-10 w-10 text-[#64748B]" />
      <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#64748B]">{description}</p>
      )}
    </section>
  );
}
