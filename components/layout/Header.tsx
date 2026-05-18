"use client";

import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { getRoleLabel } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type HeaderProps = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

export function Header({ name, email, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="pl-12 lg:pl-0">
        <p className="text-sm font-medium text-[#0F172A]">{name ?? "User"}</p>
        <p className="text-xs text-[#64748B]">
          {getRoleLabel(role)}
          {email ? ` · ${email}` : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </header>
  );
}
