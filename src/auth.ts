import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, account }) {
      // Without a database adapter, Auth.js creates a new user ID each sign-in.
      // The verified provider account ID gives location ownership a stable identity.
      if (account?.provider === "github") {
        token.sub = `github:${account.providerAccountId}`;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      return session;
    },
  },
});
