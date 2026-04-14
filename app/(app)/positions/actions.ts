"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Department } from "@prisma/client";

const DEPARTMENTS = ["ENGINEERING", "BUSINESS_OPS", "RESEARCH", "OTHER"] as const;

async function requireUser() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthenticated");
  return s.user;
}

const createSchema = z.object({
  title: z.string().min(1),
  department: z.enum(DEPARTMENTS),
  description: z.string().optional(),
});

export async function createPosition(formData: FormData) {
  await requireUser();
  const parsed = createSchema.parse({
    title: formData.get("title"),
    department: formData.get("department"),
    description: formData.get("description") ?? undefined,
  });
  await prisma.position.create({
    data: {
      title: parsed.title,
      department: parsed.department as Department,
      description: parsed.description ?? null,
    },
  });
  revalidatePath("/positions");
  revalidatePath("/");
}

export async function togglePosition(id: string) {
  await requireUser();
  const p = await prisma.position.findUnique({ where: { id } });
  if (!p) return;
  await prisma.position.update({
    where: { id },
    data: { status: p.status === "open" ? "closed" : "open" },
  });
  revalidatePath("/positions");
  revalidatePath("/");
}

export async function deletePosition(id: string) {
  await requireUser();
  const count = await prisma.candidate.count({ where: { positionId: id } });
  if (count > 0) throw new Error("Position has candidates. Close it instead.");
  await prisma.position.delete({ where: { id } });
  revalidatePath("/positions");
  revalidatePath("/");
}
