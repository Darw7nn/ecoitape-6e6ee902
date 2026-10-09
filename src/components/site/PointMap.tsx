import { useEffect, useRef, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ITAPETININGA, type Point, type Material, acceptedIds } from "@/lib/points";

declare global { interface Window { initReciclaMap?: () => void; } }
let apiPromise: Promise<void> | null = null;
function loadMaps() {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    const channel = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'];
    if (!key) { reject(new Error("Google Maps não está conectado.")); return; }
    window.initReciclaMap = () => { resolve(); delete window.initReciclaMap; };
    const script = document.createElement("script");
    script.id = "recicla-google-maps";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=initReciclaMap&channel=${encodeURIComponent(channel ?? '')}&language=pt-BR&region=BR`;
    script.onerror = () => { script.remove(); apiPromise = null; reject(new Error("Não foi possível carregar o Google Maps.")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function PointMap({ points, materials, activeId, onSelect, userPos, height = "100%" }: {
  points: Point[]; materials: Material[]; activeId?: string | null; onSelect?: (id: string) => void;
  userPos?: [number, number] | null; height?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef(new Map<string, google.maps.Marker>());
  const popup = useRef<google.maps.InfoWindow | null>(null);
  const selection = useRef(onSelect);
  selection.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError("");
    void loadMaps().then(() => {
      if (cancelled || !el.current) return;
      map.current = new google.maps.Map(el.current, {
        center: { lat: ITAPETININGA[0], lng: ITAPETININGA[1] }, zoom: 13,
        clickableIcons: false, mapTypeControl: false, streetViewControl: false,
        fullscreenControl: true, gestureHandling: "cooperative",
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
      popup.current = new google.maps.InfoWindow();
      setReady(true);
    }).catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Não foi possível carregar o mapa."); });
    return () => { cancelled = true; setReady(false); popup.current?.close(); map.current = null; };
  }, [attempt]);

  useEffect(() => {
    const current = map.current;
    if (!ready || !current) return;
    const colors = getComputedStyle(document.documentElement);
    const primary = colors.getPropertyValue("--primary").trim();
    const info = colors.getPropertyValue("--info").trim();
    const card = colors.getPropertyValue("--card").trim();
    const names = new Map(materials.map((m) => [m.id, m.name]));
    const bounds = new google.maps.LatLngBounds();
    const created: google.maps.Marker[] = [];
    markers.current.clear();
    const markerIcon = (color: string): google.maps.Symbol => ({ path: google.maps.SymbolPath.CIRCLE, fillColor: color, fillOpacity: 1, strokeColor: card, strokeWeight: 3, scale: 10 });
    for (const p of points) {
      if (p.lat == null || p.lng == null || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const position = { lat: p.lat, lng: p.lng };
      const marker = new google.maps.Marker({ map: current, position, title: p.name, icon: markerIcon(primary) });
      const content = document.createElement("div");
      content.className = "map-popup";
      const title = document.createElement("strong"); title.textContent = p.name;
      const mats = document.createElement("p"); mats.textContent = acceptedIds(p).map((id) => names.get(id) ?? id).slice(0, 6).join(", ") || "Materiais não informados";
      const link = document.createElement("a"); link.href = `/pontos/${encodeURIComponent(p.slug)}`; link.textContent = "Ver detalhes →";
      content.append(title, mats);
      if (p.is_demo) { const demo = document.createElement("p"); demo.textContent = "Demonstração — local fictício"; content.append(demo); }
      content.append(link);
      marker.addListener("click", () => { selection.current?.(p.id); popup.current?.setContent(content); popup.current?.open({ map: current, anchor: marker }); });
      markers.current.set(p.id, marker); created.push(marker); bounds.extend(position);
    }
    if (userPos) {
      const position = { lat: userPos[0], lng: userPos[1] };
      created.push(new google.maps.Marker({ map: current, position, title: "Sua referência", icon: markerIcon(info) }));
      bounds.extend(position);
    }
    if (created.length > 1) { current.fitBounds(bounds, 48); const listener = google.maps.event.addListenerOnce(current, "idle", () => { if ((current.getZoom() ?? 13) > 15) current.setZoom(15); }); created[0]?.addListener("unused", () => google.maps.event.removeListener(listener)); }
    else if (created.length === 1) { current.setCenter(bounds.getCenter()); current.setZoom(15); }
    else { current.setCenter({ lat: ITAPETININGA[0], lng: ITAPETININGA[1] }); current.setZoom(13); }
    return () => { popup.current?.close(); created.forEach((m) => { google.maps.event.clearInstanceListeners(m); m.setMap(null); }); markers.current.clear(); };
  }, [ready, points, materials, userPos]);

  useEffect(() => {
    if (!ready) return;
    const css = getComputedStyle(document.documentElement);
    markers.current.forEach((marker, id) => {
      marker.setIcon({ path: google.maps.SymbolPath.CIRCLE, fillColor: css.getPropertyValue(id === activeId ? "--info" : "--primary").trim(), fillOpacity: 1, strokeColor: css.getPropertyValue("--card").trim(), strokeWeight: 3, scale: id === activeId ? 13 : 10 });
      marker.setZIndex(id === activeId ? 10 : 1);
    });
    const marker = activeId ? markers.current.get(activeId) : undefined;
    const position = marker?.getPosition();
    if (position) map.current?.panTo(position);
  }, [activeId, ready, points]);

  return <div className="relative h-full min-h-72" style={{ height }}>
    <div ref={el} className="google-map" role="region" aria-label="Mapa dos pontos de coleta" />
    {!ready && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-muted px-6 text-center text-sm text-muted-foreground" role="status">
      <MapPin className="h-7 w-7 text-primary" />
      <p>{error || "Carregando Google Maps…"}</p>
      {error && <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}><RefreshCw />Tentar novamente</Button>}
    </div>}
  </div>;
}
