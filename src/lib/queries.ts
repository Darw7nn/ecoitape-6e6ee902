import { queryOptions } from "@tanstack/react-query";
import { getPoint, listMaterials, listPoints } from "./points.functions";

export const materialsQuery = queryOptions({
  queryKey: ["materials"],
  queryFn: () => listMaterials(),
  staleTime: 5 * 60_000,
});

export const pointsQuery = queryOptions({
  queryKey: ["points"],
  queryFn: () => listPoints(),
  staleTime: 60_000,
});

export const pointQuery = (slug: string) =>
  queryOptions({ queryKey: ["point", slug], queryFn: () => getPoint({ data: { slug } }) });
