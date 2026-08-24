/** Documento Appwrite `support_threads` (+ legacy Pulse). */
export interface SupportThreadDTO {
    $id?: string;
    id?: string;
    $createdAt?: string;
    $updatedAt?: string;

    userId?: string;
    userName?: string;
    userEmail?: string;
    reason?: string;
    subject?: string;
    status?: string;
    lastMessageAt?: string;
    lastPreview?: string;
    lastSenderRole?: string;
    unreadStaff?: number;
    unreadUser?: number;
}

/** Documento Appwrite `support_messages`. */
export interface SupportChatMessageDTO {
    $id?: string;
    id?: string;
    $createdAt?: string;

    threadId?: string;
    senderRole?: string;
    senderId?: string;
    senderName?: string;
    body?: string;
    createdAtIso?: string;
}

/** @deprecated Alias legacy Pulse — preferir SupportThreadDTO. */
export interface SupportMessageDTO {
    id?: string;
    $id?: string;
    createdAtIso?: string;
    $createdAt?: string;
    created_at?: string;
    from_name?: string;
    from_email?: string;
    reason?: string;
    status?: string;
    subject?: string;
    body?: string;
}
