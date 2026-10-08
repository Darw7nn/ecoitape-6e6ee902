import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { materialsQuery } from "@/lib/queries";
import { TYPE_LABEL, type PointType } from "@/lib/points";

export const Route = createFileRoute("/cadastrar")({
  head: () => ({
    meta: [
      { title: "Cadastrar um ponto de reciclagem — Recicla, Uai!" },
      { name: "description", content: "Cadastre gratuitamente sua empresa, cooperativa, ecoponto ou ponto de coleta em Itapetininga e região." },
      { property: "og:title", content: "Cadastre seu ponto — Recicla, Uai!" },
      { property: "og:description", content: "Ajude Itapetininga a reciclar mais. Cadastro gratuito e revisado." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(materialsQuery),
  component: Register,
});

const opt = z.string().trim().max(500).optional().or(z.literal(""));
const schema = z.object({
  name: z.string().trim().min(2, "Informe o nome do local").max(150),
  type: z.enum(["empresa", "cooperativa", "ecoponto", "ponto_coleta"]),
  description: z.string().trim().max(2000).optional(),
  street: z.string().trim().min(2, "Informe a rua").max(200),
  number: z.string().trim().max(20).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  cep: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.string().trim().email("E-mail inválido").max(200).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional(),
  hours: opt,
  cond_cleaning: opt, cond_packaging: opt, cond_min_quantity: opt, cond_costs: opt, cond_scheduling: opt,
  pricing: z.enum(["gratuito", "compra", "cobra", "nao_informado"]),
  submitter_name: z.string().trim().min(2, "Informe seu nome").max(150),
  submitter_contact: z.string().trim().min(5, "Informe um contato para a revisão").max(200),
});

function Register() {
  const { data: materials } = useSuspenseQuery(materialsQuery);
  const [mats, setMats] = useState<string[]>([]);
  const [dropoff, setDropoff] = useState(true);
  const [pickup, setPickup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const groups = Array.from(new Set(materials.map((m) => m.group_name)));
  const input = "mt-1 h-11 w-full rounded-lg border border-input bg-background px-3";

  if (done)
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 text-3xl font-extrabold text-forest">Cadastro enviado!</h1>
          <p className="mt-2 text-muted-foreground">Ele fica pendente de revisão e aparece no mapa assim que for aprovado. Valeu por ajudar!</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Voltar ao início</Link>
        </div>
      </PageShell>
    );

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-extrabold text-forest">Cadastrar um ponto</h1>
        <p className="mt-2 text-muted-foreground">Cadastro gratuito. Tudo passa por revisão antes de aparecer. Preencha só o que for verdade — campo vazio a gente esconde.</p>
        <form
          className="mt-8 space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
            const r = schema.safeParse(raw);
            if (!r.success) return toast.error(r.error.issues[0].message);
            if (!mats.length) return toast.error("Selecione ao menos um material aceito");
            setBusy(true);
            const { error } = await supabase.rpc("submit_point", {
              p: { ...r.data, accepts_dropoff: dropoff, offers_pickup: pickup },
              mats,
            });
            setBusy(false);
            if (error) return toast.error("Não foi possível enviar: " + error.message);
            setDone(true);
          }}
        >
          <section className="space-y-4 rounded-2xl bg-card p-6 shadow-soft">
            <h2 className="text-xl font-bold">O local</h2>
            <F name="name" label="Nome *" required maxLength={150} />
            <label className="block text-sm font-medium">Tipo *
              <select name="type" className={input} defaultValue="ponto_coleta">
                {(Object.keys(TYPE_LABEL) as PointType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Descrição
              <textarea name="description" maxLength={2000} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background p-3" />
            </label>
          </section>
          <section className="grid gap-4 rounded-2xl bg-card p-6 shadow-soft sm:grid-cols-2">
            <h2 className="text-xl font-bold sm:col-span-2">Endereço</h2>
            <F name="street" label="Rua *" required />
            <F name="number" label="Número" />
            <F name="neighborhood" label="Bairro" />
            <F name="city" label="Cidade *" defaultValue="Itapetininga" required />
            <F name="cep" label="CEP" inputMode="numeric" />
          </section>
          <section className="grid gap-4 rounded-2xl bg-card p-6 shadow-soft sm:grid-cols-2">
            <h2 className="text-xl font-bold sm:col-span-2">Contato e horários</h2>
            <F name="phone" label="Telefone" type="tel" />
            <F name="whatsapp" label="WhatsApp" type="tel" />
            <F name="email" label="E-mail" type="email" />
            <F name="website" label="Site" />
            <label className="block text-sm font-medium sm:col-span-2">Horários
              <textarea name="hours" maxLength={500} rows={2} placeholder="Ex.: Seg a sex, 8h às 17h" className="mt-1 w-full rounded-lg border border-input bg-background p-3" />
            </label>
          </section>
          <section className="space-y-4 rounded-2xl bg-card p-6 shadow-soft">
            <h2 className="text-xl font-bold">Materiais aceitos *</h2>
            {groups.map((g) => (
              <div key={g}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {materials.filter((m) => m.group_name === g).map((m) => {
                    const on = mats.includes(m.id);
                    return (
                      <button type="button" key={m.id} aria-pressed={on} onClick={() => setMats(on ? mats.filter((x) => x !== m.id) : [...mats, m.id])}
                        className={`rounded-full border px-3 py-1 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{m.name}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
          <section className="grid gap-4 rounded-2xl bg-card p-6 shadow-soft sm:grid-cols-2">
            <h2 className="text-xl font-bold sm:col-span-2">Condições</h2>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={dropoff} onChange={(e) => setDropoff(e.target.checked)} />Recebe entrega no local</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={pickup} onChange={(e) => setPickup(e.target.checked)} />Faz retirada</label>
            <label className="block text-sm font-medium">Valor
              <select name="pricing" className={input} defaultValue="nao_informado">
                <option value="nao_informado">Não informar</option>
                <option value="gratuito">Recebe gratuitamente</option>
                <option value="compra">Compra o material</option>
                <option value="cobra">Cobra pelo recebimento</option>
              </select>
            </label>
            <F name="cond_cleaning" label="Limpeza exigida" />
            <F name="cond_packaging" label="Embalagem" />
            <F name="cond_min_quantity" label="Quantidade mínima" />
            <F name="cond_costs" label="Custos" />
            <F name="cond_scheduling" label="Agendamento" />
          </section>
          <section className="grid gap-4 rounded-2xl bg-card p-6 shadow-soft sm:grid-cols-2">
            <h2 className="text-xl font-bold sm:col-span-2">Quem está cadastrando</h2>
            <F name="submitter_name" label="Seu nome *" required />
            <F name="submitter_contact" label="Telefone ou e-mail para a revisão *" required />
            <p className="text-xs text-muted-foreground sm:col-span-2">Esse contato é usado só pela equipe de revisão e não é publicado.</p>
          </section>
          <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-soft hover:bg-forest disabled:opacity-60">
            {busy ? "Enviando…" : "Enviar para revisão"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function F({ name, label, ...rest }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium">{label}<input name={name} className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3" {...rest} /></label>
  );
}
