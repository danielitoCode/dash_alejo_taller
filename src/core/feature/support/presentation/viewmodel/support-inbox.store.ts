import { derived, writable } from "svelte/store";
import { supportContainer } from "../../di/support.container";
import type {
    SupportChatMessage,
    SupportMessage,
    SupportStatus
} from "../../domain/entity/SupportMessage";
import { sessionStore } from "../../../auth/presentation/viewmodel/session.store";

type SupportInboxState = {
    items: SupportMessage[];
    loading: boolean;
    error: string | null;
    /** Mensajes del hilo abierto en detail (cache). */
    activeThreadId: string | null;
    messages: SupportChatMessage[];
    messagesLoading: boolean;
    posting: boolean;
};

const initialState: SupportInboxState = {
    items: [],
    loading: false,
    error: null,
    activeThreadId: null,
    messages: [],
    messagesLoading: false,
    posting: false
};

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createSupportInboxStore() {
    const { subscribe, update } = writable<SupportInboxState>(initialState);
    let unsubscribe: (() => void) | null = null;
    let syncTimer: number | null = null;

    async function syncAll(): Promise<void> {
        update((s) => ({ ...s, loading: true, error: null }));
        try {
            const items = await supportContainer.useCases.inbox.getAll();
            update((s) => ({ ...s, items }));
        } catch (e) {
            update((s) => ({ ...s, error: normalizeError(e) }));
            throw e;
        } finally {
            update((s) => ({ ...s, loading: false }));
        }
    }

    async function setStatus(id: string, status: SupportStatus): Promise<void> {
        await supportContainer.useCases.inbox.updateStatus(id, status);
        update((s) => ({
            ...s,
            items: s.items.map((m) => (m.id === id ? { ...m, status } : m))
        }));
    }

    async function loadMessages(threadId: string): Promise<void> {
        update((s) => ({
            ...s,
            activeThreadId: threadId,
            messagesLoading: true,
            error: null
        }));
        try {
            const messages = await supportContainer.useCases.threads.listMessages(threadId);
            update((s) => ({ ...s, messages }));
        } catch (e) {
            update((s) => ({ ...s, error: normalizeError(e), messages: [] }));
            throw e;
        } finally {
            update((s) => ({ ...s, messagesLoading: false }));
        }
    }

    async function markStaffRead(threadId: string): Promise<void> {
        try {
            await supportContainer.useCases.threads.markRead(threadId, "staff");
            update((s) => ({
                ...s,
                items: s.items.map((m) =>
                    m.id === threadId ? { ...m, unreadStaff: 0 } : m
                )
            }));
        } catch {
            // no bloquear UI
        }
    }

    async function postStaffReply(threadId: string, body: string): Promise<void> {
        const text = body.trim();
        if (!text) throw new Error("Escribe un mensaje");

        update((s) => ({ ...s, posting: true, error: null }));
        try {
            let senderId = "staff";
            let senderName = "Soporte";
            try {
                const user = await sessionStore.getCurrentUser();
                senderId = user.$id || senderId;
                senderName = user.name || user.email || senderName;
            } catch {
                // sesión no disponible: snapshot genérico
            }

            await supportContainer.useCases.threads.postMessage({
                threadId,
                senderRole: "staff",
                senderId,
                senderName,
                body: text,
                nextStatus: "en_proceso"
            });

            await loadMessages(threadId);
            await syncAll();
        } catch (e) {
            update((s) => ({ ...s, error: normalizeError(e) }));
            throw e;
        } finally {
            update((s) => ({ ...s, posting: false }));
        }
    }

    function clearActiveThread(): void {
        update((s) => ({
            ...s,
            activeThreadId: null,
            messages: [],
            messagesLoading: false
        }));
    }

    function startRealtime(): () => void {
        stopRealtime();
        unsubscribe = supportContainer.useCases.inbox.subscribe(() => {
            if (syncTimer) window.clearTimeout(syncTimer);
            syncTimer = window.setTimeout(() => {
                let activeId: string | null = null;
                const unsubSnap = subscribe((s) => {
                    activeId = s.activeThreadId;
                });
                unsubSnap();
                syncAll().catch(() => {});
                if (activeId) {
                    loadMessages(activeId).catch(() => {});
                }
            }, 220);
        });
        return stopRealtime;
    }

    function stopRealtime(): void {
        if (syncTimer) {
            window.clearTimeout(syncTimer);
            syncTimer = null;
        }
        if (unsubscribe) {
            try {
                unsubscribe();
            } catch {
                // ignore
            }
            unsubscribe = null;
        }
    }

    const counts = derived({ subscribe }, ($s) => {
        const total = $s.items.length;
        const nuevo = $s.items.filter((m) => m.status === "nuevo").length;
        const enProceso = $s.items.filter((m) => m.status === "en_proceso").length;
        const resuelto = $s.items.filter((m) => m.status === "resuelto").length;
        const cerrado = $s.items.filter((m) => m.status === "cerrado").length;
        const unread = $s.items.reduce((acc, m) => acc + (m.unreadStaff ?? 0), 0);
        return { total, nuevo, enProceso, resuelto, cerrado, unread };
    });

    return {
        subscribe,
        syncAll,
        setStatus,
        loadMessages,
        markStaffRead,
        postStaffReply,
        clearActiveThread,
        startRealtime,
        stopRealtime,
        counts
    };
}

export const supportInboxStore = createSupportInboxStore();
