import { triggerPusherEvent } from "./pusher-trigger";

export type StockChangeReason = "hold" | "release" | "consume" | "entry" | "adjustment";

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
        } catch { /* ignore */ }
    }
    if (typeof BroadcastChannel !== "undefined") {
        try {
            const bc = new BroadcastChannel(STOCK_BROADCAST_NAME);
            bc.postMessage({ type: "stock:changed", data: body });
            bc.close();
        } catch { /* ignore */ }
    }
}

export function parseStockChangedPayload(payload: unknown): StockChangedPayload | null {
    if (!payload || typeof payload !== "object") return null;
    const any = payload as Record<string, unknown>;
    const rawIds = any.productIds ?? any.product_ids;
    const productIds = Array.isArray(rawIds)
        ? rawIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
    if (productIds.length === 0) return null;
    return {
        productIds,
        reason: (any.reason as StockChangedPayload["reason"]) || "hold",
        saleId: (any.saleId as string | null | undefined) ?? null,
        timestamp: typeof any.timestamp === "string" ? any.timestamp : new Date().toISOString(),
    };
}

export function subscribeStockChanged(handler: (body: StockChangedPayload) => void): () => void {
    const onEvent = (ev: Event) => {
        const parsed = parseStockChangedPayload((ev as CustomEvent).detail);
        if (parsed) handler(parsed);
    };
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined") window.addEventListener(STOCK_CHANGED_EVENT, onEvent);
    if (typeof BroadcastChannel !== "undefined") {
        try {
            bc = new BroadcastChannel(STOCK_BROADCAST_NAME);
            bc.onmessage = (msg) => {
                const data = msg?.data?.data ?? msg?.data;
                const parsed = parseStockChangedPayload(data);
                if (parsed) handler(parsed);
            };
        } catch { bc = null; }
    }
    return () => {
        if (typeof window !== "undefined") window.removeEventListener(STOCK_CHANGED_EVENT, onEvent);
        bc?.close();
    };
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
    const result = await triggerPusherEvent(getStockChannelName(), "stock:changed", body);
    if (result.ok) console.info(`[stock-rt] publish OK via=${result.via}`);
    else console.warn(`[stock-rt] publish omitido: ${result.reason}`);
}
