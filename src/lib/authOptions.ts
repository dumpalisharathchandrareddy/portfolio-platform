import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const adminEmails =
  process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean) ?? [];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/admin/signin",
  },

  callbacks: {
    async signIn({ user }) {
      return !!user.email && adminEmails.includes(user.email.toLowerCase());
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};