"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

export type ExportRow = Record<string, string | number | null>;

type ExportButtonProps = {
  rows: ExportRow[];
  filename?: string;
  sheetName?: string;
  disabled?: boolean;
};

export function ExportButton({
  rows,
  filename = "achievement-report",
  sheetName = "Achievement",
  disabled,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (rows.length === 0) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      toast.success("Report exported to Excel");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={disabled || exporting || rows.length === 0}
    >
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Excel
    </Button>
  );
}
