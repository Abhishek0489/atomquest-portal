export const DIFFABLE_FIELDS = [
  "title",
  "description",
  "target",
  "weightage",
  "targetDate",
  "thrustArea",
  "uomType",
] as const;

export type DiffableField = (typeof DIFFABLE_FIELDS)[number];

export type FieldDiff = {
  field: DiffableField;
  before: unknown;
  after: unknown;
  changed: boolean;
};

export const FIELD_LABELS: Record<DiffableField, string> = {
  title: "Title",
  description: "Description",
  target: "Target",
  weightage: "Weightage",
  targetDate: "Target date",
  thrustArea: "Thrust area",
  uomType: "UoM type",
};

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeValue(a)) === JSON.stringify(normalizeValue(b));
}

export function diffVersions(
  oldSnapshot: Record<string, unknown>,
  newSnapshot: Record<string, unknown>
): FieldDiff[] {
  return DIFFABLE_FIELDS.map((field) => {
    const before = oldSnapshot[field];
    const after = newSnapshot[field];
    const changed = !valuesEqual(before, after);
    return { field, before, after, changed };
  });
}

export function formatDiffValue(field: DiffableField, value: unknown): string {
  if (value == null || value === "") return "—";
  if (field === "targetDate" && typeof value === "string") {
    return new Date(value).toLocaleDateString();
  }
  if (field === "weightage" && typeof value === "number") {
    return `${value}%`;
  }
  return String(value);
}
