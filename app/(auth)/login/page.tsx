import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleHome } from "@/lib/role-utils";
import { LoginForm } from "@/components/layout/LoginForm";
import { Loader2 } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getRoleHome(session.user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center gap-2 text-[#64748B]">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  );
}
