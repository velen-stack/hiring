import Link from "next/link";
import { prisma } from "@/lib/db";
import { createCandidate } from "@/app/(app)/candidates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NewCandidatePage() {
  const positions = await prisma.position.findMany({
    where: { status: "open" },
    orderBy: { title: "asc" },
  });

  if (positions.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border bg-white p-6">
        <h1 className="text-lg font-semibold">You need a position first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create at least one open role before adding candidates.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/positions">Go to Positions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">New candidate</h1>
      <form action={createCandidate} className="mt-6 space-y-5 rounded-lg border bg-white p-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Jane Doe" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="positionId">Position *</Label>
          <select
            id="positionId"
            name="positionId"
            required
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select a position
            </option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="jane@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="source">Source</Label>
            <Input id="source" name="source" placeholder="Referral, LinkedIn, etc." />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input id="websiteUrl" name="websiteUrl" placeholder="https://" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input id="githubUrl" name="githubUrl" placeholder="https://github.com/..." />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="resume">Resume (PDF)</Label>
          <Input id="resume" name="resume" type="file" accept=".pdf,application/pdf" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild type="button">
            <Link href="/">Cancel</Link>
          </Button>
          <Button type="submit">Create candidate</Button>
        </div>
      </form>
    </div>
  );
}
