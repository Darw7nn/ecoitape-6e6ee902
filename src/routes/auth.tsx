import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Recicla, Uai!" },
      { name: "description", content: "Acesso da equipe administrativa do Recicla, Uai!" },
      { property: "og:title", content: "Entrar — Recicla, Uai!" },
      { property: "og:description", content: "Área administrativa." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <PageShell>
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-3xl font-extrabold text-forest">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesso para a equipe que revisa os pontos.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const res = mode === "in"
              ? await supabase.auth.signInWithPassword({ email, password: pw })
              : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
            setBusy(false);
            if (res.error) { toast.error(res.error.message); return; }
            if (mode === "up" && !res.data.session) { toast.success("Confira seu e-mail para confirmar a conta."); return; }
            nav({ to: "/admin" });
          }}
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="h-11 w-full rounded-lg border border-input bg-card px-3" />
          <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Senha (mín. 8)" className="h-11 w-full rounded-lg border border-input bg-card px-3" />
          <button disabled={busy} className="h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-60">{mode === "in" ? "Entrar" : "Criar conta"}</button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm font-semibold text-primary hover:underline">
          {mode === "in" ? "Não tem conta? Criar" : "Já tenho conta"}
        </button>
      </div>
    </PageShell>
  );
}
