import { prisma } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "engram-lab.com")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
  });

  const slackConfigured = !!process.env.SLACK_BOT_TOKEN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Access control, integrations, and team.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Sign-in</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign-ins are restricted to the following email domains (configure via{" "}
          <code className="rounded bg-slate-100 px-1">ALLOWED_EMAIL_DOMAINS</code>):
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {allowedDomains.map((d) => (
            <Badge key={d} className="border-emerald-200 bg-emerald-50 text-emerald-700">
              @{d}
            </Badge>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold">Slack integration</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Phase 2: auto-sync <code>#hiring</code> and flag undocumented updates. Configure via{" "}
              <code className="rounded bg-slate-100 px-1">SLACK_BOT_TOKEN</code>,{" "}
              <code className="rounded bg-slate-100 px-1">SLACK_SIGNING_SECRET</code>, and{" "}
              <code className="rounded bg-slate-100 px-1">SLACK_HIRING_CHANNEL_ID</code>.
            </p>
          </div>
          <Badge
            className={
              slackConfigured
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {slackConfigured ? "Configured" : "Not configured"}
          </Badge>
        </div>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">Team</h2>
          <p className="text-xs text-muted-foreground">
            Everyone who has signed in. Becomes available as an interviewer on candidates.
          </p>
        </div>
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} image={u.image} />
                <div>
                  <p className="text-sm font-medium">{u.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <Badge className="border-slate-200 bg-slate-50 text-slate-700">{u.role}</Badge>
            </li>
          ))}
          {users.length === 0 ? (
            <li className="p-8 text-center text-sm text-muted-foreground">
              No users yet. You&apos;ll appear here after signing in.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
