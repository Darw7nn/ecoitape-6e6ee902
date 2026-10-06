import {
  Battery, Car, Cpu, Droplet, FileText, Hammer, Lightbulb, Package, Recycle, Shirt, Sprout, TreePine, Wine, Wrench,
  type LucideIcon,
} from "lucide-react";

export const GROUP_ICON: Record<string, LucideIcon> = {
  Metais: Wrench,
  Papel: FileText,
  "Plásticos": Package,
  Vidro: Wine,
  "Óleo": Droplet,
  "Eletrônicos": Cpu,
  "Pilhas e baterias": Battery,
  "Lâmpadas": Lightbulb,
  Pneus: Car,
  Madeira: TreePine,
  "Roupas e tecidos": Shirt,
  Entulho: Hammer,
  "Orgânicos": Sprout,
};

export function GroupIcon({ group, className }: { group: string; className?: string }) {
  const I = GROUP_ICON[group] ?? Recycle;
  return <I className={className} aria-hidden="true" />;
}
