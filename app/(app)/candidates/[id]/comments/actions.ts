"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  body: z.string().min(1).max(5000),
});

export async function addComment(candidateId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  const parsed = schema.parse({ body: formData.get("body") });
  await prisma.comment.create({
    data: {
      candidateId,
      authorId: session.user.id,
      body: parsed.body,
    },
  });
  revalidatePath(`/candidates/${candidateId}`);
}

export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing) return;
  if (existing.authorId !== session.user.id) throw new Error("Forbidden");
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/candidates/${existing.candidateId}`);
}
