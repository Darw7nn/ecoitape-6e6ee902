import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/site/Layout";
import { GroupIcon } from "@/components/site/MaterialIcon";

export const Route = createFileRoute("/materiais")({
  head: () => ({
    meta: [
      { title: "Materiais recicláveis: como separar e descartar — Recicla, Uai!" },
      { name: "description", content: "Orientações curtas para separar papel, plástico, vidro, metais, óleo, eletrônicos, pilhas e mais em Itapetininga–SP." },
      { property: "og:title", content: "Como separar cada material — Recicla, Uai!" },
      { property: "og:description", content: "Descarte certo, planeta feliz. Dicas por tipo de material." },
    ],
  }),
  component: Materials,
});

const GUIDE: { group: string; tip: string; special?: boolean }[] = [
  { group: "Papel", tip: "Papel e papelão secos e sem gordura. Caixa de pizza engordurada não rola." },
  { group: "Plásticos", tip: "PET, PEAD e PP enxaguados. Amasse as garrafas para economizar espaço." },
  { group: "Metais", tip: "Latinhas, cobre, ferro e aço. Retire restos de comida das latas." },
  { group: "Vidro", tip: "Potes e garrafas inteiros, sem tampa. Vidro quebrado: embrulhe em jornal e identifique." },
  { group: "Óleo", tip: "Óleo de cozinha frio, em garrafa PET bem fechada. Nunca na pia!" },
  { group: "Eletrônicos", tip: "Computadores, celulares, cabos e pequenos eletrodomésticos precisam de ponto específico.", special: true },
  { group: "Pilhas e baterias", tip: "Contêm metais pesados. Leve só a pontos que recebem esse material.", special: true },
  { group: "Lâmpadas", tip: "Fluorescentes têm mercúrio. Transporte inteiras e protegidas.", special: true },
  { group: "Pneus", tip: "Não deixe acumular água. Procure pontos que recebem pneus.", special: true },
  { group: "Madeira", tip: "Sem pregos soltos quando possível. Separe de outros entulhos." },
  { group: "Roupas e tecidos", tip: "Peças limpas e secas podem ser doadas; retalhos vão para reciclagem têxtil." },
  { group: "Entulho", tip: "Restos de obra vão para áreas licenciadas — caçamba certa, consciência tranquila." },
  { group: "Orgânicos", tip: "Cascas e restos de alimentos viram adubo na compostagem." },
];

function Materials() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-extrabold text-forest">Materiais</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">Seu reciclável merece um destino melhor. Veja como preparar cada tipo antes de levar.</p>
        <div className="mt-6 flex gap-3 rounded-2xl border-l-4 border-sun bg-card p-5 shadow-soft">
          <AlertTriangle className="h-6 w-6 shrink-0 text-sun-foreground" aria-hidden />
          <p className="text-sm"><strong>Atenção:</strong> pilhas, baterias, lâmpadas e eletrônicos não vão para a coleta comum. Eles precisam de pontos específicos.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE.map((g) => (
            <article key={g.group} className="flex flex-col rounded-2xl bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><GroupIcon group={g.group} className="h-6 w-6" /></span>
                <h2 className="text-xl font-bold">{g.group}</h2>
              </div>
              {g.special && <span className="mt-3 w-fit rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-semibold text-info">Ponto específico</span>}
              <p className="mt-3 flex-1 text-muted-foreground">{g.tip}</p>
              <Link to="/encontrar" className="mt-4 text-sm font-semibold text-primary hover:underline">Encontrar onde levar →</Link>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
