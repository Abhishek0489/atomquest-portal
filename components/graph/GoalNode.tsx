"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ProgressStatus } from "@prisma/client";

export type GoalNodeData = {
  label: string;
  progressStatus: ProgressStatus;
};

const STATUS_STYLES: Record<ProgressStatus, string> = {
  NOT_STARTED: "border-slate-300 bg-slate-100 text-slate-700",
  ON_TRACK: "border-amber-300 bg-amber-50 text-amber-900",
  COMPLETED: "border-green-300 bg-green-50 text-green-900",
};

function GoalNodeComponent({ data }: NodeProps) {
  const nodeData = data as GoalNodeData;
  const style =
    STATUS_STYLES[nodeData.progressStatus] ?? STATUS_STYLES.NOT_STARTED;

  return (
    <section
      className={`relative min-w-[140px] max-w-[180px] rounded-lg border-2 px-3 py-2 text-center shadow-sm ${style}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        isConnectable
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-[#64748B] hover:!bg-[#1E40AF]"
        title="Connect here (required goal)"
      />
      <p className="pointer-events-none text-xs font-semibold leading-tight">
        {nodeData.label}
      </p>
      <p className="pointer-events-none mt-1 text-[10px] uppercase tracking-wide opacity-80">
        {nodeData.progressStatus.replace(/_/g, " ")}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable
        className="!z-10 !h-3.5 !w-3.5 !border-2 !border-white !bg-[#64748B] hover:!bg-[#1E40AF]"
        title="Drag from here (dependent goal)"
      />
    </section>
  );
}

export const GoalNode = memo(GoalNodeComponent);
