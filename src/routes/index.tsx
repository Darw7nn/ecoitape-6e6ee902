import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Droplets, Layers, MapPinned, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/Layout";
import { SearchBox } from "@/components/site/SearchBox";
import { GroupIcon } from "@/components/site/MaterialIcon";
import { materialsQuery } from "@/lib/queries";

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
      <section className="hero-pattern">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-forest">
            <span className="h-2 w-2 rounded-full bg-sun" /> Itapetininga–SP e região
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] text-forest sm:text-6xl">
            Vai descartar? Bora encontrar o lugar certo!
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            O Recicla, Uai! reúne empresas, cooperativas, ecopontos e pontos de coleta de Itapetininga e região. Escolha o material, diga onde você está e pronto.
          </p>
          <div className="mt-8">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="cat">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="cat" className="text-3xl font-extrabold text-forest">O que tem aí pra reciclar?</h2>
            <p className="mt-2 text-muted-foreground">Seu reciclável merece um destino melhor.</p>
          </div>
          <Link to="/materiais" className="font-semibold text-primary hover:underline">Ver orientações por material →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {groups.map((g) => {
            const ids = materials.filter((m) => m.group_name === g.group_name).map((m) => m.id);
            return (
              <Link
                key={g.group_name}
                to="/encontrar"
                search={{ m: ids }}
                className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lift"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <GroupIcon group={g.group_name} className="h-6 w-6" />
                </span>
                <span className="font-semibold">{g.group_name}</span>
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
              <li key={s.t} className="rounded-2xl bg-background p-6">
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

      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="dicas">
        <div className="grid gap-8 rounded-3xl bg-forest p-8 text-forest-foreground md:grid-cols-[1fr_1.4fr] md:p-12">
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
