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
    const data = payload as Partial<StockChangedPayload>;
    const productIds = Array.isArray(data.productIds)
        ? data.productIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
    if (productIds.length === 0) return null;
    return {
        productIds: [...new Set(productIds)],
        reason: (data.reason as StockChangeReason) || "hold",
        saleId: data.saleId ?? null,
        timestamp: typeof data.timestamp === "string" ? data.timestamp : new Date().toISOString(),
    };
}
