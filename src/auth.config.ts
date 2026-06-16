import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types/enums";

// Edge-safe config — no Node.js modules, no Prisma, no pg
// Used in middleware to verify session token (JWT)
export const authConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      if (path.startsWith("/account") || path.startsWith("/master") || path.startsWith("/admin")) {
        if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));
        const role = (auth?.user as { role?: string })?.role ?? "CLIENT";
        if (path.startsWith("/admin") && role !== "ADMIN")
          return Response.redirect(new URL("/", nextUrl));
        if (path.startsWith("/master") && !["MASTER", "ADMIN"].includes(role))
          return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = ((token.role as string) ?? "CLIENT") as Role;
      }
      return session;
    },
  },
};
