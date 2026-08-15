/** Motivo de la consulta de soporte. */
export type SupportReason = "soporte" | "pregunta_tecnica" | "facturacion" | "otro";

/** Estado del hilo (thread). */
export type SupportStatus = "nuevo" | "en_proceso" | "resuelto" | "cerrado";

export type SupportSenderRole = "user" | "staff";

/**
 * Hilo de soporte (colección `support_threads`).
 */
export interface SupportThread {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    reason: SupportReason;
    subject: string;
    status: SupportStatus;
    lastMessageAt: string;
    lastPreview: string;
    lastSenderRole: SupportSenderRole;
    unreadStaff: number;
    unreadUser: number;
    createdAtIso: string;
}

/**
 * Mensaje dentro de un hilo (colección `support_messages`).
 */
export interface SupportChatMessage {
    id: string;
    threadId: string;
    senderRole: SupportSenderRole;
    senderId: string;
    senderName: string;
    body: string;
    createdAtIso: string;
}

/**
 * Fila del inbox del panel (proyección de un thread para la UI actual).
 * `body` = lastPreview del hilo.
 */
export interface SupportMessage {
    id: string;
    createdAtIso: string;
    fromName: string;
    fromEmail: string;
    reason: SupportReason;
    status: SupportStatus;
    subject: string;
    body: string;
    /** Campos extra del hilo (opcionales para UI actual). */
    userId?: string;
    unreadStaff?: number;
    lastSenderRole?: SupportSenderRole;
}

export function threadToInboxRow(thread: SupportThread): SupportMessage {
    return {
        id: thread.id,
        createdAtIso: thread.lastMessageAt || thread.createdAtIso,
        fromName: thread.userName,
        fromEmail: thread.userEmail,
        reason: thread.reason,
        status: thread.status,
        subject: thread.subject,
        body: thread.lastPreview,
        userId: thread.userId,
        unreadStaff: thread.unreadStaff,
        lastSenderRole: thread.lastSenderRole
    };
}
