import { ENV } from "../../env";

/**
 * Canales públicos Pusher (Core6).
 * Defaults alineados con .env del proyecto.
 */
export const PUSHER_CHANNELS = {
    stock: () =>
        (ENV.pusherStockChannel as string | undefined)?.trim() ||
        (import.meta.env.VITE_PUSHER_STOCK_CHANNEL as string | undefined)?.trim() ||
        "stock-updates",
    sales: () =>
        (ENV.pusherSalesChannel as string | undefined)?.trim() ||
        (import.meta.env.VITE_PUSHER_SALES_CHANNEL as string | undefined)?.trim() ||
        "sale-updates",
    support: () =>
        (ENV.pusherSupportChannel as string | undefined)?.trim() ||
        "support-updates",
    promo: () =>
        (ENV.pusherPromoChannel as string | undefined)?.trim() ||
        "promotions-updates",
    notification: () =>
        (ENV.pusherNotificationChannel as string | undefined)?.trim() ||
        "notifications-updates",
    ia: () =>
        (ENV.pusherIaChannel as string | undefined)?.trim() ||
        "ia-channel-updates",
} as const;
