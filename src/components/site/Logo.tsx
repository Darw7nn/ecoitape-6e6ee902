import { Link } from "@tanstack/react-router";
import logoIcon from "@/assets/eco-itape-icon.png.asset.json";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img src={logoIcon.url} className={`${className} object-contain`} alt="" aria-hidden="true" />
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="EcoItape — página inicial">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold text-forest">EcoItape</span>
        <span className="text-xs text-muted-foreground">Seu descarte tem destino.</span>
      </span>
    </Link>
  );
}
