import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "ADMIN" | "MEMBER" }).role ?? "MEMBER";
      }
      return session;
    },
  },
});

export function isAdmin(role?: string) {
  return role === "ADMIN";
}

/**
 * Get a valid Google access token for the given user ID.
 * Refreshes the token automatically if it's expired.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account) return null;

  // If the token hasn't expired, return it directly.
  if (account.expires_at && account.expires_at * 1000 > Date.now()) {
    return account.access_token ?? null;
  }

  // Token expired — refresh it.
  if (!account.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  // Persist the refreshed token.
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    },
  });

  return data.access_token;
}
