import Link from "next/link";

export default function PublicNav() {
  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Portfolio
        </Link>

        <nav className="flex gap-4 text-sm">
          <Link href="/projects" className="hover:underline">Projects</Link>
          <Link href="/skills" className="hover:underline">Skills</Link>
          <Link href="/experience" className="hover:underline">Experience</Link>
          <Link href="/certifications" className="hover:underline">Certifications</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </nav>
      </div>
    </header>
  );
}