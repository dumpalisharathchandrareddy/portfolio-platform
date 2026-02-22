export default function SiteFooter() {
  return (
    <footer className="border-t mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} — Built with Next.js + PostgreSQL</div>
          <div className="opacity-80">Dynamic, DB-driven portfolio CMS</div>
        </div>
      </div>
    </footer>
  );
}