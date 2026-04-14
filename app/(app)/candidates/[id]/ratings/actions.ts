"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Facet } from "@prisma/client";

const FACETS = [
  "TECHNICAL",
  "EXECUTIVE_PRESENCE",
  "SENIORITY",
  "PROBLEM_SOLVING",
  "CULTURE",
] as const;

const schema = z.object({
  facet: z.enum(FACETS),
  score: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(2000).optional(),
});

export async function upsertRating(candidateId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  const parsed = schema.parse({
    facet: formData.get("facet"),
    score: formData.get("score"),
    notes: formData.get("notes") ?? undefined,
  });
  const facet = parsed.facet as Facet;

  await prisma.rating.upsert({
    where: {
      candidateId_authorId_facet: {
        candidateId,
        authorId: session.user.id,
        facet,
      },
    },
    update: { score: parsed.score, notes: parsed.notes ?? null },
    create: {
      candidateId,
      authorId: session.user.id,
      facet,
      score: parsed.score,
      notes: parsed.notes ?? null,
    },
  });
  revalidatePath(`/candidates/${candidateId}`);
}

export async function clearRating(candidateId: string, facet: Facet) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  await prisma.rating.deleteMany({
    where: { candidateId, authorId: session.user.id, facet },
  });
  revalidatePath(`/candidates/${candidateId}`);
}
