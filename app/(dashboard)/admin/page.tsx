import { RoleGuard } from "@/components/layout/RoleGuard";

export default function AdminHomePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Manage users, cycles, shared goals, and reports — coming in Phase 7.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Users", desc: "Create and assign managers" },
            { title: "Cycles", desc: "Configure goal-setting phases" },
            { title: "Reports", desc: "Achievement and audit exports" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-[#0F172A]">{item.title}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
