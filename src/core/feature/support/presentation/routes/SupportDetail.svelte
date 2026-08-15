<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { supportInboxStore } from "../viewmodel/support-inbox.store";
    import type { SupportMessage, SupportStatus } from "../../domain/entity/SupportMessage";
    import { ArrowLeft, Clock, Mail, MessageSquareText, Send } from "lucide-svelte";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const threadId = navBackStackEntry?.args?.id ?? "";
    let loading = false;
    let message: SupportMessage | null = null;
    let draft = "";
    let threadEl: HTMLDivElement | null = null;

    $: message = threadId ? $supportInboxStore.items.find((m) => m.id === threadId) ?? null : null;
    $: messages = $supportInboxStore.messages;
    $: messagesLoading = $supportInboxStore.messagesLoading;
    $: posting = $supportInboxStore.posting;
    $: closed = message?.status === "cerrado";

    async function scrollToBottom() {
        await tick();
        if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
    }

    $: if (messages.length) {
        scrollToBottom();
    }

    onMount(() => {
        if (!threadId) return;
        loading = true;
        const tasks: Promise<unknown>[] = [];
        if (!message) tasks.push(supportInboxStore.syncAll());
        tasks.push(supportInboxStore.loadMessages(threadId));
        Promise.all(tasks)
            .then(() => supportInboxStore.markStaffRead(threadId))
            .catch((e) => {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error("No se pudo cargar el hilo.");
            })
            .finally(() => (loading = false));

        const stop = supportInboxStore.startRealtime();
        return () => {
            stop();
            supportInboxStore.clearActiveThread();
        };
    });

    onDestroy(() => {
        supportInboxStore.clearActiveThread();
    });

    function back() {
        navController.popBackStack();
    }

    async function setStatus(next: SupportStatus) {
        if (!threadId) return;
        try {
            await supportInboxStore.setStatus(threadId, next);
            toastStore.success("Estado actualizado", 1200);
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error("No se pudo actualizar el estado.");
        }
    }

    async function sendReply() {
        if (!threadId || closed) return;
        const text = draft.trim();
        if (!text) return;
        try {
            await supportInboxStore.postStaffReply(threadId, text);
            draft = "";
            toastStore.success("Respuesta enviada", 1200);
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e?.message ?? "No se pudo enviar la respuesta.");
        }
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendReply();
        }
    }
</script>

<section class="mgmt-container">
    <header class="mgmt-page-head">
        <div class="mgmt-page-title">
            <button class="mgmt-btn ghost" type="button" on:click={back}>
                <Icon icon={ArrowLeft} size={18} ariaLabel="Volver" />
                Volver
            </button>
            <div>
                <h1 class="mgmt-h1">Hilo de soporte</h1>
                <p class="mgmt-muted">Conversación con el cliente</p>
            </div>
        </div>
    </header>

    {#if !threadId}
        <div class="mgmt-card">
            <p class="mgmt-muted">Falta el id del hilo.</p>
        </div>
    {:else if loading && !message}
        <div class="mgmt-card">
            <p class="mgmt-muted">Cargando...</p>
        </div>
    {:else if !message}
        <div class="mgmt-card">
            <p class="mgmt-muted">No se encontró el hilo.</p>
        </div>
    {:else}
        <div class="detail-card">
            <div class="detail-head">
                <div class="detail-title">
                    <div class="detail-ico">
                        <Icon icon={MessageSquareText} size={18} ariaLabel="Hilo" />
                    </div>
                    <div>
                        <h2 class="subject">{message.subject || "Sin asunto"}</h2>
                        <div class="meta">
                            <span class="meta-item">
                                <Icon icon={Mail} size={14} ariaLabel="De" />
                                {message.fromName || "—"} · {message.fromEmail || "sin email"}
                            </span>
                            <span class="meta-item">
                                <Icon icon={Clock} size={14} ariaLabel="Fecha" />
                                {new Date(message.createdAtIso).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="status-actions">
                    <span class="pill {message.status}">{message.status}</span>
                    <div class="btns">
                        <button class="mgmt-btn sm" type="button" on:click={() => setStatus("nuevo")}>
                            Nuevo
                        </button>
                        <button class="mgmt-btn sm ghost" type="button" on:click={() => setStatus("en_proceso")}>
                            En proceso
                        </button>
                        <button class="mgmt-btn sm ghost" type="button" on:click={() => setStatus("resuelto")}>
                            Resuelto
                        </button>
                        <button class="mgmt-btn sm ghost" type="button" on:click={() => setStatus("cerrado")}>
                            Cerrado
                        </button>
                    </div>
                </div>
            </div>

            <div class="chat-wrap" bind:this={threadEl}>
                {#if messagesLoading && messages.length === 0}
                    <p class="mgmt-muted center">Cargando mensajes…</p>
                {:else if messages.length === 0}
                    <p class="mgmt-muted center">Sin mensajes en este hilo aún.</p>
                {:else}
                    {#each messages as msg (msg.id)}
                        <div class="bubble-row" class:staff={msg.senderRole === "staff"} class:user={msg.senderRole === "user"}>
                            <div class="bubble">
                                <div class="bubble-head">
                                    <span class="who">{msg.senderName || (msg.senderRole === "staff" ? "Soporte" : "Cliente")}</span>
                                    <span class="when">{new Date(msg.createdAtIso).toLocaleString()}</span>
                                </div>
                                <p class="bubble-body">{msg.body}</p>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="composer">
                {#if closed}
                    <p class="mgmt-muted closed-hint">Hilo cerrado — no se pueden enviar más respuestas.</p>
                {:else}
                    <textarea
                        class="composer-input"
                        rows="3"
                        placeholder="Escribe una respuesta… (Ctrl+Enter para enviar)"
                        bind:value={draft}
                        on:keydown={onKeydown}
                        disabled={posting}
                    ></textarea>
                    <div class="composer-actions">
                        <button
                            class="mgmt-btn"
                            type="button"
                            disabled={posting || !draft.trim()}
                            on:click={sendReply}
                        >
                            <Icon icon={Send} size={16} ariaLabel="Enviar" />
                            {posting ? "Enviando…" : "Responder"}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</section>

<style>
    .detail-card {
        border-radius: 22px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        box-shadow: 0 18px 44px color-mix(in srgb, black 35%, transparent);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: min(70vh, 720px);
    }

    .detail-head {
        padding: 16px;
        display: grid;
        gap: 14px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .detail-title {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: start;
    }

    .detail-ico {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    }

    .subject {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        margin-top: 6px;
        font-size: 0.85rem;
        opacity: 0.85;
    }

    .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .status-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
    }

    .btns {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .pill {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .pill.nuevo {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
    }

    .pill.en_proceso {
        border-color: color-mix(in srgb, #f59e0b 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 14%, transparent);
    }

    .pill.resuelto {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
    }

    .pill.cerrado {
        border-color: color-mix(in srgb, #94a3b8 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #94a3b8 12%, transparent);
    }

    .chat-wrap {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: color-mix(in srgb, var(--md-sys-color-surface-container-low, var(--md-sys-color-surface)) 88%, transparent);
        min-height: 220px;
        max-height: 42vh;
    }

    .center {
        text-align: center;
        margin: 24px auto;
    }

    .bubble-row {
        display: flex;
        width: 100%;
    }

    .bubble-row.user {
        justify-content: flex-start;
    }

    .bubble-row.staff {
        justify-content: flex-end;
    }

    .bubble {
        max-width: min(520px, 88%);
        border-radius: 16px;
        padding: 10px 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 96%, transparent);
    }

    .bubble-row.staff .bubble {
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, var(--md-sys-color-surface));
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--md-sys-color-outline-variant));
    }

    .bubble-head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 0.72rem;
        opacity: 0.8;
        margin-bottom: 4px;
    }

    .who {
        font-weight: 700;
    }

    .bubble-body {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.45;
        font-size: 0.95rem;
    }

    .composer {
        border-top: 1px solid var(--md-sys-color-outline-variant);
        padding: 12px 16px 16px;
        display: grid;
        gap: 10px;
    }

    .composer-input {
        width: 100%;
        resize: vertical;
        min-height: 72px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 94%, transparent);
        color: inherit;
        padding: 12px 14px;
        font: inherit;
    }

    .composer-input:focus {
        outline: 2px solid color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
        outline-offset: 1px;
    }

    .composer-actions {
        display: flex;
        justify-content: flex-end;
    }

    .closed-hint {
        margin: 0;
        text-align: center;
        padding: 8px;
    }
</style>
