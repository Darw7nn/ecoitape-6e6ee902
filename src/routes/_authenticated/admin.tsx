import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { TYPE_LABEL, geocode, fullAddress, type Material, type Point } from "@/lib/points";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Painel administrativo — Recicla, Uai!" },
      { name: "description", content: "Revisão e gestão dos pontos de coleta." },
      { property: "og:title", content: "Painel — Recicla, Uai!" },
      { property: "og:description", content: "Área restrita." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return !!data?.length;
    },
  });

  if (role.isLoading) return <PageShell><p className="p-12 text-center">Carregando…</p></PageShell>;
  if (!role.data)
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Sem acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sua conta ({user.email}) não é administradora. Se ainda não existe nenhum administrador, a primeira conta pode assumir o papel.</p>
          <button
            className="mt-5 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
            onClick={async () => {
              const { data, error } = await supabase.rpc("claim_first_admin");
              if (error || !data) { toast.error("Já existe um administrador. Peça acesso a ele."); return; }
              toast.success("Agora você é administrador.");
              qc.invalidateQueries({ queryKey: ["is-admin"] });
            }}
          >Tornar-me o primeiro administrador</button>
          <button className="mt-3 block w-full text-sm underline" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </PageShell>
    );
  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pendente" | "aprovado" | "inativo" | "reports">("pendente");
  const [editing, setEditing] = useState<Point | null>(null);
  const mats = useQuery({ queryKey: ["admin-mats"], queryFn: async () => (await supabase.from("materials").select("*").order("sort_order")).data as Material[] });
  const points = useQuery({
    queryKey: ["admin-points"],
    queryFn: async () => {
      const { data, error } = await supabase.from("points").select("*, point_materials(material_id, accepted)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as (Point & { submitter_name: string | null; submitter_contact: string | null })[];
    },
  });
  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => (await supabase.from("reports").select("*, points(name, slug)").eq("resolved", false).order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status: Point["status"]) => {
    const { error } = await supabase.from("points").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    qc.invalidateQueries();
  };

  const list = (points.data ?? []).filter((p) => p.status === tab);
  const tabs = [["pendente", "Pendentes"], ["aprovado", "Aprovados"], ["inativo", "Desativados"], ["reports", "Correções"]] as const;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-forest">Painel administrativo</h1>
          <button className="text-sm underline" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              {l} ({k === "reports" ? reports.data?.length ?? 0 : (points.data ?? []).filter((p) => p.status === k).length})
            </button>
          ))}
        </div>

        {tab === "reports" ? (
          <ul className="mt-6 space-y-3">
            {(reports.data ?? []).length === 0 && <p className="text-muted-foreground">Nenhuma correção pendente.</p>}
            {(reports.data ?? []).map((r: any) => (
              <li key={r.id} className="rounded-2xl bg-card p-5 shadow-soft">
                <p className="text-sm font-semibold">{r.points?.name}</p>
                <p className="mt-1">{r.message}</p>
                {r.contact && <p className="mt-1 text-sm text-muted-foreground">Contato: {r.contact}</p>}
                <button className="mt-3 text-sm font-semibold text-primary" onClick={async () => { await supabase.from("reports").update({ resolved: true }).eq("id", r.id); qc.invalidateQueries({ queryKey: ["admin-reports"] }); }}>Marcar como resolvida</button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-6 space-y-3">
            {points.isLoading && <p>Carregando…</p>}
            {list.length === 0 && !points.isLoading && <p className="text-muted-foreground">Nada por aqui.</p>}
            {list.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold">{p.name} {p.is_demo && <span className="ml-1 rounded bg-sun/30 px-1.5 text-xs">demo</span>}</p>
                  <p className="text-sm text-muted-foreground">{TYPE_LABEL[p.type]} · {fullAddress(p)}</p>
                  <p className="text-xs text-muted-foreground">{p.lat == null ? "⚠ Sem coordenadas" : `${p.lat.toFixed(4)}, ${p.lng?.toFixed(4)}`} {p.submitter_name && `· Enviado por ${p.submitter_name} (${p.submitter_contact})`}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditing(p)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Editar</button>
                  {p.status !== "aprovado" && <button onClick={() => setStatus(p.id, "aprovado")} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Aprovar</button>}
                  {p.status !== "inativo" && <button onClick={() => setStatus(p.id, "inativo")} className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive">Desativar</button>}
                  {p.status === "aprovado" && <Link to="/pontos/$slug" params={{ slug: p.slug }} className="rounded-lg border px-3 py-1.5 text-sm">Ver</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {editing && mats.data && <EditDialog point={editing} materials={mats.data} onClose={() => { setEditing(null); qc.invalidateQueries(); }} />}
      </div>
    </PageShell>
  );
}

const FIELDS: [keyof Point, string][] = [
  ["name", "Nome"], ["description", "Descrição"], ["image_url", "URL da foto"], ["street", "Rua"], ["number", "Número"],
  ["neighborhood", "Bairro"], ["city", "Cidade"], ["cep", "CEP"], ["phone", "Telefone"], ["whatsapp", "WhatsApp"],
  ["cnpj", "CNPJ"], ["email", "E-mail"], ["website", "Site"], ["hours", "Horários"], ["cond_cleaning", "Limpeza"], ["cond_packaging", "Embalagem"],
  ["cond_min_quantity", "Qtd. mínima"], ["cond_costs", "Custos"], ["cond_scheduling", "Agendamento"], ["pricing_notes", "Obs. sobre valores"],
];

function EditDialog({ point, materials, onClose }: { point: Point; materials: Material[]; onClose: () => void }) {
  const [f, setF] = useState<any>({ ...point });
  const [acc, setAcc] = useState<Record<string, boolean | undefined>>(Object.fromEntries(point.point_materials.map((m) => [m.material_id, m.accepted])));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { point_materials: _pm, id, created_at: _c, updated_at: _u, ...rest } = f;
    const payload = { ...rest, lat: f.lat === "" || f.lat == null ? null : Number(f.lat), lng: f.lng === "" || f.lng == null ? null : Number(f.lng) };
    const { error } = await supabase.from("points").update(payload).eq("id", id);
    if (error) { setBusy(false); { toast.error(error.message); return; } }
    await supabase.from("point_materials").delete().eq("point_id", id);
    const rows = Object.entries(acc).filter(([, v]) => v !== undefined).map(([material_id, accepted]) => ({ point_id: id, material_id, accepted: !!accepted }));
    if (rows.length) await supabase.from("point_materials").insert(rows);
    setBusy(false);
    toast.success("Salvo");
    onClose();
  };

  const locate = async () => {
    try {
      const r = await geocode([f.street, f.number, f.neighborhood, f.city, "SP", f.cep].filter(Boolean).join(", "));
      if (!r) { toast.error("Endereço não encontrado. Informe as coordenadas manualmente."); return; }
      setF({ ...f, lat: r[0], lng: r[1] });
      toast.success("Coordenadas preenchidas — confira no mapa após salvar.");
    } catch { toast.error("Serviço de endereços indisponível."); }
  };

  const inp = "mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-forest/60 p-4" role="dialog" aria-modal="true" aria-label="Editar ponto">
      <div className="w-full max-w-3xl rounded-2xl bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Editar ponto</h2><button onClick={onClose} className="text-sm underline">Fechar</button></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Tipo
            <select className={inp} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Valor
            <select className={inp} value={f.pricing} onChange={(e) => setF({ ...f, pricing: e.target.value })}>
              <option value="nao_informado">Não informado</option><option value="gratuito">Gratuito</option><option value="compra">Compra</option><option value="cobra">Cobra</option>
            </select>
          </label>
          {FIELDS.map(([k, l]) => (
            <label key={k} className="text-sm font-medium">{l}<input className={inp} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value || null })} /></label>
          ))}
          <label className="text-sm font-medium">Latitude<input className={inp} value={f.lat ?? ""} onChange={(e) => setF({ ...f, lat: e.target.value })} /></label>
          <label className="text-sm font-medium">Longitude<input className={inp} value={f.lng ?? ""} onChange={(e) => setF({ ...f, lng: e.target.value })} /></label>
          <button type="button" onClick={locate} className="rounded-lg border-2 border-info px-3 py-2 text-sm font-semibold text-info sm:col-span-2">Buscar coordenadas pelo endereço</button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.accepts_dropoff} onChange={(e) => setF({ ...f, accepts_dropoff: e.target.checked })} />Entrega no local</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.offers_pickup} onChange={(e) => setF({ ...f, offers_pickup: e.target.checked })} />Faz retirada</label>
        </div>
        <h3 className="mt-6 font-bold">Materiais <span className="text-xs font-normal text-muted-foreground">(clique: aceita → não aceita → sem informação)</span></h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {materials.map((m) => {
            const v = acc[m.id];
            const next = v === undefined ? true : v ? false : undefined;
            return (
              <button key={m.id} type="button" onClick={() => setAcc({ ...acc, [m.id]: next })}
                className={`rounded-full border px-2.5 py-1 text-xs ${v === true ? "border-primary bg-primary text-primary-foreground" : v === false ? "border-destructive text-destructive line-through" : ""}`}>
                {m.name}
              </button>
            );
          })}
        </div>
        <button disabled={busy} onClick={save} className="mt-6 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}
