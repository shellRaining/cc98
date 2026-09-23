import { describe, expect, test, vi } from "vite-plus/test";
import {
  createServiceWorkerUpdateChecker,
  waitForWaitingServiceWorker,
} from "../src/components/pwa-update.ts";

function registrationWithUpdate(update: () => Promise<unknown>): ServiceWorkerRegistration {
  return { update } as unknown as ServiceWorkerRegistration;
}

describe("Service Worker 更新检查", () => {
  test("合并并发检查并限制短时间内的重复请求", async () => {
    let now = 1_000;
    let finishUpdate: (() => void) | undefined;
    let firstUpdate = true;
    const update = vi.fn(() => {
      if (!firstUpdate) return Promise.resolve();
      firstUpdate = false;
      return new Promise<void>((resolve) => {
        finishUpdate = resolve;
      });
    });
    const registration = registrationWithUpdate(update);
    const check = createServiceWorkerUpdateChecker(() => registration, {
      now: () => now,
      throttle: 500,
    });

    const first = check();
    const concurrent = check();
    expect(update).toHaveBeenCalledTimes(1);
    finishUpdate?.();
    await Promise.all([first, concurrent]);

    now = 1_200;
    await check();
    expect(update).toHaveBeenCalledTimes(1);

    await check(true);
    expect(update).toHaveBeenCalledTimes(2);

    now = 1_700;
    await check();
    expect(update).toHaveBeenCalledTimes(3);
  });

  test("注册尚未完成时跳过检查", async () => {
    const check = createServiceWorkerUpdateChecker(() => undefined);
    await expect(check()).resolves.toBeUndefined();
  });
});

describe("等待新 Service Worker", () => {
  test("安装完成并进入 waiting 后返回 true", async () => {
    const worker = new EventTarget() as EventTarget & { state: ServiceWorkerState };
    worker.state = "installing";
    const registration = {
      installing: worker,
      waiting: null,
    } as unknown as ServiceWorkerRegistration;

    const waiting = waitForWaitingServiceWorker(registration, 100);
    Object.assign(registration, { waiting: worker });
    worker.state = "installed";
    worker.dispatchEvent(new Event("statechange"));

    await expect(waiting).resolves.toBe(true);
  });

  test("没有正在安装的 Worker 时不等待", async () => {
    const registration = {
      installing: null,
      waiting: null,
    } as unknown as ServiceWorkerRegistration;

    await expect(waitForWaitingServiceWorker(registration, 100)).resolves.toBe(false);
  });
});
