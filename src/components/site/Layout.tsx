import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/encontrar", label: "Encontrar pontos" },
  { to: "/materiais", label: "Materiais" },
  { to: "/como-funciona", label: "Como funciona" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const linkCls =
    "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: "border-primary text-primary" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
          <Link to="/cadastrar" className="ml-3 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-forest-foreground transition hover:bg-primary">
            Cadastrar um ponto
          </Link>
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t px-4 py-3 md:hidden" aria-label="Principal móvel">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link to="/cadastrar" className="mt-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground" onClick={() => setOpen(false)}>
            Cadastrar um ponto
          </Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-forest text-forest-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-extrabold">Recicla, Uai!</p>
          <p className="mt-2 text-sm opacity-80">Seu descarte tem destino. Coleta seletiva e reciclagem em Itapetininga–SP e região.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Navegue</p>
          <ul className="mt-2 space-y-1 opacity-85">
            <li><Link to="/encontrar" className="hover:underline">Encontrar pontos</Link></li>
            <li><Link to="/materiais" className="hover:underline">Materiais</Link></li>
            <li><Link to="/como-funciona" className="hover:underline">Como funciona</Link></li>
            <li><Link to="/cadastrar" className="hover:underline">Cadastrar um ponto</Link></li>
          </ul>
        </div>
        <div className="text-sm opacity-85">
          <p className="font-semibold">Antes de sair, confirme o recebimento!</p>
          <p className="mt-2">As informações são enviadas pelos próprios locais e revisadas antes da publicação.</p>
          <Link to="/admin" className="mt-3 inline-block underline opacity-70">Área administrativa</Link>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-page flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
