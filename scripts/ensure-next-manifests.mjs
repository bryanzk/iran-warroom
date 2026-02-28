import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const NEXT_DIR = ".next";
const MANIFESTS = [
  {
    file: "fallback-build-manifest.json",
    contents: "{}\n"
  }
];

mkdirSync(NEXT_DIR, { recursive: true });

for (const manifest of MANIFESTS) {
  const target = join(NEXT_DIR, manifest.file);
  if (!existsSync(target)) {
    writeFileSync(target, manifest.contents, "utf8");
    // eslint-disable-next-line no-console
    console.log(`[postbuild] created ${target}`);
  }
}
