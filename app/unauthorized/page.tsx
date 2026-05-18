import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center max-w-md">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Unauthorized</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          You do not have permission to access this page.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[#1E40AF] hover:underline"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
