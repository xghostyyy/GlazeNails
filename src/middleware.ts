import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Only run auth middleware on protected areas. Public pages (landing,
  // /services, /masters, /booking, /login, /register) skip the JWT decode
  // entirely, keeping them fast.
  matcher: ["/account/:path*", "/master/:path*", "/admin/:path*"],
};
