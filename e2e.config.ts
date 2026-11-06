import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";

export default {
  tests: "e2e/**/*.e2e.ts",
  targets: [
    {
      engine: web(),
      app: {
        url: "http://127.0.0.1:3000",
        command: {
          executable: "pnpm",
          args: ["exec", "next", "start", "--hostname", "127.0.0.1"],
          log: ".e2e/logs/app.log",
        },
      },
    },
  ],
  workers: 1,
  retries: 0,
  reporters: ["list", "junit"],
} satisfies E2EConfig;
