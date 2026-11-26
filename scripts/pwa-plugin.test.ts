import { describe, expect, it, vi } from "vitest";
import { serviceWorker } from "./pwa-plugin.ts";

type Listener = (event: FakeEvent) => void;
interface FakeEvent {
  request?: { method: string; url: string; mode: string };
  waitUntil: (p: Promise<unknown>) => void;
  respondWith: (p: Promise<unknown>) => void;
}

/** Runs the generated sw.js against stand-ins for the service worker globals and records what it does. */
function load(files = ["./", "index.html", "assets/app-1a2b.js"]) {
  const listeners: Record<string, Listener> = {};
  const cached = new Map<string, unknown>([
    ["./", "cached page"],
    ["https://lohnt.es/assets/app-1a2b.js", "cached script"],
  ]);
  const cache = {
    addAll: vi.fn(async () => {}),
    put: vi.fn(async (key: string, value: unknown) => void cached.set(key, value)),
  };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => []),
    delete: vi.fn(async () => true),
    match: vi.fn(async (key: unknown) => cached.get(typeof key === "string" ? key : (key as { url: string }).url)),
  };
  const fetch = vi.fn(async (): Promise<unknown> => ({ ok: true, clone: () => "fresh page" }));
  const self = {
    location: { origin: "https://lohnt.es" },
    addEventListener: (type: string, fn: Listener) => void (listeners[type] = fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  class FakeRequest {
    constructor(
      readonly url: string,
      readonly init: RequestInit,
    ) {}
  }
  new Function("self", "caches", "fetch", "Request", serviceWorker("iiwi-test", files))(self, caches, fetch, FakeRequest);

  /** Fires an event and waits for what the worker handed to waitUntil/respondWith. */
  async function fire(type: string, request?: FakeEvent["request"]) {
    let pending: Promise<unknown> | undefined;
    listeners[type]({ request, waitUntil: (p) => void (pending = p), respondWith: (p) => void (pending = p) });
    return pending;
  }
  return { fire, fetch, cache, caches };
}

const page = { method: "GET", url: "https://lohnt.es/", mode: "navigate" };

describe("Service Worker", () => {
  it("lädt beim Installieren alle Dateien am HTTP-Cache vorbei (sonst bis zu 10 Minuten alter Stand)", async () => {
    const sw = load();
    await sw.fire("install");
    const requests = sw.cache.addAll.mock.calls[0][0] as unknown as { url: string; init: RequestInit }[];
    expect(requests.map((r) => r.url)).toEqual(["./", "index.html", "assets/app-1a2b.js"]);
    for (const r of requests) expect(r.init.cache).toBe("reload");
  });

  it("holt die Seite online frisch, ohne HTTP-Cache, und legt sie als Offline-Kopie ab", async () => {
    const sw = load();
    await sw.fire("fetch", page);
    expect(sw.fetch).toHaveBeenCalledWith(page, { cache: "no-cache" });
    await vi.waitFor(() => expect(sw.cache.put).toHaveBeenCalledWith("./", "fresh page"));
  });

  it("zeigt offline die gespeicherte Seite", async () => {
    const sw = load();
    sw.fetch.mockRejectedValueOnce(new TypeError("offline"));
    expect(await sw.fire("fetch", page)).toBe("cached page");
    expect(sw.caches.match).toHaveBeenCalledWith("./", { ignoreVary: true });
  });

  it("nimmt Dateien aus dem Cache, auch wenn der Server Vary schickt", async () => {
    const sw = load();
    const asset = { method: "GET", url: "https://lohnt.es/assets/app-1a2b.js", mode: "cors" };
    expect(await sw.fire("fetch", asset)).toBe("cached script");
    expect(sw.caches.match).toHaveBeenCalledWith(asset, { ignoreVary: true });
    expect(sw.fetch).not.toHaveBeenCalled();
  });

  it("lässt fremde Adressen in Ruhe", async () => {
    const sw = load();
    expect(await sw.fire("fetch", { method: "GET", url: "https://github.com/", mode: "navigate" })).toBeUndefined();
    expect(sw.fetch).not.toHaveBeenCalled();
  });
});
