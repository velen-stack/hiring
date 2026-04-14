import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StageSelect } from "@/components/stage-select";
import { CommentThread } from "@/components/comment-thread";
import { RatingGrid } from "@/components/rating-grid";
import { InterviewerPicker } from "@/components/interviewer-picker";
import { CandidateSideForm } from "@/components/candidate-side-form";
import { stageMeta } from "@/lib/domain";

const TABS = [
  { key: "comments", label: "Comments" },
  { key: "ratings", label: "Ratings" },
  { key: "team", label: "Interviewers" },
];

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.key === tab)?.key ?? "comments";

  const session = await auth();
  if (!session?.user?.id) return null;

  const [candidate, positions, members] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id },
      include: {
        position: true,
        interviewers: {
          include: { user: { select: { id: true, name: true, image: true, email: true } } },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true, image: true } } },
        },
        ratings: {
          include: { author: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    prisma.position.findMany({ orderBy: { title: "asc" } }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true, email: true },
    }),
  ]);

  if (!candidate) return notFound();

  const meta = stageMeta(candidate.stage);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pipeline
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{candidate.name}</h1>
            <p className="text-sm text-muted-foreground">
              {candidate.position.title} · {candidate.email ?? "no email"}
              {candidate.source ? ` · ${candidate.source}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
              {meta.label}
            </span>
            <StageSelect candidateId={candidate.id} value={candidate.stage} />
          </div>
        </div>
        {(candidate.websiteUrl || candidate.githubUrl || candidate.resumeUrl) && (
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {candidate.resumeUrl ? (
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="underline">
                Resume
              </a>
            ) : null}
            {candidate.websiteUrl ? (
              <a href={candidate.websiteUrl} target="_blank" rel="noreferrer" className="underline">
                Website
              </a>
            ) : null}
            {candidate.githubUrl ? (
              <a href={candidate.githubUrl} target="_blank" rel="noreferrer" className="underline">
                GitHub
              </a>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <nav className="flex gap-2 border-b">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/candidates/${candidate.id}?tab=${t.key}`}
                className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                  activeTab === t.key
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {activeTab === "comments" && (
            <CommentThread
              candidateId={candidate.id}
              currentUserId={session.user.id as string}
              comments={candidate.comments}
            />
          )}
          {activeTab === "ratings" && (
            <RatingGrid
              candidateId={candidate.id}
              currentUserId={session.user.id as string}
              ratings={candidate.ratings}
            />
          )}
          {activeTab === "team" && (
            <InterviewerPicker
              candidateId={candidate.id}
              members={members}
              selectedIds={candidate.interviewers.map((i) => i.user.id)}
            />
          )}
        </div>

        <aside>
          <CandidateSideForm
            id={candidate.id}
            positions={positions}
            defaults={{
              name: candidate.name,
              positionId: candidate.positionId,
              email: candidate.email,
              source: candidate.source,
              websiteUrl: candidate.websiteUrl,
              githubUrl: candidate.githubUrl,
              notes: candidate.notes,
              followUpAt: candidate.followUpAt,
              resumeUrl: candidate.resumeUrl,
            }}
          />
        </aside>
      </div>
    </div>
  );
}
