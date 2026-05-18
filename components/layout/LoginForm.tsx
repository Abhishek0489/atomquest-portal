"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth.schema";
import { getRoleHome } from "@/lib/role-utils";
import type { DemoAccount } from "@/lib/constants/demo-accounts";
import { DemoCredentialCards } from "@/components/layout/DemoCredentialCards";
import { LoginField } from "@/components/layout/LoginField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback &&
    !rawCallback.startsWith("/api/auth") &&
    rawCallback !== "/login"
      ? rawCallback
      : null;
  const [authError, setAuthError] = useState<string | null>(null);
  const [fieldPulse, setFieldPulse] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const email = watch("email");
  const password = watch("password");
  const selectedEmail = email;

  function triggerPulse() {
    setFieldPulse(true);
    window.setTimeout(() => setFieldPulse(false), 600);
  }

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlPassword = searchParams.get("password");
    if (urlEmail) {
      setValue("email", urlEmail, { shouldValidate: true });
    }
    if (urlPassword) {
      setValue("password", urlPassword, { shouldValidate: true });
    }
    if (urlEmail || urlPassword) {
      triggerPulse();
    }
  }, [searchParams, setValue]);

  function handleDemoSelect(account: DemoAccount) {
    setValue("email", account.email, { shouldValidate: true, shouldDirty: true });
    setValue("password", account.password, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setAuthError(null);
    triggerPulse();
  }

  async function onSubmit(data: LoginFormValues) {
    setAuthError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;

    if (!role) {
      setAuthError("Sign-in succeeded but session could not be loaded.");
      return;
    }

    const destination =
      callbackUrl && callbackUrl !== "/login" ? callbackUrl : getRoleHome(role);
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E40AF] text-white text-lg font-bold">
            AQ
          </div>
          <CardTitle className="text-2xl text-[#0F172A]">AtomQuest Portal</CardTitle>
          <CardDescription className="text-[#64748B]">
            Goal Setting &amp; Tracking — sign in to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <LoginField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(v) =>
                setValue("email", v, { shouldValidate: true, shouldDirty: true })
              }
              onAutofill={(v) =>
                setValue("email", v, { shouldValidate: true, shouldDirty: true })
              }
              placeholder="you@atomquest.com"
              autoComplete="email"
              error={errors.email?.message}
              pulse={fieldPulse}
            />

            <LoginField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(v) =>
                setValue("password", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              onAutofill={(v) =>
                setValue("password", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              pulse={fieldPulse}
            />

            {authError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1E40AF] hover:bg-[#1E40AF]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DemoCredentialCards
        onSelect={handleDemoSelect}
        selectedEmail={selectedEmail}
      />
    </div>
  );
}
