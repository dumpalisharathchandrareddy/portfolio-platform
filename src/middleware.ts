// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/signin",
  },
});

export const config = {
  // Protect /admin/* EXCEPT /admin/signin
  matcher: ["/admin/:path((?!signin).*)"],
};