import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-safe NextAuth instance — used only to check whether a session
// exists on protected routes. The real Credentials/DB-backed config
// lives in auth.ts and never runs in this Edge context.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/brands/:path*",
    "/campaigns/:path*",
    "/content-studio/:path*",
    "/creative-studio/:path*",
    "/video-studio/:path*",
    "/content-calendar/:path*",
    "/approvals/:path*",
    "/publishing/:path*",
    "/analytics/:path*",
    "/insights/:path*",
    "/notifications/:path*",
    "/users/:path*",
    "/templates/:path*",
    "/automation/:path*",
    "/pipeline/:path*",
    "/agents/:path*",
    "/billing/:path*",
    "/platform-admin/:path*",
  ],
};
