"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, getGoogleAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storeFile, deleteFile } from "@/lib/storage";
import type { Stage } from "@prisma/client";

const STAGES = [
  "TOP_OF_FUNNEL",
  "REACHED_OUT",
  "SCREENING",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "OFFER_ACCEPTED",
  "REJECTED",
  "FOLLOW_UP",
] as const;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");
  return session.user as { id: string; email?: string | null };
}

async function requireToken(userId: string) {
  const token = await getGoogleAccessToken(userId);
  if (!token) throw new Error("No Google access token available. Please re-sign in.");
  return token;
}

const createSchema = z.object({
  name: z.string().min(1),
  positionId: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  source: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  githubUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  notes: z.string().optional(),
});

export async function createCandidate(formData: FormData) {
  const user = await requireUser();
  const parsed = createSchema.parse({
    name: formData.get("name"),
    positionId: formData.get("positionId"),
    email: formData.get("email") ?? "",
    source: formData.get("source") ?? undefined,
    websiteUrl: formData.get("websiteUrl") ?? "",
    githubUrl: formData.get("githubUrl") ?? "",
    notes: formData.get("notes") ?? undefined,
  });

  let resumeUrl: string | undefined;
  let resumeKey: string | undefined;
  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    const token = await requireToken(user.id);
    const stored = await storeFile(resume, token);
    resumeUrl = stored.url;
    resumeKey = stored.key;
  }

  const candidate = await prisma.candidate.create({
    data: {
      ...parsed,
      resumeUrl,
      resumeKey,
      createdById: user.id,
    },
  });

  revalidatePath("/");
  redirect(`/candidates/${candidate.id}`);
}

export async function updateCandidate(id: string, data: Partial<{
  name: string;
  positionId: string;
  email: string | null;
  source: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  notes: string | null;
  followUpAt: Date | null;
  archived: boolean;
}>) {
  await requireUser();
  await prisma.candidate.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath(`/candidates/${id}`);
  revalidatePath("/pool");
}

export async function updateStage(id: string, stage: Stage) {
  await requireUser();
  if (!STAGES.includes(stage)) throw new Error("Invalid stage");
  await prisma.candidate.update({
    where: { id },
    data: {
      stage,
      ...(stage !== "FOLLOW_UP" ? { followUpAt: null } : {}),
    },
  });
  revalidatePath("/");
  revalidatePath(`/candidates/${id}`);
  revalidatePath("/pool");
}

export async function setFollowUp(id: string, date: Date | null) {
  await requireUser();
  await prisma.candidate.update({
    where: { id },
    data: {
      stage: "FOLLOW_UP",
      followUpAt: date,
    },
  });
  revalidatePath("/");
  revalidatePath(`/candidates/${id}`);
  revalidatePath("/pool");
}

export async function replaceResume(id: string, formData: FormData) {
  const user = await requireUser();
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return;

  const token = await requireToken(user.id);
  const existing = await prisma.candidate.findUnique({ where: { id }, select: { resumeKey: true } });
  const stored = await storeFile(file, token);
  await prisma.candidate.update({
    where: { id },
    data: { resumeUrl: stored.url, resumeKey: stored.key },
  });
  if (existing?.resumeKey) await deleteFile(existing.resumeKey, token);
  revalidatePath(`/candidates/${id}`);
}

export async function archiveCandidate(id: string) {
  await requireUser();
  await prisma.candidate.update({ where: { id }, data: { archived: true } });
  revalidatePath("/");
  redirect("/");
}

export async function toggleInterviewer(candidateId: string, userId: string) {
  await requireUser();
  const existing = await prisma.interviewer.findUnique({
    where: { candidateId_userId: { candidateId, userId } },
  });
  if (existing) {
    await prisma.interviewer.delete({
      where: { candidateId_userId: { candidateId, userId } },
    });
  } else {
    await prisma.interviewer.create({ data: { candidateId, userId } });
  }
  revalidatePath(`/candidates/${candidateId}`);
}
