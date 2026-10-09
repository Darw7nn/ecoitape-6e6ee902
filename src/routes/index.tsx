import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Droplets, Layers, MapPinned, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/Layout";
import { SearchBox } from "@/components/site/SearchBox";
import { GroupIcon } from "@/components/site/MaterialIcon";
import { materialsQuery } from "@/lib/queries";
import recyclingPhoto from "@/assets/recycling-editorial.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recicla, Uai! — Onde reciclar em Itapetininga–SP" },
      { name: "description", content: "Escolha o material e encontre empresas, cooperativas, ecopontos e pontos de coleta em Itapetininga e região." },
      { property: "og:title", content: "Recicla, Uai! — Seu descarte tem destino" },
      { property: "og:description", content: "Encontre o lugar certo para reciclar em Itapetininga–SP e região." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(materialsQuery),
  component: Home,
});

function Home() {
  const { data: materials } = useSuspenseQuery(materialsQuery);
  const groups = Array.from(new Map(materials.map((m) => [m.group_name, m])).values());

  return (
    <PageShell>
      <section className="home-cover">
        <img src={recyclingPhoto} alt="Garrafas, papelão e latas separados para reciclagem" width={1600} height={912} className="home-cover-image" fetchPriority="high" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="home-cover-copy py-5 pr-5 sm:pr-10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><MapPinned className="h-4 w-4" /> Itapetininga–SP e região</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-tight text-forest sm:text-7xl">Recicla, Uai!</h1>
            <p className="mt-3 text-2xl font-medium text-forest sm:text-3xl">Seu descarte tem destino.</p>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">Do papelão ao eletrônico, encontre o lugar certo para o que você vai descartar.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pt-7 sm:px-8">
        <SearchBox />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="cat">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="cat" className="text-3xl font-extrabold text-forest">O que tem aí pra reciclar?</h2>
            <p className="mt-2 text-muted-foreground">Seu reciclável merece um destino melhor.</p>
          </div>
          <Link to="/materiais" className="font-semibold text-primary hover:underline">Ver orientações por material →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-5">
          {groups.map((g) => {
            const ids = materials.filter((m) => m.group_name === g.group_name).map((m) => m.id);
            return (
              <Link
                key={g.group_name}
                to="/encontrar"
                search={{ m: ids }}
                className="material-tile group relative flex min-h-36 flex-col items-start gap-5 bg-card p-5 transition hover:bg-background"
              >
                <span className="material-icon flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-primary">
                  <GroupIcon group={g.group_name} className="h-6 w-6" />
                </span>
                <span className="font-semibold">{g.group_name}</span><ArrowUpRight className="tile-arrow absolute right-4 top-5 h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-card py-16" aria-labelledby="passos">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="passos" className="text-3xl font-extrabold text-forest">Três passos e seu descarte tem destino</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { i: Layers, t: "Escolha o material", d: "Papel, vidro, pilhas, óleo… Selecione um ou vários." },
              { i: MapPinned, t: "Encontre um local", d: "Veja no mapa os pontos mais próximos de você." },
              { i: PackageCheck, t: "Confira as condições", d: "Limpeza, embalagem, horários e se precisa agendar." },
            ].map((s, n) => (
              <li key={s.t} className="border-t border-border py-6">
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl font-extrabold text-sun">{n + 1}</span>
                  <s.i className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <h3 className="mt-3 text-xl font-bold">{s.t}</h3>
                <p className="mt-1 text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-forest py-16 text-forest-foreground" aria-labelledby="dicas">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-[1fr_1.4fr] sm:px-8">
          <div>
            <h2 id="dicas" className="text-3xl font-extrabold">Separar é fácil, uai</h2>
            <p className="mt-3 opacity-85">Descarte certo, planeta feliz. Algumas dicas antes de sair de casa:</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { i: Droplets, t: "Limpe e seque", d: "Uma enxaguada rápida evita cheiro e contaminação." },
              { i: Layers, t: "Separe por tipo", d: "Papel com papel, plástico com plástico. O catador agradece." },
              { i: ShieldCheck, t: "Perigosos à parte", d: "Pilhas, lâmpadas e eletrônicos vão para pontos específicos." },
              { i: Search, t: "Confirme antes", d: "Ligue ou mande mensagem para conferir o recebimento." },
            ].map((d) => (
              <li key={d.t} className="flex gap-3">
                <d.i className="mt-0.5 h-5 w-5 shrink-0 text-sun" aria-hidden />
                <div>
                  <p className="font-semibold">{d.t}</p>
                  <p className="text-sm opacity-80">{d.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold">Tem uma empresa, cooperativa ou ponto de coleta?</p>
          <Link to="/cadastrar" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft hover:bg-forest">
            Cadastre seu ponto gratuitamente
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
