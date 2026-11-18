import * as Updates from "expo-updates";
import { logger } from "@/utils/logger";

type ApplyUpdateOptions = {
  /** Give up waiting after this long; a download still in flight applies on the next launch */
  timeoutMs: number;
};

type Outcome = "reloading" | "up-to-date" | "timed-out" | "skipped" | "failed";

let inFlight: Promise<Outcome> | null = null;

/**
 * Check for a published OTA update and, if there is one, download it and restart into it
 * right away instead of waiting for the next cold start.
 *
 * Never throws. Does nothing in dev / Expo Go / builds without expo-updates. Can't loop:
 * after the reload the running update is the newest, so the next check finds nothing.
 */
export function applyUpdateIfAvailable({ timeoutMs }: ApplyUpdateOptions): Promise<Outcome> {
  if (__DEV__ || !Updates.isEnabled) return Promise.resolve("skipped");
  // Startup and resume checks can overlap; share one.
  inFlight ??= run(timeoutMs).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(timeoutMs: number): Promise<Outcome> {
  // Once we've stopped waiting, the user is in the app: a late download must not restart it
  // under them. expo-updates keeps it and launches it next time.
  let gaveUp = false;

  const check = async (): Promise<Outcome> => {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (!isAvailable) return "up-to-date";
    const { isNew } = await Updates.fetchUpdateAsync();
    if (!isNew) return "up-to-date";
    if (gaveUp) return "timed-out";
    logger.info("OTA update downloaded, reloading");
    await Updates.reloadAsync();
    return "reloading";
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Outcome>((resolve) => {
    timer = setTimeout(() => {
      gaveUp = true;
      resolve("timed-out");
    }, timeoutMs);
  });

  try {
    const outcome = await Promise.race([check(), timeout]);
    if (outcome === "timed-out") logger.warn("OTA update check timed out");
    return outcome;
  } catch (error) {
    logger.warn("OTA update check failed:", error);
    return "failed";
  } finally {
    clearTimeout(timer);
  }
}
