import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 3c-7.2 0-13 5.6-13 12.6C7 25 20 37 20 37s13-12 13-21.4C33 8.6 27.2 3 20 3Z"
        className="fill-primary"
      />
      <path
        d="M14.5 19.5c0-5 4-8.5 11-8.5 0 6.8-3.6 10.5-8.6 10.5-.9 0-1.7-.1-2.4-.4"
        className="fill-primary-foreground"
      />
      <path d="M14 23c2.5-3.5 5.5-6 9-7.5" className="stroke-primary" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="29" cy="9" r="3" className="fill-sun" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Recicla, Uai! — página inicial">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold text-forest">Recicla, Uai!</span>
        <span className="text-xs text-muted-foreground">Seu descarte tem destino.</span>
      </span>
    </Link>
  );
}
