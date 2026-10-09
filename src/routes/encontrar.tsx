import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { List, LocateFixed, Map as MapIcon, MapPin, Navigation, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { LazyMap } from "@/components/site/LazyMap";
import { materialsQuery, pointsQuery } from "@/lib/queries";
import {
  PRICING_LABEL, TYPE_LABEL, acceptedIds, directionsUrl, distanceKm, formatKm, geocode, matchesMaterials,
  type MatchMode, type Point, type PointType, type Pricing,
} from "@/lib/points";

const searchSchema = z.object({
  m: z.array(z.string()).optional().catch(undefined),
  q: z.string().max(200).optional().catch(undefined),
  loc: z.number().optional().catch(undefined),
});

export const Route = createFileRoute("/encontrar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Encontrar pontos de reciclagem — Recicla, Uai!" },
      { name: "description", content: "Mapa e lista de empresas, cooperativas e ecopontos que recebem recicláveis em Itapetininga–SP e região." },
      { property: "og:title", content: "Encontrar pontos de reciclagem — Recicla, Uai!" },
      { property: "og:description", content: "Filtre por material, bairro e tipo de local e veja o mais próximo de você." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(materialsQuery), context.queryClient.ensureQueryData(pointsQuery)]),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Não conseguimos carregar os pontos</h1>
        <p className="mt-2 text-muted-foreground">{(error as Error).message}</p>
      </div>
    </PageShell>
  ),
  component: Find,
});

type GeoState = "idle" | "loading" | "denied" | "error" | "notfound" | "ok";

function Find() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/encontrar" });
  const { data: materials } = useSuspenseQuery(materialsQuery);
  const { data: allPoints } = useSuspenseQuery(pointsQuery);

  const [showDemo, setShowDemo] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(search.m ?? []);
  const [mode, setMode] = useState<MatchMode>("any");
  const [city, setCity] = useState("");
  const [hood, setHood] = useState("");
  const [types, setTypes] = useState<PointType[]>([]);
  const [modality, setModality] = useState<"" | "dropoff" | "pickup">("");
  const [pricing, setPricing] = useState<"" | Pricing>("");
  const [sortNear, setSortNear] = useState(false);
  const [address, setAddress] = useState(search.q ?? "");
  const [ref, setRef] = useState<[number, number] | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [active, setActive] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => setSelected(search.m ?? []), [search.m]);

  const realPoints = allPoints.filter((p) => !p.is_demo);
  const base = showDemo ? allPoints.filter((p) => p.is_demo) : realPoints;

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { setGeo("error"); return; }
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRef([pos.coords.latitude, pos.coords.longitude]);
        setGeo("ok");
        setSortNear(true);
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const searchAddress = async (value = address) => {
    if (!value.trim()) return;
    setGeo("loading");
    try {
      const r = await geocode(value.trim());
      if (!r) { setGeo("notfound"); return; }
      setRef(r);
      setGeo("ok");
      setSortNear(true);
    } catch {
      setGeo("error");
    }
  };

  useEffect(() => {
    if (search.loc) useMyLocation();
    else if (search.q) void searchAddress(search.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = Array.from(new Set(base.map((p) => p.city))).sort();
  const hoods = Array.from(new Set(base.filter((p) => !city || p.city === city).map((p) => p.neighborhood).filter(Boolean) as string[])).sort();

  const results = useMemo(() => {
    const n = name.trim().toLowerCase();
    let list = base
      .filter((p) => !n || p.name.toLowerCase().includes(n))
      .filter((p) => matchesMaterials(p, selected, mode))
      .filter((p) => !city || p.city === city)
      .filter((p) => !hood || p.neighborhood === hood)
      .filter((p) => !types.length || types.includes(p.type))
      .filter((p) => !modality || (modality === "dropoff" ? p.accepts_dropoff : p.offers_pickup))
      .filter((p) => !pricing || p.pricing === pricing)
      .map((p) => ({ p, d: ref && p.lat != null && p.lng != null ? distanceKm(ref, [p.lat, p.lng]) : null }));
    if (sortNear && ref) list = list.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
    return list;
  }, [base, name, selected, mode, city, hood, types, modality, pricing, ref, sortNear]);

  const clear = () => {
    setName(""); setSelected([]); setMode("any"); setCity(""); setHood(""); setTypes([]); setModality(""); setPricing("");
    navigate({ search: {} });
  };

  const groups = Array.from(new Set(materials.map((m) => m.group_name)));
  const matName = new Map(materials.map((m) => [m.id, m.name]));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const input = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-forest sm:text-4xl">Encontrar pontos</h1>
        <p className="mt-1 text-muted-foreground">Antes de sair, confirme o recebimento!</p>

        {showDemo && (
          <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-dashed border-sun bg-sun/15 px-4 py-3 text-sm">
            <span><strong>Modo demonstração:</strong> os locais abaixo são fictícios e servem só para mostrar o funcionamento.</span>
            <Button className="font-semibold underline" onClick={() => setShowDemo(false)}>Voltar ao catálogo real</Button>
          </div>
        )}

        {/* Location bar */}
        <form
          className="mt-6 flex flex-col gap-2 border-y bg-card py-4 sm:flex-row"
          onSubmit={(e) => { e.preventDefault(); void searchAddress(); }}
        >
          <label className="relative flex-1">
            <span className="sr-only">Endereço, bairro ou CEP</span>
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="Endereço com número, bairro ou CEP" className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3" />
          </label>
          <Button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-forest">
            <Search className="h-4 w-4" aria-hidden /> Buscar
          </Button>
          <Button type="button" onClick={useMyLocation} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-info px-4 font-semibold text-info hover:bg-info hover:text-info-foreground">
            <LocateFixed className="h-4 w-4" aria-hidden /> Usar minha localização
          </Button>
        </form>
        <div aria-live="polite" className="mt-2 min-h-5 text-sm">
          {geo === "loading" && <span className="text-muted-foreground">Localizando…</span>}
          {geo === "denied" && <span className="text-destructive">Sem permissão de localização. Sem problemas: digite seu endereço, bairro ou CEP acima.</span>}
          {geo === "error" && <span className="text-destructive">Não foi possível obter a localização agora. Tente pelo endereço.</span>}
          {geo === "notfound" && <span className="text-destructive">Endereço não encontrado. Tente incluir o número da casa ou o CEP.</span>}
          {geo === "ok" && <span className="text-primary">Referência definida. Sua localização não é salva.</span>}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="space-y-5 rounded-2xl bg-card p-5 shadow-soft lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" aria-label="Filtros">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Filtros</h2>
              <Button onClick={clear} className="text-sm font-semibold text-primary hover:underline">Limpar filtros</Button>
            </div>
            <label className="block text-sm font-medium">Nome
              <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da empresa ou ponto" />
            </label>
            <fieldset>
              <legend className="text-sm font-medium">Materiais aceitos</legend>
              <div className="mt-2 flex gap-1 rounded-lg bg-muted p-1 text-xs">
                {(["any", "all"] as const).map((m) => (
                  <Button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`flex-1 rounded-md px-2 py-1.5 font-semibold ${mode === m ? "bg-card text-forest shadow-soft" : "text-muted-foreground"}`}>
                    {m === "any" ? "Aceita qualquer selecionado" : "Aceita todos selecionados"}
                  </Button>
                ))}
              </div>
              <div className="mt-3 space-y-3">
                {groups.map((g) => (
                  <div key={g}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {materials.filter((m) => m.group_name === g).map((m) => {
                        const on = selected.includes(m.id);
                        return (
                          <Button key={m.id} type="button" aria-pressed={on} onClick={() => setSelected(toggle(selected, m.id))}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary"}`}>
                            {m.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium">Cidade
                <select className={`${input} mt-1`} value={city} onChange={(e) => { setCity(e.target.value); setHood(""); }}>
                  <option value="">Todas</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Bairro
                <select className={`${input} mt-1`} value={hood} onChange={(e) => setHood(e.target.value)}>
                  <option value="">Todos</option>
                  {hoods.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Tipo de local</legend>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(Object.keys(TYPE_LABEL) as PointType[]).map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={types.includes(t)} onChange={() => setTypes(toggle(types, t))} />
                    {TYPE_LABEL[t]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-medium">Modalidade
              <select className={`${input} mt-1`} value={modality} onChange={(e) => setModality(e.target.value as typeof modality)}>
                <option value="">Qualquer</option>
                <option value="dropoff">Entrega no local</option>
                <option value="pickup">Retirada</option>
              </select>
            </label>
            <label className="block text-sm font-medium">Valor
              <select className={`${input} mt-1`} value={pricing} onChange={(e) => setPricing(e.target.value as typeof pricing)}>
                <option value="">Qualquer</option>
                <option value="gratuito">Recebimento gratuito</option>
                <option value="compra">Compra o material</option>
              </select>
            </label>
            <label className={`flex items-center gap-2 text-sm ${ref ? "" : "opacity-50"}`}>
              <input type="checkbox" className="h-4 w-4 accent-primary" disabled={!ref} checked={sortNear} onChange={(e) => setSortNear(e.target.checked)} />
              Ordenar do mais próximo
            </label>
          </aside>

          {/* Results */}
          <section aria-label="Resultados">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground" aria-live="polite">{results.length} {results.length === 1 ? "local encontrado" : "locais encontrados"}</p>
              <div className="flex rounded-lg bg-muted p-1 lg:hidden">
                <Button onClick={() => setView("list")} aria-pressed={view === "list"} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${view === "list" ? "bg-card shadow-soft" : ""}`}><List className="h-4 w-4" />Lista</Button>
                <Button onClick={() => setView("map")} aria-pressed={view === "map"} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold ${view === "map" ? "bg-card shadow-soft" : ""}`}><MapIcon className="h-4 w-4" />Mapa</Button>
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
              <div className={`${view === "map" ? "hidden" : ""} space-y-3 lg:block xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-1`}>
                {!showDemo && realPoints.length === 0 ? (
                  <EmptyCatalog onDemo={() => setShowDemo(true)} />
                ) : results.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed bg-card p-8 text-center">
                    <p className="text-lg font-bold">Nenhum local com esses filtros</p>
                    <p className="mt-1 text-sm text-muted-foreground">Tente marcar "Aceita qualquer selecionado", remover algum material ou trocar o bairro.</p>
                    <Button onClick={clear} className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><X className="h-4 w-4" />Limpar filtros</Button>
                  </div>
                ) : (
                  results.map(({ p, d }) => <ResultCard key={p.id} p={p} d={d} active={active === p.id} onHover={() => setActive(p.id)} matName={matName} />)
                )}
              </div>
              <div className={`${view === "list" ? "hidden" : ""} h-[70vh] lg:block xl:sticky xl:top-20 xl:h-[calc(100vh-8rem)]`}>
                <LazyMap points={results.map((r) => r.p)} materials={materials} activeId={active} onSelect={setActive} userPos={ref} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function ResultCard({ p, d, active, onHover, matName }: { p: Point; d: number | null; active: boolean; onHover: () => void; matName: Map<string, string> }) {
  const mats = acceptedIds(p);
  return (
    <article onMouseEnter={onHover} onFocus={onHover} className={`rounded-lg border bg-card p-5 transition ${active ? "border-info ring-2 ring-info/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{TYPE_LABEL[p.type]}</span>
          <h3 className="mt-0.5 text-lg font-bold leading-tight">
            <Link to="/pontos/$slug" params={{ slug: p.slug }} className="hover:underline">{p.name}</Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{[p.neighborhood, p.city].filter(Boolean).join(" · ")}</p>
        </div>
        {d != null && (
          <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-forest" title="Distância aproximada em linha reta">
            {formatKm(d)}
          </span>
        )}
      </div>
      {d != null && <p className="mt-1 text-xs text-muted-foreground">distância aproximada em linha reta</p>}
      {mats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mats.slice(0, 8).map((id) => <span key={id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{matName.get(id) ?? id}</span>)}
          {mats.length > 8 && <span className="text-xs text-muted-foreground">+{mats.length - 8}</span>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {p.accepts_dropoff && <span className="rounded-md border px-2 py-0.5">Entrega no local</span>}
        {p.offers_pickup && <span className="rounded-md border px-2 py-0.5">Faz retirada</span>}
        {p.pricing !== "nao_informado" && <span className="rounded-md border px-2 py-0.5">{PRICING_LABEL[p.pricing]}</span>}
      </div>
      <div className="mt-4 flex gap-2">
        <Link to="/pontos/$slug" params={{ slug: p.slug }} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-forest">Ver detalhes</Link>
        <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold hover:border-primary">
          <Navigation className="h-4 w-4" aria-hidden /> Como chegar
        </a>
      </div>
    </article>
  );
}

function EmptyCatalog({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="border-t border-border py-10 text-left">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><MapPin className="h-7 w-7" /></div>
      <h2 className="mt-4 text-xl font-bold">Nosso mapa ainda está crescendo</h2>
      <p className="mt-2 text-sm text-muted-foreground">Ainda não há locais verificados publicados. Conhece uma empresa, cooperativa ou ecoponto? Cadastre e ajude a cidade a reciclar mais.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link to="/cadastrar" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Cadastrar um ponto</Link>
        <Button onClick={onDemo} className="rounded-full border px-5 py-2.5 text-sm font-semibold">Ver demonstração</Button>
      </div>
    </div>
  );
}
