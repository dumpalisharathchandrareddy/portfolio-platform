export function AvatarFallback({
  name,
  src,
  size = 40,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
}) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "SC";

  const dim = `${size}px`;

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Profile"}
        className="rounded-full border object-cover"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      className="rounded-full border flex items-center justify-center font-semibold bg-muted text-foreground"
      style={{ width: dim, height: dim }}
      aria-label={name ?? "Profile"}
      title={name ?? "Profile"}
    >
      {initials}
    </div>
  );
}