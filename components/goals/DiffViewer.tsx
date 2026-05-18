"use client";

import {
  diffVersions,
  FIELD_LABELS,
  formatDiffValue,
  type DiffableField,
} from "@/lib/diff";

type DiffViewerProps = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};

export function DiffViewer({ before, after }: DiffViewerProps) {
  const diffs = diffVersions(before, after);

  return (
    <ul className="space-y-3">
      {diffs.map(({ field, before: oldVal, after: newVal, changed }) => (
        <li
          key={field}
          className={`rounded-lg border px-3 py-2 text-sm ${
            changed
              ? "border-slate-200 bg-white"
              : "border-transparent bg-slate-50 text-[#64748B]"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {FIELD_LABELS[field as DiffableField]}
          </p>
          {changed ? (
            <section className="mt-1 space-y-1">
              <p className="text-red-600 line-through">
                {formatDiffValue(field as DiffableField, oldVal)}
              </p>
              <p className="font-medium text-[#16A34A]">
                {formatDiffValue(field as DiffableField, newVal)}
              </p>
            </section>
          ) : (
            <p className="mt-1">{formatDiffValue(field as DiffableField, oldVal)}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
