// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// Avoid npm lifecycle recursion when `npm run build` itself runs OpenNext build.
config.buildCommand = "npm run build:next";

export default config;
