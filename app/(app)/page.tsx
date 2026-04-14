import Link from "next/link";
import { prisma } from "@/lib/db";
import { PIPELINE_STAGES, stageMeta, DEPARTMENTS } from "@/lib/domain";
import { CandidateCard } from "@/components/candidate-card";
import { Button } from "@/components/ui/button";
import type { Department, Stage } from "@prisma/client";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; position?: string }>;
}) {
  const params = await searchParams;
  const dept = params.dept as Department | undefined;
  const positionId = params.position || undefined;

  const [positions, candidates] = await Promise.all([
    prisma.position.findMany({
      where: { status: "open" },
      orderBy: { title: "asc" },
    }),
    prisma.candidate.findMany({
      where: {
        archived: false,
        stage: { in: PIPELINE_STAGES },
        ...(dept ? { position: { department: dept } } : {}),
        ...(positionId ? { positionId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        position: true,
        interviewers: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { comments: true, ratings: true } },
      },
    }),
  ]);

  const byStage = new Map<Stage, typeof candidates>();
  PIPELINE_STAGES.forEach((s) => byStage.set(s, []));
  for (const c of candidates) {
    const list = byStage.get(c.stage);
    if (list) list.push(c);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {candidates.length} active candidate{candidates.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filters currentDept={dept} currentPosition={positionId} positions={positions} />
          <Button asChild>
            <Link href="/candidates/new">+ New candidate</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex min-w-max gap-3">
          {PIPELINE_STAGES.map((s) => {
            const meta = stageMeta(s);
            const list = byStage.get(s) ?? [];
            return (
              <div key={s} className="w-72 shrink-0 rounded-lg bg-slate-50 p-2">
                <div className="mb-2 flex items-center justify-between px-1 py-1">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.length === 0 ? (
                    <p className="px-1 py-4 text-xs text-muted-foreground">No candidates.</p>
                  ) : (
                    list.map((c) => <CandidateCard key={c.id} c={c} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Filters({
  currentDept,
  currentPosition,
  positions,
}: {
  currentDept?: Department;
  currentPosition?: string;
  positions: { id: string; title: string; department: Department }[];
}) {
  return (
    <form className="flex items-center gap-2">
      <select
        name="dept"
        defaultValue={currentDept ?? ""}
        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
      >
        <option value="">All departments</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>
      <select
        name="position"
        defaultValue={currentPosition ?? ""}
        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
      >
        <option value="">All positions</option>
        {positions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" size="sm">
        Filter
      </Button>
    </form>
  );
}
