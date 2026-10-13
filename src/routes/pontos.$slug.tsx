import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Flag, Globe, Mail, MapPin, MessageCircle, Navigation, Phone, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell } from "@/components/site/Layout";
import { LazyMap } from "@/components/site/LazyMap";
import { LogoMark } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { materialsQuery, pointQuery } from "@/lib/queries";
import { PRICING_LABEL, TYPE_LABEL, directionsUrl, fullAddress } from "@/lib/points";

export const Route = createFileRoute("/pontos/$slug")({
  loader: async ({ context, params }) => {
    const [point] = await Promise.all([
      context.queryClient.ensureQueryData(pointQuery(params.slug)),
      context.queryClient.ensureQueryData(materialsQuery),
    ]);
    if (!point) throw notFound();
    return { image: point.image_url, name: point.name, type: TYPE_LABEL[point.type], city: point.city, description: point.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — ${loaderData.type} em ${loaderData.city} | Recicla, Uai!` : "Ponto de coleta | Recicla, Uai!";
    const desc = loaderData?.description?.slice(0, 155) ?? "Materiais aceitos, endereço, horários e contato deste ponto de reciclagem.";
    return {
      meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(loaderData?.image?.startsWith("https://") ? [{ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-forest">Local não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Ele pode ter saído do ar ou ainda estar em revisão.</p>
        <Link to="/encontrar" className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Ver outros pontos</Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell><div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Erro ao carregar</h1><p className="mt-2 text-muted-foreground">{(error as Error).message}</p></div></PageShell>
  ),
  component: PointPage,
});

function PointPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(pointQuery(slug));
  const { data: materials } = useSuspenseQuery(materialsQuery);
  const [reporting, setReporting] = useState(false);
  if (!p) return null;
  const name = new Map(materials.map((m) => [m.id, m.name]));
  const yes = p.point_materials.filter((m) => m.accepted);
  const no = p.point_materials.filter((m) => !m.accepted);
  const wa = p.whatsapp?.replace(/\D/g, "");
  const conditions = [
    ["Limpeza", p.cond_cleaning], ["Embalagem", p.cond_packaging], ["Quantidade mínima", p.cond_min_quantity],
    ["Custos", p.cond_costs], ["Agendamento", p.cond_scheduling],
  ].filter(([, v]) => v) as [string, string][];
  const contactHref = wa ? `https://wa.me/55${wa.replace(/^55/, "")}` : p.phone ? `tel:${p.phone.replace(/\D/g, "")}` : p.email ? `mailto:${p.email}` : null;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/encontrar" className="text-sm font-semibold text-primary hover:underline">← Voltar para a busca</Link>
        {p.is_demo && (
          <p role="note" className="mt-4 rounded-xl border-2 border-dashed border-sun bg-sun/15 px-4 py-3 text-sm font-semibold">Demonstração — local fictício. Não vá até lá, ele não existe!</p>
        )}
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-3xl bg-secondary">
              {p.image_url ? (
                <img src={p.image_url} alt={`Foto de ${p.name}`} className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center hero-pattern"><LogoMark className="h-20 w-20 opacity-80" /></div>
              )}
            </div>
            <span className="mt-6 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-forest">{TYPE_LABEL[p.type]}</span>
            <h1 className="mt-2 text-3xl font-extrabold text-forest sm:text-4xl">{p.name}</h1>
            {p.description && <p className="mt-3 text-lg text-muted-foreground">{p.description}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-forest"><Navigation className="h-5 w-5" />Como chegar</a>
              {contactHref && <a href={contactHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border-2 border-info px-5 py-3 font-semibold text-info hover:bg-info hover:text-info-foreground"><MessageCircle className="h-5 w-5" />Entrar em contato</a>}
              <button onClick={() => setReporting(!reporting)} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold hover:border-destructive"><Flag className="h-5 w-5" />Informar dados incorretos</button>
            </div>
            {reporting && <ReportForm pointId={p.id} onDone={() => setReporting(false)} />}

            <section className="mt-8 rounded-2xl bg-card p-6 shadow-soft">
              <h2 className="text-xl font-bold">Materiais</h2>
              {yes.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {yes.map((m) => <li key={m.material_id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-forest"><CheckCircle2 className="h-4 w-4" />{name.get(m.material_id)}</li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">Materiais aceitos ainda não confirmados.</p>}
              {no.length > 0 && (
                <>
                  <h3 className="mt-5 text-sm font-semibold">Não aceita</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {no.map((m) => <li key={m.material_id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"><XCircle className="h-4 w-4" />{name.get(m.material_id)}</li>)}
                  </ul>
                </>
              )}
            </section>

            {(conditions.length > 0 || p.offers_pickup || p.pricing !== "nao_informado") && (
              <section className="mt-6 rounded-2xl bg-card p-6 shadow-soft">
                <h2 className="text-xl font-bold">Condições de recebimento</h2>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {conditions.map(([k, v]) => <div key={k}><dt className="text-sm font-semibold">{k}</dt><dd className="text-sm text-muted-foreground">{v}</dd></div>)}
                  <div><dt className="text-sm font-semibold">Modalidade</dt><dd className="text-sm text-muted-foreground">{[p.accepts_dropoff && "Entrega no local", p.offers_pickup && "Faz retirada"].filter(Boolean).join(" e ")}</dd></div>
                  {p.pricing !== "nao_informado" && <div><dt className="text-sm font-semibold">Valor</dt><dd className="text-sm text-muted-foreground">{PRICING_LABEL[p.pricing]}{p.pricing_notes ? ` — ${p.pricing_notes}` : ""}</dd></div>}
                </dl>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span>{fullAddress(p)}</span></li>
                {p.hours && <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><span className="whitespace-pre-line">{p.hours}</span></li>}
                {p.phone && <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary" /><a href={`tel:${p.phone.replace(/\D/g, "")}`} className="hover:underline">{p.phone}</a></li>}
                {wa && <li className="flex gap-3"><MessageCircle className="h-5 w-5 shrink-0 text-primary" /><a href={`https://wa.me/55${wa.replace(/^55/, "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp {p.whatsapp}</a></li>}
                {p.cnpj && <li className="flex gap-3"><span className="w-5 shrink-0 text-xs font-bold text-primary">CNPJ</span><span>{p.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</span></li>}
                {p.email && <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-primary" /><a href={`mailto:${p.email}`} className="hover:underline">{p.email}</a></li>}
                {p.website && <li className="flex gap-3"><Globe className="h-5 w-5 shrink-0 text-primary" /><a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="break-all hover:underline">{p.website}</a></li>}
              </ul>
            </div>
            {p.lat != null && p.lng != null && <div className="h-72"><LazyMap points={[p]} materials={materials} /></div>}
            <p className="text-xs text-muted-foreground">Última atualização: {new Date(p.updated_at).toLocaleDateString("pt-BR")}. Antes de sair, confirme o recebimento!</p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

const reportSchema = z.object({
  message: z.string().trim().min(5, "Conte um pouco mais (mín. 5 caracteres)").max(1000),
  contact: z.string().trim().max(200).optional(),
});

function ReportForm({ pointId, onDone }: { pointId: string; onDone: () => void }) {
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-3 rounded-2xl border bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = reportSchema.safeParse({ message, contact: contact || undefined });
        if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Dados inválidos"); return; }
        setBusy(true);
        const { error } = await supabase.from("reports").insert({ point_id: pointId, message: r.data.message, contact: r.data.contact ?? null });
        setBusy(false);
        if (error) { toast.error("Não foi possível enviar. Tente novamente."); return; }
        toast.success("Valeu! Vamos conferir as informações.");
        onDone();
      }}
    >
      <label className="block text-sm font-medium">O que está incorreto?
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background p-3" />
      </label>
      <label className="block text-sm font-medium">Seu contato (opcional)
        <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3" />
      </label>
      <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Enviando…" : "Enviar"}</button>
    </form>
  );
}
