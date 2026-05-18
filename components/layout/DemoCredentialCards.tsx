"use client";

import { DEMO_ACCOUNTS, type DemoAccount } from "@/lib/constants/demo-accounts";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Shield, UserCog, User } from "lucide-react";

const roleStyles: Record<
  Role,
  { border: string; bg: string; badge: string; icon: typeof Shield }
> = {
  ADMIN: {
    border: "border-violet-200 hover:border-violet-400",
    bg: "hover:bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    icon: Shield,
  },
  MANAGER: {
    border: "border-blue-200 hover:border-blue-400",
    bg: "hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: UserCog,
  },
  EMPLOYEE: {
    border: "border-slate-200 hover:border-slate-400",
    bg: "hover:bg-slate-50",
    badge: "bg-slate-100 text-slate-700",
    icon: User,
  },
};

type DemoCredentialCardsProps = {
  onSelect: (account: DemoAccount) => void;
  selectedEmail?: string;
};

export function DemoCredentialCards({
  onSelect,
  selectedEmail,
}: DemoCredentialCardsProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
        Demo accounts — click to autofill
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => {
          const styles = roleStyles[account.role];
          const Icon = styles.icon;
          const isSelected = selectedEmail === account.email;

          return (
            <button
              key={account.email}
              type="button"
              onClick={() => onSelect(account)}
              className={cn(
                "rounded-xl border bg-white p-3 text-left transition-all shadow-sm",
                styles.border,
                styles.bg,
                isSelected && "ring-2 ring-[#1E40AF] ring-offset-1"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      styles.badge
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {account.label}
                    </p>
                    <p className="text-xs text-[#64748B]">{account.name}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    styles.badge
                  )}
                >
                  {account.role}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#64748B] line-clamp-2">
                {account.description}
              </p>
              <p className="mt-1.5 truncate font-mono text-[10px] text-[#64748B]">
                {account.email}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
