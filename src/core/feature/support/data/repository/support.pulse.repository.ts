/**
 * @deprecated Pulse/Pusher path. Prefer SupportAppwriteRepository.
 * Kept for reference; no longer wired in support.container.
 */
import { ENV } from "../../../../infrastructure/env";
import { pulseFetchJson } from "../../../../infrastructure/data/alset-pulse/pulse.http";
import { subscribePulseRefresh } from "../../../../infrastructure/data/alset-pulse/pulse.realtime";
import type { SupportMessageDTO } from "../dto/SupportMessageDTO";
import { supportMessageFromDTO } from "../mapper/Mappers";
import type { SupportChatMessage, SupportMessage, SupportStatus, SupportThread } from "../../domain/entity/SupportMessage";
import type { SupportRealtimeUnsubscribe, SupportRepository } from "../../domain/repository/support.repository";
import type { SupportChatMessageWritePayload, SupportThreadWritePayload } from "../mapper/Mappers";

type SupportListResponse = { items?: SupportMessageDTO[] } | SupportMessageDTO[];

function getMessagesPath(): string {
    return ENV.pulseSupportMessagesPath || "/support/messages";
}

function normalizeListResponse(res: SupportListResponse): SupportMessageDTO[] {
    if (Array.isArray(res)) return res;
    return Array.isArray(res.items) ? res.items : [];
}

export class SupportPulseRepository implements SupportRepository {
    async getAll(): Promise<SupportMessage[]> {
        const res = await pulseFetchJson<SupportListResponse>({ path: getMessagesPath() });
        return normalizeListResponse(res).map(supportMessageFromDTO);
    }

    async listThreads(): Promise<SupportThread[]> {
        throw new Error("Pulse: listThreads no soportado");
    }

    async getThread(): Promise<SupportThread | null> {
        return null;
    }

    async listMessages(): Promise<SupportChatMessage[]> {
        return [];
    }

    async createThread(_payload: SupportThreadWritePayload): Promise<SupportThread> {
        throw new Error("Pulse: createThread no soportado");
    }

    async postMessage(_payload: SupportChatMessageWritePayload): Promise<SupportChatMessage> {
        throw new Error("Pulse: postMessage no soportado");
    }

    async updateStatus(id: string, status: SupportStatus): Promise<void> {
        await pulseFetchJson({
            method: "PATCH",
            path: `${getMessagesPath()}/${encodeURIComponent(id)}`,
            body: { status }
        });
    }

    async touchThread(): Promise<void> {
        throw new Error("Pulse: touchThread no soportado");
    }

    subscribe(handler: (event: { events: string[] }) => void): SupportRealtimeUnsubscribe {
        return subscribePulseRefresh((eventName) => handler({ events: [eventName] }));
    }
}
