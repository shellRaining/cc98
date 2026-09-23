export const SERVICE_WORKER_UPDATE_INTERVAL = 60 * 60 * 1000;
const SERVICE_WORKER_UPDATE_THROTTLE = 5 * 60 * 1000;
const SERVICE_WORKER_WAIT_TIMEOUT = 10_000;

interface UpdateCheckerOptions {
  now?: () => number;
  throttle?: number;
}

export function createServiceWorkerUpdateChecker(
  getRegistration: () => ServiceWorkerRegistration | undefined,
  options: UpdateCheckerOptions = {},
): (force?: boolean) => Promise<void> {
  const now = options.now ?? Date.now;
  const throttle = options.throttle ?? SERVICE_WORKER_UPDATE_THROTTLE;
  let lastCheckedAt = Number.NEGATIVE_INFINITY;
  let activeCheck: Promise<void> | undefined;

  return async (force = false): Promise<void> => {
    if (activeCheck) return activeCheck;

    const registration = getRegistration();
    if (!registration) return;

    const checkedAt = now();
    if (!force && checkedAt - lastCheckedAt < throttle) return;
    lastCheckedAt = checkedAt;

    const update = registration.update().then(() => undefined);
    const tracked = update.finally(() => {
      if (activeCheck === tracked) activeCheck = undefined;
    });
    activeCheck = tracked;
    return tracked;
  };
}

export async function waitForWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
  timeout = SERVICE_WORKER_WAIT_TIMEOUT,
): Promise<boolean> {
  if (registration.waiting) return true;

  const worker = registration.installing;
  if (!worker) return false;
  if (worker.state === "installed") return registration.waiting != null;
  if (worker.state === "activated" || worker.state === "redundant") return false;

  return await new Promise<boolean>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => finish(false), timeout);

    function finish(waiting: boolean): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.removeEventListener("statechange", handleStateChange);
      resolve(waiting);
    }

    function handleStateChange(): void {
      if (worker?.state === "installed") {
        finish(registration.waiting != null);
      } else if (worker?.state === "activated" || worker?.state === "redundant") {
        finish(false);
      }
    }

    worker.addEventListener("statechange", handleStateChange);
  });
}
