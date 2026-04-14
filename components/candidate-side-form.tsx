"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateCandidate,
  archiveCandidate,
  replaceResume,
  setFollowUp,
} from "@/app/(app)/candidates/actions";

export function CandidateSideForm({
  id,
  defaults,
  positions,
}: {
  id: string;
  defaults: {
    name: string;
    positionId: string;
    email: string | null;
    source: string | null;
    websiteUrl: string | null;
    githubUrl: string | null;
    notes: string | null;
    followUpAt: Date | null;
    resumeUrl: string | null;
  };
  positions: { id: string; title: string }[];
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <form
        action={(fd) =>
          start(async () => {
            await updateCandidate(id, {
              name: (fd.get("name") as string) || defaults.name,
              positionId: (fd.get("positionId") as string) || defaults.positionId,
              email: (fd.get("email") as string) || null,
              source: (fd.get("source") as string) || null,
              websiteUrl: (fd.get("websiteUrl") as string) || null,
              githubUrl: (fd.get("githubUrl") as string) || null,
              notes: (fd.get("notes") as string) || null,
            });
          })
        }
        className="space-y-4 rounded-lg border bg-white p-4"
      >
        <h3 className="text-sm font-semibold">Profile</h3>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={defaults.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="positionId">Position</Label>
          <select
            id="positionId"
            name="positionId"
            defaultValue={defaults.positionId}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="source">Source</Label>
          <Input id="source" name="source" defaultValue={defaults.source ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input id="websiteUrl" name="websiteUrl" defaultValue={defaults.websiteUrl ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="githubUrl">GitHub</Label>
          <Input id="githubUrl" name="githubUrl" defaultValue={defaults.githubUrl ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} defaultValue={defaults.notes ?? ""} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} size="sm">
            Save
          </Button>
        </div>
      </form>

      <div className="space-y-3 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Resume</h3>
        {defaults.resumeUrl ? (
          <a
            href={defaults.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md border bg-slate-50 p-3 text-sm underline-offset-2 hover:underline"
          >
            View current resume ↗
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">No resume uploaded yet.</p>
        )}
        <form action={(fd) => start(async () => replaceResume(id, fd))} className="space-y-2">
          <Input name="resume" type="file" accept=".pdf,application/pdf" required />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            Upload / replace
          </Button>
        </form>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Follow-up pool</h3>
        <p className="text-xs text-muted-foreground">
          Move this candidate to the follow-up pool with a target date.
        </p>
        <form
          action={(fd) =>
            start(async () => {
              const dateStr = fd.get("followUpAt") as string;
              const d = dateStr ? new Date(dateStr) : null;
              await setFollowUp(id, d);
            })
          }
          className="flex items-center gap-2"
        >
          <Input
            name="followUpAt"
            type="date"
            defaultValue={
              defaults.followUpAt
                ? new Date(defaults.followUpAt).toISOString().slice(0, 10)
                : ""
            }
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            Save
          </Button>
        </form>
      </div>

      <form
        action={() => start(async () => archiveCandidate(id))}
        className="rounded-lg border bg-white p-4"
      >
        <h3 className="text-sm font-semibold text-rose-700">Danger zone</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Archive this candidate (hidden from the pipeline).
        </p>
        <div className="mt-2">
          <Button type="submit" variant="destructive" size="sm" disabled={pending}>
            Archive
          </Button>
        </div>
      </form>
    </div>
  );
}
