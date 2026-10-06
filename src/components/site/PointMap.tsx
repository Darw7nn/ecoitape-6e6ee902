import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ITAPETININGA, type Point, type Material, acceptedIds } from "@/lib/points";

const pinHtml = (active: boolean) =>
  `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${active ? "#2563EB" : "#167D4A"};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.25)"></div>`;

const icon = (active: boolean) =>
  L.divIcon({ html: pinHtml(active), className: "", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });

const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#F4C542;border:3px solid #123D2B"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export default function PointMap({
  points,
  materials,
  activeId,
  onSelect,
  userPos,
  height = "100%",
}: {
  points: Point[];
  materials: Material[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  userPos?: [number, number] | null;
  height?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: true }).setView(ITAPETININGA, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.current = {};
    const names = new Map(materials.map((x) => [x.id, x.name]));
    const bounds: [number, number][] = [];
    for (const p of points) {
      if (p.lat == null || p.lng == null) continue;
      const mats = acceptedIds(p).map((id) => names.get(id) ?? id).slice(0, 6).join(", ");
      const mk = L.marker([p.lat, p.lng], { icon: icon(p.id === activeId), title: p.name })
        .bindPopup(
          `<strong>${esc(p.name)}</strong><br/><span style="font-size:12px">${esc(mats || "Materiais não informados")}</span><br/><a href="/pontos/${encodeURIComponent(p.slug)}" style="display:inline-block;margin-top:6px;font-weight:600;color:#167D4A">Ver detalhes →</a>`,
        )
        .on("click", () => onSelect?.(p.id));
      mk.addTo(g);
      markers.current[p.id] = mk;
      bounds.push([p.lat, p.lng]);
    }
    if (userPos) {
      L.marker(userPos, { icon: userIcon, title: "Sua referência" }).addTo(g);
      bounds.push(userPos);
    }
    if (bounds.length > 1) m.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    else if (bounds.length === 1) m.setView(bounds[0], 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, materials, userPos]);

  useEffect(() => {
    for (const [id, mk] of Object.entries(markers.current)) mk.setIcon(icon(id === activeId));
    if (activeId && markers.current[activeId] && map.current) {
      const mk = markers.current[activeId];
      map.current.panTo(mk.getLatLng());
      mk.openPopup();
    }
  }, [activeId]);

  useEffect(() => {
    const t = setTimeout(() => map.current?.invalidateSize(), 100);
    return () => clearTimeout(t);
  });

  return <div ref={el} style={{ height, width: "100%" }} className="rounded-2xl" role="region" aria-label="Mapa dos pontos de coleta" />;
}
