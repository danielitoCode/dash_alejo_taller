import { ENV } from "../../env";

export type StockChangeReason = "hold" | "release" | "consume" | "entry";

export interface StockChangedPayload {
    productIds: string[];
    reason: StockChangeReason;
    saleId?: string | null;
    timestamp: string;
}

export const STOCK_CHANGED_EVENT = "alejo:stock-changed";
export const STOCK_BROADCAST_NAME = "alejo-stock-updates";

export function getStockChannelName(): string {
    return (
        (import.meta.env.VITE_PUSHER_STOCK_CHANNEL as string | undefined)?.trim() ||
        "stock-updates"
    );
}

function emitLocal(body: StockChangedPayload): void {
    if (typeof window !== "undefined") {
        try {
            window.dispatchEvent(new CustomEvent(STOCK_CHANGED_EVENT, { detail: body }));
        } catch {
            /* ignore */
        }
    }
    if (typeof BroadcastChannel !== "undefined") {
        try {
            const bc = new BroadcastChannel(STOCK_BROADCAST_NAME);
            bc.postMessage({ type: "stock:changed", data: body });
            bc.close();
        } catch {
            /* ignore */
        }
    }
}

export async function publishStockChanged(payload: StockChangedPayload): Promise<void> {
    const productIds = [...new Set(payload.productIds.filter(Boolean))];
    if (productIds.length === 0) return;

    const body: StockChangedPayload = {
        productIds,
        reason: payload.reason,
        saleId: payload.saleId ?? null,
        timestamp: payload.timestamp || new Date().toISOString(),
    };

    emitLocal(body);

    const base = ENV.pulseBaseUrl?.trim().replace(/\/$/, "");
    const apiKey = ENV.pulseApiKey?.trim();
    if (!base || !apiKey) {
        console.warn(
            "[stock-rt] Pulse HTTP no configurado; solo fan-out local (CustomEvent/BroadcastChannel)."
        );
        return;
    }

    const channel = getStockChannelName();
    try {
        const res = await fetch(`${base}/pulse/stock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "X-Api-Key": apiKey,
            },
            body: JSON.stringify({ channel, event: "stock:changed", data: body }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.warn(`[stock-rt] publish HTTP ${res.status} ${text.slice(0, 200)}`);
        }
    } catch (e) {
        console.error("[stock-rt] publish failed", e);
    }
}

export function parseStockChangedPayload(payload: unknown): StockChangedPayload | null {
    if (!payload || typeof payload !== "object") return null;
    const data = payload as Partial<StockChangedPayload> & { data?: unknown };
    // Algunos buses envuelven en { type, data }
    const inner =
        data.data && typeof data.data === "object" && !Array.isArray(data.productIds)
            ? (data.data as Partial<StockChangedPayload>)
            : data;
    const productIds = Array.isArray(inner.productIds)
        ? inner.productIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
    if (productIds.length === 0) return null;
    return {
        productIds: [...new Set(productIds)],
        reason: (inner.reason as StockChangeReason) || "hold",
        saleId: inner.saleId ?? null,
        timestamp: typeof inner.timestamp === "string" ? inner.timestamp : new Date().toISOString(),
    };
}

/**
 * Escucha cambios de stock: CustomEvent + BroadcastChannel (mismo origen)
 * y canal Pulse/Pusher `stock-updates` (cross-device) si hay key/cluster.
 */
export function subscribeStockChanged(
    handler: (payload: StockChangedPayload) => void
): () => void {
    const cleanups: Array<() => void> = [];

    if (typeof window !== "undefined") {
        const onLocal = (ev: Event) => {
            const parsed = parseStockChangedPayload((ev as CustomEvent).detail);
            if (parsed) handler(parsed);
        };
        window.addEventListener(STOCK_CHANGED_EVENT, onLocal);
        cleanups.push(() => window.removeEventListener(STOCK_CHANGED_EVENT, onLocal));
    }

    if (typeof BroadcastChannel !== "undefined") {
        try {
            const bc = new BroadcastChannel(STOCK_BROADCAST_NAME);
            bc.onmessage = (ev) => {
                const msg = ev?.data;
                if (!msg) return;
                const parsed =
                    parseStockChangedPayload(msg?.data ?? msg) ??
                    (msg?.type === "stock:changed" ? parseStockChangedPayload(msg.data) : null);
                if (parsed) handler(parsed);
            };
            cleanups.push(() => {
                try {
                    bc.close();
                } catch {
                    /* ignore */
                }
            });
        } catch {
            /* ignore */
        }
    }

    // Pulse/Pusher (canal dedicado de stock, cross-device)
    const key = ENV.pusherKey?.trim();
    const cluster = ENV.pusherCluster?.trim();
    if (key && cluster && typeof window !== "undefined") {
        import("pusher-js")
            .then(({ default: Pusher }) => {
                const pusher = new Pusher(key, { cluster, forceTLS: true });
                const channelName = getStockChannelName();
                const channel = pusher.subscribe(channelName);
                const onEvent = (payload: unknown) => {
                    const parsed = parseStockChangedPayload(payload);
                    if (parsed) handler(parsed);
                };
                channel.bind("stock:changed", onEvent);
                channel.bind("stock-changed", onEvent);
                cleanups.push(() => {
                    try {
                        channel.unbind("stock:changed", onEvent);
                        channel.unbind("stock-changed", onEvent);
                        pusher.unsubscribe(channelName);
                        pusher.disconnect();
                    } catch {
                        /* ignore */
                    }
                });
            })
            .catch(() => {
                /* pusher no disponible */
            });
    }

    return () => {
        for (const c of cleanups) {
            try {
                c();
            } catch {
                /* ignore */
            }
        }
    };
}
