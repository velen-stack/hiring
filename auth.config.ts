// Edge-safe auth config. Imported by middleware.
// Must NOT reference the Prisma adapter or anything Node-only.

import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "engram-lab.com")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && allowedDomains.includes(domain);
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          hd: allowedDomains[0],
          access_type: "offline",
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile, user }) {
      return isAllowedEmail(profile?.email ?? user?.email);
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname === "/favicon.ico";
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
