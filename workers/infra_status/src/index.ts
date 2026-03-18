type Env = {
    CORS_ORIGIN?: string;

    APPWRITE_ENDPOINT?: string;

    RENDER_API_KEY?: string;
    RENDER_SERVICE_IDS?: string; // comma-separated

    CLOUDFLARE_API_TOKEN?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CF_WORKER_NAMES?: string; // comma-separated
    CF_PAGES_PROJECT_NAMES?: string; // comma-separated

    APPWRITE_CONSOLE_URL?: string;
    RENDER_CONSOLE_URL?: string;
    CLOUDFLARE_CONSOLE_URL?: string;
};

type ProviderPayload = {
    ok: boolean;
    label: string;
    details?: string;
    latencyMs?: number;
    lastUpdatedAtIso: string;
};

function json(status: number, body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(init?.headers ?? {})
        }
    });
}

function withCors(req: Request, env: Env, res: Response): Response {
    const origin = req.headers.get("origin") || "";
    const allowed = (env.CORS_ORIGIN || origin || "*").trim() || "*";
    const headers = new Headers(res.headers);
    headers.set("access-control-allow-origin", allowed === "*" ? "*" : allowed);
    headers.set("access-control-allow-methods", "GET, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    headers.set("vary", "origin");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function listFromCsv(raw?: string): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T | null; latencyMs: number; error?: string }> {
    const t0 = Date.now();
    try {
        const value = await fn();
        return { value, latencyMs: Date.now() - t0 };
    } catch (e) {
        return { value: null, latencyMs: Date.now() - t0, error: e instanceof Error ? e.message : "Error" };
    }
}

async function appwriteStatus(env: Env): Promise<ProviderPayload> {
    const nowIso = new Date().toISOString();
    const endpoint = (env.APPWRITE_ENDPOINT || "").trim().replace(/\/$/, "");
    if (!endpoint) {
        return { ok: false, label: "Appwrite", details: "No configurado (APPWRITE_ENDPOINT)", lastUpdatedAtIso: nowIso };
    }

    const { value, latencyMs, error } = await timed(async () => {
        const res = await fetch(`${endpoint}/health`, { method: "GET" });
        const text = await res.text();
        return { ok: res.ok, status: res.status, body: text };
    });

    if (!value) {
        return { ok: false, label: "Appwrite", details: error, latencyMs, lastUpdatedAtIso: nowIso };
    }

    const ok = Boolean((value as any).ok);
    const details = ok ? "Operativo" : `HTTP ${(value as any).status}`;
    return { ok, label: "Appwrite", details, latencyMs, lastUpdatedAtIso: nowIso };
}

async function renderStatus(env: Env): Promise<ProviderPayload> {
    const nowIso = new Date().toISOString();
    const apiKey = (env.RENDER_API_KEY || "").trim();
    const ids = listFromCsv(env.RENDER_SERVICE_IDS);
    if (!apiKey || ids.length === 0) {
        return {
            ok: false,
            label: "Render",
            details: "No configurado (RENDER_API_KEY / RENDER_SERVICE_IDS)",
            lastUpdatedAtIso: nowIso
        };
    }

    const headers = { authorization: `Bearer ${apiKey}` };
    const { value, latencyMs, error } = await timed(async () => {
        const results = await Promise.all(
            ids.map(async (id) => {
                const res = await fetch(`https://api.render.com/v1/services/${encodeURIComponent(id)}`, {
                    method: "GET",
                    headers
                });
                const json = await res.json().catch(() => ({}));
                return { ok: res.ok, id, json };
            })
        );
        return results;
    });

    if (!value) return { ok: false, label: "Render", details: error, latencyMs, lastUpdatedAtIso: nowIso };

    const list = value as any[];
    const okCount = list.filter((x) => x.ok).length;
    const ok = okCount === list.length;
    const details = ok
        ? `Servicios OK: ${okCount}/${list.length}`
        : `Servicios con error: ${list.length - okCount}/${list.length}`;

    return { ok, label: "Render", details, latencyMs, lastUpdatedAtIso: nowIso };
}

async function cloudflareStatus(env: Env): Promise<ProviderPayload> {
    const nowIso = new Date().toISOString();
    const token = (env.CLOUDFLARE_API_TOKEN || "").trim();
    const accountId = (env.CLOUDFLARE_ACCOUNT_ID || "").trim();
    const workerNames = listFromCsv(env.CF_WORKER_NAMES);
    const pagesNames = listFromCsv(env.CF_PAGES_PROJECT_NAMES);

    if (!token || !accountId) {
        return {
            ok: false,
            label: "Cloudflare",
            details: "No configurado (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID)",
            lastUpdatedAtIso: nowIso
        };
    }

    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`;

    const { value, latencyMs, error } = await timed(async () => {
        const [workers, pages] = await Promise.all([
            workerNames.length
                ? fetch(`${base}/workers/scripts`, { method: "GET", headers }).then((r) => r.json().catch(() => null))
                : Promise.resolve(null),
            pagesNames.length
                ? fetch(`${base}/pages/projects`, { method: "GET", headers }).then((r) => r.json().catch(() => null))
                : Promise.resolve(null)
        ]);

        return { workers, pages };
    });

    if (!value) return { ok: false, label: "Cloudflare", details: error, latencyMs, lastUpdatedAtIso: nowIso };

    const workersRes = (value as any).workers;
    const pagesRes = (value as any).pages;

    const workerOk = !workerNames.length || Boolean(workersRes?.success);
    const pagesOk = !pagesNames.length || Boolean(pagesRes?.success);
    const ok = workerOk && pagesOk;

    const workerCount = Array.isArray(workersRes?.result) ? workersRes.result.length : 0;
    const pagesCount = Array.isArray(pagesRes?.result) ? pagesRes.result.length : 0;

    const details = [
        workerNames.length ? `Workers: ${workerCount}` : null,
        pagesNames.length ? `Pages: ${pagesCount}` : null
    ]
        .filter(Boolean)
        .join(" · ");

    return {
        ok,
        label: "Cloudflare",
        details: details || "Operativo",
        latencyMs,
        lastUpdatedAtIso: nowIso
    };
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        if (req.method === "OPTIONS") return withCors(req, env, new Response(null, { status: 204 }));
        if (req.method !== "GET") return withCors(req, env, json(405, { error: "Method not allowed" }));

        const [appwrite, render, cloudflare] = await Promise.all([
            appwriteStatus(env),
            renderStatus(env),
            cloudflareStatus(env)
        ]);

        const payload = {
            appwrite,
            render,
            cloudflare,
            links: {
                appwrite: (env.APPWRITE_CONSOLE_URL || "").trim() || undefined,
                render: (env.RENDER_CONSOLE_URL || "").trim() || undefined,
                cloudflare: (env.CLOUDFLARE_CONSOLE_URL || "").trim() || undefined
            }
        };

        return withCors(req, env, json(200, payload));
    }
};

