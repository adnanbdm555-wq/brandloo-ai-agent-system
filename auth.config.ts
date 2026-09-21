import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the auth config — no Credentials provider, no DB
// import, so this is safe to use from middleware.ts (which runs on the
// Edge runtime and can't bundle `pg` or Node's `crypto`).
export const authConfig: NextAuthConfig = {
  // Required for self-hosted deploys (Vercel sets this automatically, but
  // Docker/VPS/other hosts need it) — see https://errors.authjs.dev#untrustedhost
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = [
        "/dashboard",
        "/brands",
        "/campaigns",
        "/content-studio",
        "/creative-studio",
        "/video-studio",
        "/content-calendar",
        "/approvals",
        "/publishing",
        "/analytics",
        "/insights",
        "/notifications",
        "/users",
        "/templates",
        "/automation",
        "/pipeline",
        "/agents",
        "/billing",
        "/platform-admin",
      ];
      const isProtected = protectedPrefixes.some((p) =>
        request.nextUrl.pathname.startsWith(p)
      );
      return !isProtected || isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
        token.agencyId = (user as { agencyId: string }).agencyId;
        token.isPlatformAdmin = (user as { isPlatformAdmin: boolean }).isPlatformAdmin;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.agencyId = token.agencyId as string;
        session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
      }
      return session;
    },
  },
};
