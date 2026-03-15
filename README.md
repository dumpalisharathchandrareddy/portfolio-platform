# Portfolio Platform

Full-stack web platform built with Next.js 14, TypeScript, and Prisma ORM.
98% TypeScript codebase — type-safe from database to UI.

## Stack

- **Framework:** Next.js 14 — App Router, SSR, server components
- **Language:** TypeScript
- **Database ORM:** Prisma — type-safe queries, schema migrations
- **UI:** shadcn/ui + Tailwind CSS
- **Deployment:** Vercel with CI/CD pipeline

## Structure
```
src/
  app/          — Next.js App Router pages and layouts
  components/   — reusable UI components (shadcn/ui based)
  lib/          — shared utilities and helpers
prisma/
  schema.prisma — database schema
public/         — static assets
```

## How to run
```bash
git clone https://github.com/dumpalisharathchandrareddy/portfolio-platform
cd portfolio-platform
npm install

# set up environment
cp .env.example .env
# add your DATABASE_URL

# run prisma migrations
npx prisma migrate dev

# start dev server
npm run dev
# open http://localhost:3000
```

## Notes

Built with maintainability in mind — strict TypeScript throughout, 
Prisma keeps the database layer clean, shadcn/ui handles the component 
system without fighting against it.
