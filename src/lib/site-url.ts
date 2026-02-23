export function getBaseUrl() {
  // On Vercel (server-side)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Local dev or custom domain
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}