"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Goal } from "@prisma/client";
import {
  goalFormSchema,
  type GoalFormValues,
} from "@/lib/validations/goal.schema";
import { THRUST_AREAS } from "@/lib/constants/thrust-areas";
import { UOM_LABELS } from "@/lib/goal-labels";
import { REQUIRED_TOTAL_WEIGHTAGE } from "@/lib/goal-validation";
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
import { Loader2, Save, Send } from "lucide-react";

type GoalFormProps = {
  goal?: Goal;
  existingTotalWeightage?: number;
  mode: "create" | "edit";
};

function toFormDefaults(goal?: Goal): GoalFormValues {
  return {
    thrustArea: (goal?.thrustArea as GoalFormValues["thrustArea"]) ?? THRUST_AREAS[0],
    title: goal?.title ?? "",
    description: goal?.description ?? "",
    uomType: goal?.uomType ?? "NUMERIC_MIN",
    target: goal?.target ?? 0,
    targetDate: goal?.targetDate
      ? new Date(goal.targetDate).toISOString().slice(0, 10)
      : "",
    weightage: goal?.weightage ?? 10,
    submit: false,
  };
}

export function GoalForm({
  goal,
  existingTotalWeightage = 0,
  mode,
}: GoalFormProps) {
  const router = useRouter();
  const excludeWeight = mode === "edit" && goal ? goal.weightage : 0;
  const otherWeight = existingTotalWeightage - excludeWeight;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: toFormDefaults(goal),
  });

  const uomType = watch("uomType");
  const weightage = watch("weightage");
  const submitFlag = watch("submit");

  useEffect(() => {
    if (uomType === "ZERO") {
      setValue("target", 0);
    }
  }, [uomType, setValue]);

  const remaining = useMemo(() => {
    const w = Number(weightage) || 0;
    return REQUIRED_TOTAL_WEIGHTAGE - otherWeight - w;
  }, [weightage, otherWeight]);

  async function saveGoal(values: GoalFormValues, submitForApproval: boolean) {
    const payload = { ...values, submit: submitForApproval };
    const url = mode === "create" ? "/api/goals" : `/api/goals/${goal!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof body.error === "string"
          ? body.error
          : "Failed to save goal";
      setError("root", { message });
      return false;
    }

    router.push("/employee/goals");
    router.refresh();
    return true;
  }

  const onDraft = handleSubmit((values) => saveGoal(values, false));
  const onSubmit = handleSubmit((values) => saveGoal(values, true));

  const readOnly =
    mode === "edit" &&
    goal &&
    goal.status !== "DRAFT" &&
    goal.status !== "RETURNED";

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle className="text-[#0F172A]">
          {mode === "create" ? "New Goal" : "Edit Goal"}
        </CardTitle>
        <CardDescription>
          {readOnly
            ? "This goal cannot be edited in its current status."
            : "Weightage across all goals must total 100% when submitting."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thrustArea">Thrust Area</Label>
            <select
              id="thrustArea"
              disabled={readOnly}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...register("thrustArea")}
            >
              {THRUST_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            {errors.thrustArea && (
              <p className="text-xs text-red-600">{errors.thrustArea.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" disabled={readOnly} {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              disabled={readOnly}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uomType">UoM Type</Label>
            <select
              id="uomType"
              disabled={readOnly}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...register("uomType")}
            >
              {Object.entries(UOM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {uomType !== "ZERO" && (
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                step="any"
                disabled={readOnly}
                {...register("target", { valueAsNumber: true })}
              />
              {errors.target && (
                <p className="text-xs text-red-600">{errors.target.message}</p>
              )}
            </div>
          )}

          {uomType === "TIMELINE" && (
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                disabled={readOnly}
                {...register("targetDate")}
              />
              {errors.targetDate && (
                <p className="text-xs text-red-600">{errors.targetDate.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="weightage">Weightage (%)</Label>
            <Input
              id="weightage"
              type="number"
              min={10}
              max={100}
              disabled={readOnly}
              {...register("weightage", { valueAsNumber: true })}
            />
            {errors.weightage && (
              <p className="text-xs text-red-600">{errors.weightage.message}</p>
            )}
            <p
              className={`text-xs ${
                remaining === 0 ? "text-green-600" : "text-[#64748B]"
              }`}
            >
              {remaining === 0
                ? "This allocation reaches exactly 100%."
                : remaining > 0
                  ? `${remaining}% remaining to reach 100% total.`
                  : `${Math.abs(remaining)}% over the 100% limit.`}
            </p>
          </div>

          {errors.root && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}

          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onDraft}
              >
                {isSubmitting && !submitFlag ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save draft
              </Button>
              <Button
                type="button"
                className="bg-[#1E40AF] hover:bg-[#1E40AF]/90"
                disabled={isSubmitting}
                onClick={onSubmit}
              >
                {isSubmitting && submitFlag ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit for approval
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
