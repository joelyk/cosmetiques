import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "@/lib/env";
import { getUserRole } from "@/lib/roles";

const providers = env.hasGoogleAuth
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    ]
  : [];

const config: NextAuthConfig = {
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      const email = user?.email ?? token.email;
      token.role = getUserRole(email);
      return token;
    },
    session({ session, token }) {
      session.user.role = getUserRole(token.email);
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
