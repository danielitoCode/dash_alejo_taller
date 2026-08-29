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
    import { support } from "../../../../infrastructure/presentation/navigation/nested.router";

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

    /** createdAtIso del inbox row = lastMessageAt del hilo; al cambiar, recargar burbujas. */
    let lastSeenMessageAt = "";
    $: if (threadId && message?.createdAtIso && message.createdAtIso !== lastSeenMessageAt) {
        lastSeenMessageAt = message.createdAtIso;
        supportInboxStore.loadMessages(threadId).then(() => scrollToBottom()).catch(() => {});
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

        // NestedNav mantiene RT; ref-count para no matar la suscripción global
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
        navController.popOrNavigate(support.path);
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
        <p class="mgmt-error">Hilo no encontrado (falta id en la ruta).</p>
    {:else if loading && !message}
        <p class="mgmt-muted">Cargando hilo…</p>
    {:else if !message}
        <p class="mgmt-error">No se encontró el hilo.</p>
    {:else}
        <div class="chat-shell">
            <div class="chat-meta">
                <div class="meta-main">
                    <div class="meta-title">
                        <Icon icon={MessageSquareText} size={18} className="meta-ico" />
                        <strong>{message.subject || "Sin asunto"}</strong>
                    </div>
                    <p class="mgmt-muted meta-sub">
                        {message.fromName || "—"} · {message.fromEmail || "sin email"}
                    </p>
                    <p class="mgmt-muted meta-sub">
                        <Icon icon={Clock} size={14} className="meta-ico" />
                        {new Date(message.createdAtIso).toLocaleString()}
                    </p>
                </div>
                <div class="status-actions">
                    <span class="status-pill status-{message.status}">{message.status}</span>
                    {#if message.status !== "en_proceso"}
                        <button class="mgmt-btn ghost" type="button" on:click={() => setStatus("en_proceso")}>En proceso</button>
                    {/if}
                    {#if message.status !== "resuelto"}
                        <button class="mgmt-btn ghost" type="button" on:click={() => setStatus("resuelto")}>Resuelto</button>
                    {/if}
                    {#if message.status !== "cerrado"}
                        <button class="mgmt-btn ghost" type="button" on:click={() => setStatus("cerrado")}>Cerrar</button>
                    {/if}
                </div>
            </div>

            <div class="chat-wrap" bind:this={threadEl}>
                {#if messagesLoading && messages.length === 0}
                    <p class="mgmt-muted center">Cargando mensajes…</p>
                {:else if messages.length === 0}
                    <p class="mgmt-muted center">Sin mensajes aún.</p>
                {:else}
                    {#each messages as msg (msg.id)}
                        <div class="bubble-row {msg.senderRole}">
                            <div class="bubble">
                                <div class="bubble-head">
                                    <span class="who">{msg.senderRole === "staff" ? (msg.senderName || "Soporte") : (msg.senderName || "Cliente")}</span>
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
                    <p class="mgmt-muted closed-hint">Hilo cerrado — no se pueden enviar más mensajes.</p>
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
                        <button class="mgmt-btn primary" type="button" on:click={sendReply} disabled={posting || !draft.trim()}>
                            <Icon icon={Send} size={16} />
                            {posting ? "Enviando…" : "Enviar"}
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</section>

<style>
    .chat-shell {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 16px;
        overflow: hidden;
        background: var(--md-sys-color-surface);
        min-height: 420px;
    }

    .chat-meta {
        padding: 12px 16px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        align-items: flex-start;
        justify-content: space-between;
    }

    .meta-main {
        display: grid;
        gap: 4px;
        min-width: 0;
    }

    .meta-title {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 1rem;
    }

    .meta-sub {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.88rem;
    }

    .meta-ico {
        opacity: 0.85;
        flex-shrink: 0;
    }

    .status-actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }

    .status-pill {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: lowercase;
        border: 1px solid var(--md-sys-color-outline-variant);
    }

    .status-nuevo {
        background: color-mix(in srgb, #f59e0b 18%, transparent);
        border-color: color-mix(in srgb, #f59e0b 40%, var(--md-sys-color-outline-variant));
    }

    .status-en_proceso {
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
    }

    .status-resuelto {
        background: color-mix(in srgb, #22c55e 16%, transparent);
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
    }

    .status-cerrado {
        background: color-mix(in srgb, #94a3b8 12%, transparent);
        border-color: color-mix(in srgb, #94a3b8 35%, var(--md-sys-color-outline-variant));
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
