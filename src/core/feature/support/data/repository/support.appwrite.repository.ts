import { ID, Query, type Databases, type Models } from "appwrite";
import { client } from "../../../../infrastructure/di/appwrite.config";
import { ENV } from "../../../../infrastructure/env";
import type { SupportChatMessageDTO, SupportThreadDTO } from "../dto/SupportMessageDTO";
import {
    supportChatMessageFromDTO,
    supportThreadFromDTO,
    threadDtoToInboxRow,
    type SupportChatMessageWritePayload,
    type SupportThreadWritePayload
} from "../mapper/Mappers";
import type {
    SupportChatMessage,
    SupportMessage,
    SupportStatus,
    SupportThread
} from "../../domain/entity/SupportMessage";
import type {
    SupportRealtimeEvent,
    SupportRealtimeUnsubscribe,
    SupportRepository
} from "../../domain/repository/support.repository";

const THREADS_COLLECTION = "support_threads";
const MESSAGES_COLLECTION = "support_messages";
const LOG = "[support:appwrite]";

function databaseId(): string {
    const id = ENV.databaseId;
    if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID");
    return id;
}

function channelsFor(collectionId: string): string[] {
    const db = databaseId();
    return [
        `databases.${db}.collections.${collectionId}.documents`
    ];
}

export class SupportAppwriteRepository implements SupportRepository {
    constructor(private readonly databases: Databases) {}

    async getAll(): Promise<SupportMessage[]> {
        const threads = await this.listThreads();
        return threads
            .map((t) => threadDtoToInboxRow({
                $id: t.id,
                $createdAt: t.createdAtIso,
                userId: t.userId,
                userName: t.userName,
                userEmail: t.userEmail,
                reason: t.reason,
                subject: t.subject,
                status: t.status,
                lastMessageAt: t.lastMessageAt,
                lastPreview: t.lastPreview,
                lastSenderRole: t.lastSenderRole,
                unreadStaff: t.unreadStaff,
                unreadUser: t.unreadUser
            }))
            .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
    }

    async listThreads(): Promise<SupportThread[]> {
        const res = await this.databases.listDocuments<SupportThreadDTO & Models.Document>(
            databaseId(),
            THREADS_COLLECTION,
            [Query.orderDesc("lastMessageAt"), Query.limit(100)]
        );
        return res.documents.map((d) => supportThreadFromDTO(d));
    }

    async getThread(id: string): Promise<SupportThread | null> {
        try {
            const doc = await this.databases.getDocument<SupportThreadDTO & Models.Document>(
                databaseId(),
                THREADS_COLLECTION,
                id
            );
            return supportThreadFromDTO(doc);
        } catch {
            return null;
        }
    }

    async listMessages(threadId: string): Promise<SupportChatMessage[]> {
        const res = await this.databases.listDocuments<SupportChatMessageDTO & Models.Document>(
            databaseId(),
            MESSAGES_COLLECTION,
            [
                Query.equal("threadId", threadId),
                Query.orderAsc("createdAtIso"),
                Query.limit(200)
            ]
        );
        return res.documents.map((d) => supportChatMessageFromDTO(d));
    }

    async createThread(payload: SupportThreadWritePayload, documentId?: string): Promise<SupportThread> {
        const doc = await this.databases.createDocument<SupportThreadDTO & Models.Document>(
            databaseId(),
            THREADS_COLLECTION,
            documentId?.trim() || ID.unique(),
            payload as unknown as SupportThreadDTO
        );
        return supportThreadFromDTO(doc);
    }

    async postMessage(
        payload: SupportChatMessageWritePayload,
        documentId?: string
    ): Promise<SupportChatMessage> {
        const doc = await this.databases.createDocument<SupportChatMessageDTO & Models.Document>(
            databaseId(),
            MESSAGES_COLLECTION,
            documentId?.trim() || ID.unique(),
            payload as unknown as SupportChatMessageDTO
        );
        return supportChatMessageFromDTO(doc);
    }

    async updateStatus(id: string, status: SupportStatus): Promise<void> {
        await this.databases.updateDocument(databaseId(), THREADS_COLLECTION, id, { status });
    }

    async touchThread(
        id: string,
        patch: Partial<{
            status: SupportStatus;
            lastMessageAt: string;
            lastPreview: string;
            lastSenderRole: "user" | "staff";
            unreadStaff: number;
            unreadUser: number;
        }>
    ): Promise<void> {
        await this.databases.updateDocument(databaseId(), THREADS_COLLECTION, id, patch);
    }

    subscribe(handler: (event: SupportRealtimeEvent) => void): SupportRealtimeUnsubscribe {
        if (!ENV.appwriteEndpoint || !ENV.appwriteProjectId || !ENV.databaseId) {
            console.warn(`${LOG} RT omitido: Appwrite no configurado`);
            return () => {};
        }

        const threadChannels = channelsFor(THREADS_COLLECTION);
        const messageChannels = channelsFor(MESSAGES_COLLECTION);
        const allChannels = [...threadChannels, ...messageChannels];

        let unsub: (() => void) | null = null;
        try {
            unsub = (client as unknown as {
                subscribe: (
                    channels: string | string[],
                    cb: (res: { events: string[]; payload?: unknown }) => void
                ) => () => void;
            }).subscribe(allChannels, (res) => {
                const events = Array.isArray(res?.events) ? res.events : [];
                const joined = events.join(" ");
                let target: SupportRealtimeEvent["target"] = "unknown";
                if (joined.includes(THREADS_COLLECTION)) target = "threads";
                else if (joined.includes(MESSAGES_COLLECTION)) target = "messages";
                handler({ events, target });
            });
            console.info(`${LOG} RT subscribed threads+messages`);
        } catch (e) {
            console.warn(`${LOG} RT subscribe failed`, e);
            return () => {};
        }

        return () => {
            try {
                unsub?.();
            } catch {
                // ignore
            }
        };
    }
}
