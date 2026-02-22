import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/signin" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      return !!email && adminEmails.includes(email);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };