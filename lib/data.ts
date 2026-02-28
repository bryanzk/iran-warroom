import seed from "@/data/seed.json";
import type { SeedData } from "@/lib/types";

export function getSeedData(): SeedData {
  return seed as SeedData;
}
