"use client";

import { useTransition } from "react";
import { STAGES } from "@/lib/domain";
import type { Stage } from "@prisma/client";
import { updateStage } from "@/app/(app)/candidates/actions";
import { Select } from "@/components/ui/select";

export function StageSelect({
  candidateId,
  value,
  compact,
}: {
  candidateId: string;
  value: Stage;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Select
      disabled={pending}
      value={value}
      onChange={(e) => {
        const next = e.target.value as Stage;
        start(async () => {
          await updateStage(candidateId, next);
        });
      }}
      className={compact ? "h-7 text-xs" : undefined}
    >
      {STAGES.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </Select>
  );
}
