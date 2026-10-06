import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Material, Point } from "./points";

const SELECT = "*, point_materials(material_id, accepted)";

function publicClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listMaterials = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("materials").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return data as Material[];
});

export const listPoints = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("points")
    .select(SELECT)
    .eq("status", "aprovado")
    .order("name");
  if (error) throw new Error(error.message);
  return data as unknown as Point[];
});

export const getPoint = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("points")
      .select(SELECT)
      .eq("slug", data.slug)
      .eq("status", "aprovado")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as unknown as Point) ?? null;
  });
