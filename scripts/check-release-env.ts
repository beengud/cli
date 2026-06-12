import { z } from "zod";
import { BUILD_ENV } from "../src/lib/constants";

const ReleaseEnvSchema = z.object({
  [BUILD_ENV.OBSERVE_INGEST_TOKEN]: z.string().min(1),
  [BUILD_ENV.OBSERVE_COLLECT_URL]: z.string().min(1),
  [BUILD_ENV.OBSERVE_GQL_SPEC]: z.string().min(1),
  [BUILD_ENV.OBSERVE_GQL_TOKEN]: z.string().min(1),
  [BUILD_ENV.OBSERVE_OPENAPI_SPEC]: z.string().min(1),
});

export function checkReleaseEnv() {
  if (process.env[BUILD_ENV.RELEASE_BUILD] !== "1") return;

  const result = ReleaseEnvSchema.safeParse(process.env);
  if (result.success) return;

  const missing = result.error.issues
    .map((i) => i.path.join("."))
    .filter((p) => p.length > 0);

  throw new Error(
    `RELEASE_BUILD=1 requires the following env vars to be set: ${missing.join(
      ", ",
    )}. Without them codegen will fail or released binaries ship with telemetry disabled.`,
  );
}
