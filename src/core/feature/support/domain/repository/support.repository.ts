import type {
    SupportChatMessage,
    SupportMessage,
    SupportStatus,
    SupportThread
} from "../entity/SupportMessage";
import type { SupportChatMessageWritePayload, SupportThreadWritePayload } from "../../data/mapper/Mappers";

export type SupportRealtimeEvent = {
    events: string[];
    /** threads | messages | unknown */
    target?: "threads" | "messages" | "unknown";
};

export type SupportRealtimeUnsubscribe = () => void;

export interface SupportRepository {
    /** Inbox del panel: threads proyectados a filas SupportMessage. */
    getAll(): Promise<SupportMessage[]>;

    listThreads(): Promise<SupportThread[]>;

    getThread(id: string): Promise<SupportThread | null>;

    listMessages(threadId: string): Promise<SupportChatMessage[]>;

    createThread(payload: SupportThreadWritePayload, documentId?: string): Promise<SupportThread>;

    postMessage(payload: SupportChatMessageWritePayload, documentId?: string): Promise<SupportChatMessage>;

    updateStatus(id: string, status: SupportStatus): Promise<void>;

    /**
     * Actualiza contadores / preview tras un mensaje (staff o user).
     */
    touchThread(
        id: string,
        patch: Partial<{
            status: SupportStatus;
            lastMessageAt: string;
            lastPreview: string;
            lastSenderRole: "user" | "staff";
            unreadStaff: number;
            unreadUser: number;
        }>
    ): Promise<void>;

    subscribe(handler: (event: SupportRealtimeEvent) => void): SupportRealtimeUnsubscribe;
}
