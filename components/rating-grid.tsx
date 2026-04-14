"use client";

import { useTransition } from "react";
import { FACETS } from "@/lib/domain";
import { Avatar } from "@/components/ui/avatar";
import type { Facet, Rating, User } from "@prisma/client";
import { upsertRating, clearRating } from "@/app/(app)/candidates/[id]/ratings/actions";

type RatingWithAuthor = Rating & {
  author: Pick<User, "id" | "name" | "image">;
};

export function RatingGrid({
  candidateId,
  currentUserId,
  ratings,
}: {
  candidateId: string;
  currentUserId: string;
  ratings: RatingWithAuthor[];
}) {
  // Group ratings by author
  const byAuthor = new Map<string, { author: RatingWithAuthor["author"]; map: Map<Facet, RatingWithAuthor> }>();
  for (const r of ratings) {
    if (!byAuthor.has(r.authorId)) byAuthor.set(r.authorId, { author: r.author, map: new Map() });
    byAuthor.get(r.authorId)!.map.set(r.facet, r);
  }

  const facetAverages = new Map<Facet, number>();
  for (const f of FACETS) {
    const vals = ratings.filter((r) => r.facet === f.key).map((r) => r.score);
    if (vals.length) facetAverages.set(f.key, vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const meHasRating = byAuthor.has(currentUserId);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <h3 className="text-sm font-semibold">Your ratings</h3>
          <p className="text-xs text-muted-foreground">
            {meHasRating ? "Update any facet below. One row per facet." : "Rate the candidate on each facet you feel qualified to judge."}
          </p>
        </div>
        <div className="divide-y">
          {FACETS.map((f) => (
            <MyRatingRow
              key={f.key}
              candidateId={candidateId}
              facet={f.key}
              label={f.label}
              blurb={f.blurb}
              current={byAuthor.get(currentUserId)?.map.get(f.key)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <h3 className="text-sm font-semibold">Team averages</h3>
          <p className="text-xs text-muted-foreground">Across everyone who has submitted a rating.</p>
        </div>
        <div className="divide-y">
          {FACETS.map((f) => {
            const avg = facetAverages.get(f.key);
            return (
              <div key={f.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.blurb}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold tabular-nums">
                    {avg !== undefined ? avg.toFixed(1) : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {ratings.filter((r) => r.facet === f.key).length} rater
                    {ratings.filter((r) => r.facet === f.key).length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {byAuthor.size > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h3 className="text-sm font-semibold">All ratings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="p-3 text-left font-medium">Interviewer</th>
                  {FACETS.map((f) => (
                    <th key={f.key} className="p-3 text-left font-medium">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(byAuthor.entries()).map(([userId, { author, map }]) => (
                  <tr key={userId} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={author.name} image={author.image} size={22} />
                        <span className="truncate">{author.name ?? "—"}</span>
                      </div>
                    </td>
                    {FACETS.map((f) => {
                      const r = map.get(f.key);
                      return (
                        <td key={f.key} className="p-3 tabular-nums">
                          {r ? r.score : <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MyRatingRow({
  candidateId,
  facet,
  label,
  blurb,
  current,
}: {
  candidateId: string;
  facet: Facet;
  label: string;
  blurb: string;
  current?: RatingWithAuthor;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{blurb}</p>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = current?.score === n;
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("facet", facet);
                  fd.set("score", String(n));
                  if (current?.notes) fd.set("notes", current.notes);
                  await upsertRating(candidateId, fd);
                })
              }
              className={`h-8 w-8 rounded-md border text-sm font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-slate-400"
              }`}
              aria-label={`Rate ${n}`}
            >
              {n}
            </button>
          );
        })}
        {current ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => clearRating(candidateId, facet))}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
