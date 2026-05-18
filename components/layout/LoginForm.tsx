"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth.schema";
import { getRoleHome } from "@/lib/role-utils";
import type { DemoAccount } from "@/lib/constants/demo-accounts";
import { DemoCredentialCards } from "@/components/layout/DemoCredentialCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const callbackUrl = searchParams.get("callbackUrl");
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const selectedEmail = watch("email");

  function handleDemoSelect(account: DemoAccount) {
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
    setAuthError(null);
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@atomquest.com"
                autoComplete="email"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {authError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
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
