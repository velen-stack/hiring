import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function PoolPage() {
  const candidates = await prisma.candidate.findMany({
    where: { archived: false, stage: "FOLLOW_UP" },
    orderBy: [{ followUpAt: "asc" }, { updatedAt: "desc" }],
    include: {
      position: true,
      interviewers: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  const now = new Date();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Follow-up pool</h1>
        <p className="text-sm text-muted-foreground">
          Candidates to revisit later in the year. Sorted by follow-up date.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-white p-12 text-center text-sm text-muted-foreground">
          No one in the follow-up pool yet. From any candidate&apos;s page, use &ldquo;Follow-up pool&rdquo; to move them here.
        </p>
      ) : (
        <div className="rounded-lg border bg-white">
          <ul className="divide-y">
            {candidates.map((c) => {
              const overdue = c.followUpAt && new Date(c.followUpAt) < now;
              return (
                <li key={c.id}>
                  <Link
                    href={`/candidates/${c.id}`}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.position.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {c.interviewers.slice(0, 3).map((i) => (
                          <Avatar
                            key={i.user.id}
                            name={i.user.name}
                            image={i.user.image}
                            size={22}
                            className="ring-2 ring-white"
                          />
                        ))}
                      </div>
                      {c.followUpAt ? (
                        <Badge
                          className={
                            overdue
                              ? "border-rose-200 bg-rose-50 text-rose-800"
                              : "border-sky-200 bg-sky-50 text-sky-800"
                          }
                        >
                          {overdue ? "Overdue · " : ""}
                          {formatDistanceToNow(new Date(c.followUpAt), { addSuffix: true })}
                        </Badge>
                      ) : (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                          No date
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
