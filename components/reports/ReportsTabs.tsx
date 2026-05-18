"use client";

import { useState } from "react";
import { AchievementReport } from "@/components/reports/AchievementReport";
import { CompletionDashboard } from "@/components/reports/CompletionDashboard";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "achievement", label: "Achievement Report" },
  { id: "completion", label: "Completion Dashboard" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReportsTabs() {
  const [tab, setTab] = useState<TabId>("achievement");

  return (
    <>
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-[#1E40AF] text-[#1E40AF]"
                : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "achievement" && <AchievementReport />}
        {tab === "completion" && <CompletionDashboard />}
      </div>
    </>
  );
}
