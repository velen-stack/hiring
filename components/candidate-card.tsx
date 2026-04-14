import Link from "next/link";
import type { Candidate, Position, User } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type InterviewerUser = Pick<User, "id" | "name" | "image">;

export function CandidateCard({
  c,
}: {
  c: Candidate & {
    position: Position;
    interviewers: { user: InterviewerUser }[];
    _count?: { comments: number; ratings: number };
  };
}) {
  return (
    <Link
      href={`/candidates/${c.id}`}
      className="block rounded-md border bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          <p className="truncate text-xs text-muted-foreground">{c.position.title}</p>
        </div>
        {c.followUpAt ? (
          <Badge className="border-sky-200 bg-sky-50 text-sky-800">
            Follow&nbsp;
            {new Date(c.followUpAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {c.interviewers.slice(0, 4).map((i) => (
            <Avatar
              key={i.user.id}
              name={i.user.name}
              image={i.user.image}
              size={20}
              className="ring-2 ring-white"
            />
          ))}
          {c.interviewers.length > 4 ? (
            <span className="ml-1 inline-flex h-5 items-center rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-600">
              +{c.interviewers.length - 4}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {c._count?.comments ? <span>{c._count.comments} 💬</span> : null}
          {c._count?.ratings ? <span>{c._count.ratings} ★</span> : null}
        </div>
      </div>
    </Link>
  );
}
