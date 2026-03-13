import Pusher, { type Channel } from "pusher-js";
import { ENV } from "../env";

export type PulseUnsubscribe = () => void;

let pusherSingleton: Pusher | null = null;

function getPusher(): Pusher | null {
    if (!ENV.pusherKey || !ENV.pusherCluster) return null;
    if (pusherSingleton) return pusherSingleton;
    pusherSingleton = new Pusher(ENV.pusherKey, {
        cluster: ENV.pusherCluster,
        forceTLS: true
    });
    return pusherSingleton;
}

export function subscribeSupportInbox(handler: (eventName: string, payload: unknown) => void): PulseUnsubscribe {
    const pusher = getPusher();
    if (!pusher) return () => {};

    const channelName = ENV.pusherSupportChannel || "support-inbox";
    const channel = pusher.subscribe(channelName);

    return subscribePulseChannelInternal(pusher, channelName, channel, ["support:new", "support:updated", "support:status"], handler);
}

export function subscribePulseRefresh(handler: (eventName: string, payload: unknown) => void): PulseUnsubscribe {
    const pusher = getPusher();
    if (!pusher) return () => {};

    const channelName = ENV.pusherSupportChannel || "support-inbox";
    const channel = pusher.subscribe(channelName);

    const refreshEvents = [
        "refresh:all",
        "refresh:support",
        "refresh:sales",
        "all:refresh",
        "support:refresh",
        "sales:refresh"
    ];

    return subscribePulseChannelInternal(pusher, channelName, channel, refreshEvents, handler);
}

function subscribePulseChannelInternal(
    pusher: Pusher,
    channelName: string,
    channel: Channel,
    events: string[],
    handler: (eventName: string, payload: unknown) => void
): PulseUnsubscribe {
    for (const eventName of events) channel.bind(eventName, (payload: unknown) => handler(eventName, payload));

    return () => {
        for (const eventName of events) channel.unbind(eventName);
        pusher.unsubscribe(channelName);
    };
}
