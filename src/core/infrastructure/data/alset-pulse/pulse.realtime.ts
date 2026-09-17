import Pusher from "pusher-js";
import { ENV } from "../../env";
import { getStockChannelName, parseStockChangedPayload, type StockChangedPayload } from "./stock-pulse";
import { getSalesChannelName } from "./sale-pulse";

export type PulseUnsubscribe = () => void;

let pusherSingleton: Pusher | null = null;

function getPusher(): Pusher | null {
    if (!ENV.pusherKey || !ENV.pusherCluster) {
        console.warn("[Pusher] Missing key/cluster");
        return null;
    }
    if (pusherSingleton) return pusherSingleton;
    try {
        pusherSingleton = new Pusher(ENV.pusherKey, {
            cluster: ENV.pusherCluster,
            forceTLS: true,
        });
        console.info(`[Pusher] init key=${ENV.pusherKey.slice(0, 6)}… cluster=${ENV.pusherCluster}`);
        return pusherSingleton;
    } catch (e) {
        console.error("[Pusher] init failed", e);
        return null;
    }
}

export function subscribeSupportInbox(handler: (eventName: string, payload: unknown) => void): PulseUnsubscribe {
    const pusher = getPusher();
    if (!pusher) return () => {};
    const channelName = ENV.pusherSupportChannel || "support-inbox";
    const channel = pusher.subscribe(channelName);
    const events = ["support:new", "support:updated", "support:status"];
    for (const e of events) channel.bind(e, (p: unknown) => handler(e, p));
    return () => {
        for (const e of events) channel.unbind(e);
        pusher.unsubscribe(channelName);
    };
}

export function subscribePulseChannelAll(handler: (eventName: string, payload: unknown) => void): PulseUnsubscribe {
    const pusher = getPusher();
    if (!pusher) return () => {};
    const names = [
        ENV.pusherSupportChannel || "support-inbox",
        getStockChannelName(),
        getSalesChannelName(),
    ];
    const unsubs: (() => void)[] = [];
    for (const name of names) {
        const channel = pusher.subscribe(name);
        const gh = (eventName: string, payload: unknown) => handler(eventName, payload);
        channel.bind_global(gh);
        unsubs.push(() => {
            channel.unbind_global(gh);
            pusher.unsubscribe(name);
        });
    }
    console.info(`[Pusher] multi-channel: ${names.join(" + ")}`);
    return () => { for (const u of unsubs) u(); };
}

export function subscribeStockUpdates(handler: (payload: StockChangedPayload) => void): PulseUnsubscribe {
    const pusher = getPusher();
    if (!pusher) return () => {};
    const channelName = getStockChannelName();
    const channel = pusher.subscribe(channelName);
    channel.bind("stock:changed", (payload: unknown) => {
        const parsed = parseStockChangedPayload(payload);
        if (parsed) handler(parsed);
    });
    return () => {
        channel.unbind("stock:changed");
        pusher.unsubscribe(channelName);
    };
}

export function subscribePulseRefresh(handler: (eventName: string, payload: unknown) => void): PulseUnsubscribe {
    const refreshEvents = ["refresh:all", "refresh:support", "refresh:sales", "all:refresh", "support:refresh", "sales:refresh"];
    return subscribePulseChannelAll((eventName, payload) => {
        if (!refreshEvents.includes(String(eventName))) return;
        handler(eventName, payload);
    });
}
