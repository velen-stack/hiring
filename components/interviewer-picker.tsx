"use client";

import { useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { toggleInterviewer } from "@/app/(app)/candidates/actions";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

type Member = Pick<User, "id" | "name" | "image" | "email">;

export function InterviewerPicker({
  candidateId,
  members,
  selectedIds,
}: {
  candidateId: string;
  members: Member[];
  selectedIds: string[];
}) {
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const selected = new Set(selectedIds);

  const filtered = members.filter((m) =>
    (m.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b p-4">
        <h3 className="text-sm font-semibold">Interviewers</h3>
        <p className="text-xs text-muted-foreground">
          Click a teammate to add or remove them as an interviewer for this candidate.
        </p>
      </div>
      <div className="p-4">
        <Input
          placeholder="Search team…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-3"
        />
        <ul className="divide-y">
          {filtered.map((m) => {
            const active = selected.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => start(async () => toggleInterviewer(candidateId, m.id))}
                  className="flex w-full items-center justify-between gap-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={m.name} image={m.image} size={28} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name ?? m.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {active ? "Interviewing" : "Add"}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No teammates match.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
