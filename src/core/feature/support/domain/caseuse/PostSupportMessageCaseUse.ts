import type { SupportChatMessage, SupportSenderRole, SupportStatus } from "../entity/SupportMessage";
import type { SupportRepository } from "../repository/support.repository";

export type PostSupportMessageInput = {
    threadId: string;
    senderRole: SupportSenderRole;
    senderId: string;
    senderName: string;
    body: string;
    /** Si staff responde, pasar al menos en_proceso. */
    nextStatus?: SupportStatus;
};

/**
 * Publica un mensaje y actualiza last* / unread del hilo.
 */
export class PostSupportMessageCaseUse {
    constructor(private readonly repo: SupportRepository) {}

    async execute(input: PostSupportMessageInput): Promise<SupportChatMessage> {
        const body = input.body.trim();
        if (!body) throw new Error("El mensaje no puede estar vacío");

        const now = new Date().toISOString();
        const message = await this.repo.postMessage({
            threadId: input.threadId,
            senderRole: input.senderRole,
            senderId: input.senderId,
            senderName: input.senderName,
            body,
            createdAtIso: now
        });

        const preview = body.length > 180 ? `${body.slice(0, 177)}…` : body;
        const patch: Parameters<SupportRepository["touchThread"]>[1] = {
            lastMessageAt: now,
            lastPreview: preview,
            lastSenderRole: input.senderRole
        };

        if (input.senderRole === "staff") {
            patch.unreadUser = 1;
            patch.unreadStaff = 0;
            patch.status = input.nextStatus ?? "en_proceso";
        } else {
            patch.unreadStaff = 1;
        }

        await this.repo.touchThread(input.threadId, patch);
        return message;
    }
}
