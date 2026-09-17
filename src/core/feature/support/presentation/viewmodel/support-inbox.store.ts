import { derived, writable } from "svelte/store";
import { supportContainer } from "../../di/support.container";
import type {
    SupportChatMessage,
    SupportMessage,
    SupportStatus
} from "../../domain/entity/SupportMessage";
import { sessionStore } from "../../../auth/presentation/viewmodel/session.store";
import { isAppwriteDataStackDisabled } from "../../../../infrastructure/platform.flags";

type SupportInboxState = {
    items: SupportMessage[];
    loading: boolean;
    error: string | null;
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

function asString(value: unknown, fallback = ""): string {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return fallback;
}

function createSupportInboxStore() {
    const { subscribe, update } = writable<SupportInboxState>(initialState);
    let unsubscribe: (() => void) | null = null;
    let syncTimer: number | null = null;
    let rtRefCount = 0;

    function getState(): SupportInboxState {
        let s: SupportInboxState = initialState;
        const u = subscribe((v) => {
            s = v;
        });
        u();
        return s;
    }

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

    async function updateStatus(id: string, status: SupportStatus): Promise<void> {
        try {
            await supportContainer.useCases.inbox.updateStatus(id, status);
            update((s) => ({
                ...s,
                items: s.items.map((m) => (m.id === id ? { ...m, status } : m))
            }));
        } catch (e) {
            update((s) => ({ ...s, error: normalizeError(e) }));
            throw e;
        }
    }

    async function postStaffReply(threadId: string, body: string): Promise<void> {
        const text = body.trim();
        const id = threadId?.trim();
        if (!text) throw new Error("Escribe un mensaje");
        if (!id) throw new Error("Consulta inválida");

        update((s) => ({ ...s, posting: true, error: null }));
        try {
            const user = await sessionStore.getCurrentUser();
            const u = user as Record<string, unknown>;
            await supportContainer.useCases.threads.postMessage({
                threadId: id,
                senderRole: "staff",
                senderId: asString(u.$id) || asString(u.id),
                senderName: asString(u.name) || "Staff",
                body: text
            });
            try {
                await loadMessages(id);
            } catch {
                /* ignore */
            }
            try {
                await syncAll();
            } catch {
                /* ignore */
            }
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
        if (isAppwriteDataStackDisabled()) {
            return () => {};
        }
        rtRefCount += 1;
        if (!unsubscribe) {
            unsubscribe = supportContainer.useCases.inbox.subscribe(() => {
                if (syncTimer) window.clearTimeout(syncTimer);
                syncTimer = window.setTimeout(() => {
                    void (async () => {
                        const activeId = getState().activeThreadId;
                        try {
                            await syncAll();
                        } catch {
                            /* badge/list best-effort */
                        }
                        if (activeId) {
                            try {
                                await loadMessages(activeId);
                            } catch {
                                /* ignore */
                            }
                        }
                    })();
                }, 180);
            });
        }
        return () => {
            rtRefCount = Math.max(0, rtRefCount - 1);
            if (rtRefCount === 0) {
                stopRealtime();
            }
        };
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
        rtRefCount = 0;
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
        counts,
        syncAll,
        loadMessages,
        updateStatus,
        postStaffReply,
        clearActiveThread,
        startRealtime,
        stopRealtime
    };
}

export const supportInboxStore = createSupportInboxStore();
