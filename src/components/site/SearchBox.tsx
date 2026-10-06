import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { materialsQuery } from "@/lib/queries";

export function SearchBox() {
  const navigate = useNavigate();
  const { data: materials = [] } = useQuery(materialsQuery);
  const [material, setMaterial] = useState("");
  const [q, setQ] = useState("");

  const go = (loc?: boolean) =>
    navigate({
      to: "/encontrar",
      search: { m: material ? [material] : undefined, q: q.trim() || undefined, loc: loc ? 1 : undefined },
    });

  const groups = Array.from(new Set(materials.map((m) => m.group_name)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="rounded-3xl bg-card p-4 shadow-lift sm:p-6"
      aria-label="Buscar locais de reciclagem"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-forest">O que você vai descartar?</span>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
          >
            <option value="">Qualquer material</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {materials.filter((m) => m.group_name === g).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-forest">Onde você está?</span>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={200}
              placeholder="Endereço com número, bairro ou CEP"
              className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-base"
            />
          </div>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition hover:bg-forest">
          <Search className="h-5 w-5" aria-hidden /> Encontrar onde reciclar
        </button>
        <button type="button" onClick={() => go(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-info px-5 font-semibold text-info transition hover:bg-info hover:text-info-foreground">
          <LocateFixed className="h-5 w-5" aria-hidden /> Usar minha localização
        </button>
      </div>
    </form>
  );
}
