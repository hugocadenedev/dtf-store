"use client";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/50">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} DTF Store. Tous droits reserves.
        </p>
        <div className="flex gap-6">
          {["CGV", "Mentions legales", "Contact"].map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
