import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe middleware: uses authConfig only (no Prisma adapter).
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  const { pathname } = req.nextUrl;
  if (req.auth && pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
  // Unauthenticated routing is handled by `authorized` in auth.config + NextAuth's default redirect.
});

export const config = {
  matcher: ["/((?!.*\\.|api/auth/|_next/).*)"],
};
