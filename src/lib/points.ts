export type PointType = "empresa" | "cooperativa" | "ecoponto" | "ponto_coleta";
export type Pricing = "gratuito" | "compra" | "cobra" | "nao_informado";

export type Material = { id: string; name: string; group_name: string; sort_order: number };

export type PointMaterial = { material_id: string; accepted: boolean };

export type Point = {
  id: string;
  slug: string;
  name: string;
  type: PointType;
  description: string | null;
  image_url: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  email: string | null;
  cnpj: string | null;
  hours: string | null;
  accepts_dropoff: boolean;
  offers_pickup: boolean;
  pricing: Pricing;
  pricing_notes: string | null;
  cond_cleaning: string | null;
  cond_packaging: string | null;
  cond_min_quantity: string | null;
  cond_costs: string | null;
  cond_scheduling: string | null;
  is_demo: boolean;
  status: "pendente" | "aprovado" | "inativo";
  updated_at: string;
  point_materials: PointMaterial[];
};

export const TYPE_LABEL: Record<PointType, string> = {
  empresa: "Empresa",
  cooperativa: "Cooperativa",
  ecoponto: "Ecoponto",
  ponto_coleta: "Ponto de coleta",
};

export const PRICING_LABEL: Record<Pricing, string> = {
  gratuito: "Recebimento gratuito",
  compra: "Compra o material",
  cobra: "Cobra pelo recebimento",
  nao_informado: "Não informado",
};

export const ITAPETININGA: [number, number] = [-23.5917, -48.0531];

export function acceptedIds(p: Point) {
  return p.point_materials.filter((m) => m.accepted).map((m) => m.material_id);
}

export function fullAddress(p: Point) {
  const line = [p.street, p.number].filter(Boolean).join(", ");
  return [line, p.neighborhood, `${p.city}–${p.state}`, p.cep].filter(Boolean).join(" · ");
}

/** Straight-line distance in km (haversine). */
export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

export function directionsUrl(p: Point) {
  const dest =
    p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : encodeURIComponent(fullAddress(p));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export type MatchMode = "any" | "all";

export function matchesMaterials(p: Point, selected: string[], mode: MatchMode) {
  if (!selected.length) return true;
  const acc = new Set(acceptedIds(p));
  return mode === "all" ? selected.every((s) => acc.has(s)) : selected.some((s) => acc.has(s));
}

/** Geocode via OpenStreetMap Nominatim (low-volume, user-triggered only). */
export async function geocode(query: string): Promise<[number, number] | null> {
  const q = /itapetininga|sp\b|\d{5}-?\d{3}/i.test(query) ? query : `${query}, Itapetininga, SP`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Serviço de endereços indisponível");
  const data = (await res.json()) as { lat: string; lon: string }[];
  const first = data[0];
  if (!first) return null;
  return [parseFloat(first.lat), parseFloat(first.lon)];
}
