import { prisma } from "@/lib/db";
import { DEPARTMENTS } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createPosition, togglePosition, deletePosition } from "@/app/(app)/positions/actions";

export default async function PositionsPage() {
  const positions = await prisma.position.findMany({
    orderBy: [{ status: "asc" }, { title: "asc" }],
    include: { _count: { select: { candidates: true } } },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Positions</h1>
        {positions.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">
            No positions yet. Create one to start adding candidates.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {positions.map((p) => {
              const dept = DEPARTMENTS.find((d) => d.key === p.department)?.label ?? p.department;
              return (
                <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{p.title}</p>
                      {p.status === "closed" ? (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-600">Closed</Badge>
                      ) : (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Open</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dept} · {p._count.candidates} candidate{p._count.candidates === 1 ? "" : "s"}
                    </p>
                    {p.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={togglePosition.bind(null, p.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        {p.status === "open" ? "Close" : "Reopen"}
                      </Button>
                    </form>
                    {p._count.candidates === 0 ? (
                      <form action={deletePosition.bind(null, p.id)}>
                        <Button type="submit" variant="ghost" size="sm" className="text-rose-700">
                          Delete
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside>
        <form action={createPosition} className="space-y-3 rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold">New position</h2>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Full-stack Engineer" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              name="department"
              required
              defaultValue="ENGINEERING"
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </aside>
    </div>
  );
}
