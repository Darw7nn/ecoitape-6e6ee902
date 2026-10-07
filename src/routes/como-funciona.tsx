import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/Layout";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — Recicla, Uai!" },
      { name: "description", content: "Entenda como o Recicla, Uai! ajuda você a encontrar onde reciclar e como os locais são cadastrados e revisados." },
      { property: "og:title", content: "Como funciona o Recicla, Uai!" },
      { property: "og:description", content: "Busca por material, mapa, distância e cadastro revisado de locais." },
    ],
  }),
  component: How,
});

const FAQ = [
  ["De onde vêm as informações?", "Os próprios locais (ou quem os conhece) enviam o cadastro. Nossa equipe revisa antes de publicar. Só mostramos que um ponto recebe um material quando isso está confirmado."],
  ["A distância é exata?", "Mostramos a distância aproximada em linha reta. O trajeto real pode ser maior — use o botão “Como chegar” para ver a rota no Google Maps."],
  ["Vocês guardam minha localização?", "Não. A localização ou o endereço que você digita é usado só na hora da busca, no seu navegador."],
  ["Achei uma informação errada. E agora?", "Na página do local, clique em “Informar dados incorretos”. A gente confere."],
  ["Preciso pagar para cadastrar?", "Não. O cadastro é gratuito."],
];

function How() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-extrabold text-forest">Como funciona</h1>
        <ol className="mt-8 space-y-4">
          {["Escolha o material que quer descartar — um ou vários.", "Informe seu endereço, bairro ou CEP, ou use sua localização.", "Veja os locais no mapa e na lista, do mais perto ao mais longe.", "Confira condições, horários e contato. Antes de sair, confirme o recebimento!"].map((s, i) => (
            <li key={s} className="flex gap-4 rounded-2xl bg-card p-5 shadow-soft">
              <span className="font-display text-3xl font-extrabold text-primary">{i + 1}</span>
              <p className="pt-1.5">{s}</p>
            </li>
          ))}
        </ol>
        <h2 className="mt-14 text-2xl font-extrabold text-forest">Perguntas frequentes</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-2xl bg-card p-5 shadow-soft">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/encontrar" className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Encontrar pontos</Link>
          <Link to="/cadastrar" className="rounded-full border px-5 py-2.5 font-semibold">Cadastrar um ponto</Link>
        </div>
      </div>
    </PageShell>
  );
}
