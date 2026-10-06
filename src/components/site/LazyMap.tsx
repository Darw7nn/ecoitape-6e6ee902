import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentProps } from "react";

const PointMap = lazy(() => import("./PointMap"));

function Fallback() {
  return <div className="flex h-full min-h-64 w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">Carregando mapa…</div>;
}

export function LazyMap(props: ComponentProps<typeof PointMap>) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <PointMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
