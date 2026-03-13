<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { supportInboxStore } from "../viewmodel/support-inbox.store";
    import type { SupportMessage, SupportReason, SupportStatus } from "../../domain/entity/SupportMessage";
    import {
        CircleHelp,
        Clock,
        Inbox,
        Mail,
        MessageSquareText,
        Search,
        Shield,
        Wrench
    } from "lucide-svelte";

    let query = "";
    let reason: SupportReason | "all" = "all";
    let status: SupportStatus | "all" = "all";
    let selectedId: string | null = null;
    const countsStore = supportInboxStore.counts;

    onMount(() => {
        toastStore.info("Cargando bandeja…", 1200);
        supportInboxStore.syncAll().catch((e) => {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error("No se pudo cargar la bandeja.");
        });
    });

    $: items = $supportInboxStore.items;
    $: counts = $countsStore;
    $: filtered = items
        .filter((m) => (reason === "all" ? true : m.reason === reason))
        .filter((m) => (status === "all" ? true : m.status === status))
        .filter((m) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return (
                (m.fromName || "").toLowerCase().includes(q) ||
                (m.fromEmail || "").toLowerCase().includes(q) ||
                (m.subject || "").toLowerCase().includes(q) ||
                (m.body || "").toLowerCase().includes(q)
            );
        })
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));

    $: selected = selectedId ? filtered.find((m) => m.id === selectedId) ?? null : null;

    function reasonLabel(r: SupportReason): string {
        if (r === "soporte") return "Soporte";
        if (r === "pregunta_tecnica") return "Pregunta técnica";
        if (r === "facturacion") return "Facturación";
        return "Otro";
    }

    function statusLabel(s: SupportStatus): string {
        if (s === "nuevo") return "Nuevo";
        if (s === "en_proceso") return "En proceso";
        return "Resuelto";
    }

    function reasonIcon(r: SupportReason) {
        if (r === "pregunta_tecnica") return Wrench;
        if (r === "facturacion") return Shield;
        if (r === "soporte") return MessageSquareText;
        return CircleHelp;
    }

    function badgeClass(s: SupportStatus): string {
        if (s === "nuevo") return "badge new";
        if (s === "en_proceso") return "badge progress";
        return "badge done";
    }

    async function setMessageStatus(messageId: string, next: SupportStatus) {
        try {
            await supportInboxStore.setStatus(messageId, next);
            toastStore.success("Estado actualizado.");
        } catch (e) {
            toastStore.error(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
        }
    }

    function mailto(m: SupportMessage): string {
        const subject = encodeURIComponent(`[Soporte] ${m.subject}`);
        const body = encodeURIComponent(`Hola ${m.fromName || ""},\n\n`);
        return `mailto:${encodeURIComponent(m.fromEmail)}?subject=${subject}&body=${body}`;
    }
</script>

<section class="mgmt-page" aria-label="Bandeja de soporte">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Mensajes</h1>
                <p class="mgmt-subtitle">Bandeja de soporte y consultas técnicas. Priorización rápida y seguimiento.</p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Inbox} size={18} ariaLabel="Total" />
                    {counts.total} total
                </span>
                <span class="mgmt-chip">
                    <Icon icon={Clock} size={18} ariaLabel="Nuevos" />
                    {counts.nuevo} nuevos
                </span>
            </div>
        </div>
    </header>

    <div class="mgmt-layout inbox-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Filtros">
            <h2 class="mgmt-card-title">Filtros</h2>

            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Buscar</span>
                    <div style="display:flex; gap:10px; align-items:center">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input
                            class="mgmt-input"
                            type="search"
                            placeholder="Nombre, email, asunto…"
                            aria-label="Buscar mensajes"
                            bind:value={query}
                        />
                    </div>
                </label>

                <label class="mgmt-field">
                    <span>Motivo</span>
                    <select class="mgmt-select" bind:value={reason}>
                        <option value="all">Todos</option>
                        <option value="soporte">Soporte</option>
                        <option value="pregunta_tecnica">Pregunta técnica</option>
                        <option value="facturacion">Facturación</option>
                        <option value="otro">Otro</option>
                    </select>
                </label>

                <label class="mgmt-field">
                    <span>Estado</span>
                    <select class="mgmt-select" bind:value={status}>
                        <option value="all">Todos</option>
                        <option value="nuevo">Nuevo</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="resuelto">Resuelto</option>
                    </select>
                </label>

                <div class="mgmt-actions" style="grid-column:1/-1">
                    <button class="mgmt-btn ghost" type="button" on:click={() => supportInboxStore.syncAll()}>
                        <Icon icon={Inbox} size={18} ariaLabel="Refrescar" />
                        Refrescar
                    </button>
                </div>

                <div class="mgmt-muted" style="grid-column:1/-1">
                    Cuando conectemos el backend, aquí podrás ver adjuntos, asignar responsables y responder con plantillas.
                </div>
            </div>
        </section>

        <section class="mgmt-card" aria-label="Bandeja">
            <div class="split">
                <div class="list" aria-label="Lista de mensajes">
                    <div class="list-head">
                        <h2 class="mgmt-card-title" style="margin:0">Entrantes</h2>
                        <span class="mgmt-chip">
                            <Icon icon={MessageSquareText} size={18} ariaLabel="Filtrados" />
                            {filtered.length}
                        </span>
                    </div>

                    <div class="mgmt-list">
                        {#if filtered.length === 0}
                            <div class="empty">
                                <div class="empty-ico">
                                    <Icon icon={Mail} size={22} ariaLabel="Sin mensajes" />
                                </div>
                                <div class="empty-title">Bandeja vacía</div>
                                <div class="mgmt-muted">Aún no hay mensajes entrantes.</div>
                            </div>
                        {/if}

                        {#each filtered as m (m.id)}
                            <button
                                class="row-btn {selectedId === m.id ? 'selected' : ''}"
                                type="button"
                                on:click={() => (selectedId = m.id)}
                                aria-label={m.subject}
                            >
                                <div class="row-left">
                                    <div class="row-ico">
                                        <Icon icon={reasonIcon(m.reason)} size={18} ariaLabel={reasonLabel(m.reason)} />
                                    </div>
                                    <div class="row-main">
                                        <div class="row-top">
                                            <span class="row-title">{m.subject}</span>
                                            <span class={badgeClass(m.status)}>{statusLabel(m.status)}</span>
                                        </div>
                                        <div class="row-sub">
                                            <span>{m.fromName || m.fromEmail}</span>
                                            <span class="dot">·</span>
                                            <span>{reasonLabel(m.reason)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="row-time" title={m.createdAtIso}>{new Date(m.createdAtIso).toLocaleString()}</div>
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="detail" aria-label="Detalle">
                    {#if !selected}
                        <div class="empty">
                            <div class="empty-ico">
                                <Icon icon={Inbox} size={22} ariaLabel="Selecciona" />
                            </div>
                            <div class="empty-title">Selecciona un mensaje</div>
                            <div class="mgmt-muted">El detalle aparece aquí para responder y gestionar estados.</div>
                        </div>
                    {:else}
                        <div class="detail-head">
                            <div class="detail-title">
                                <div class="detail-subject">{selected.subject}</div>
                                <div class="detail-meta">
                                    <span class="mgmt-chip">
                                        <Icon icon={Mail} size={18} ariaLabel="Email" />
                                        {selected.fromEmail}
                                    </span>
                                    <span class="mgmt-chip">
                                        <Icon icon={reasonIcon(selected.reason)} size={18} ariaLabel="Motivo" />
                                        {reasonLabel(selected.reason)}
                                    </span>
                                    <span class={"mgmt-chip " + badgeClass(selected.status)}>
                                        {statusLabel(selected.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-body">
                            <p class="body-text">{selected.body}</p>
                        </div>

                        <div class="detail-actions">
                            <a class="mgmt-btn ghost" href={mailto(selected)}>
                                <Icon icon={Mail} size={18} ariaLabel="Responder" />
                                Responder por correo
                            </a>
                            <button class="mgmt-btn ghost" type="button" on:click={() => setMessageStatus(selected.id, "en_proceso")}>
                                <Icon icon={Clock} size={18} ariaLabel="En proceso" />
                                En proceso
                            </button>
                            <button class="mgmt-btn primary" type="button" on:click={() => setMessageStatus(selected.id, "resuelto")}>
                                <Icon icon={Inbox} size={18} ariaLabel="Resuelto" />
                                Marcar resuelto
                            </button>
                        </div>

                        <div class="mgmt-muted">
                            IA (opcional): aquí podemos añadir “resumen”, “clasificación”, “respuesta sugerida” y “detección de abuso”,
                            pero lo conectaríamos cuando definas proveedor y política.
                        </div>
                    {/if}
                </div>
            </div>
        </section>
    </div>
</section>

<style>
    .inbox-layout {
        grid-template-columns: 320px 1fr;
    }

    @media (max-width: 980px) {
        .inbox-layout {
            grid-template-columns: 1fr;
        }
    }

    .split {
        display: grid;
        gap: 12px;
        grid-template-columns: 1.05fr 0.95fr;
        align-items: start;
    }

    @media (max-width: 980px) {
        .split {
            grid-template-columns: 1fr;
        }
    }

    .list-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 12px;
    }

    .row-btn {
        width: 100%;
        text-align: left;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, transparent);
        border-radius: 16px;
        padding: 10px;
        cursor: pointer;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: center;
        transition: border-color 160ms ease, box-shadow 160ms ease, transform 120ms ease;
    }

    .row-btn:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-outline) 40%, var(--md-sys-color-outline-variant));
        box-shadow: 0 10px 22px color-mix(in srgb, var(--md-sys-color-outline) 14%, transparent);
    }

    .row-btn:active {
        transform: translateY(1px);
    }

    .row-btn.selected {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, var(--md-sys-color-outline-variant));
        box-shadow: 0 12px 26px color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    }

    .row-left {
        display: grid;
        grid-template-columns: 44px 1fr;
        gap: 10px;
        align-items: center;
        min-width: 0;
    }

    .row-ico {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-primary-container) 55%, transparent);
        color: var(--md-sys-color-on-primary-container);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
    }

    .row-main {
        min-width: 0;
        display: grid;
        gap: 3px;
    }

    .row-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .row-title {
        font-weight: 850;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .row-sub {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 70%, transparent);
        font-size: 0.92rem;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .dot {
        opacity: 0.55;
    }

    .row-time {
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 62%, transparent);
        font-size: 0.82rem;
        white-space: nowrap;
    }

    .badge {
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 800;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }

    .badge.new {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 30%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary-container) 55%, transparent);
        color: var(--md-sys-color-on-primary-container);
    }

    .badge.progress {
        border-color: color-mix(in srgb, #f59e0b 36%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 20%, transparent);
    }

    .badge.done {
        border-color: color-mix(in srgb, var(--md-sys-color-outline) 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 48%, transparent);
    }

    .detail {
        display: grid;
        gap: 12px;
        min-height: 320px;
    }

    .detail-subject {
        font-weight: 950;
        font-size: 1.15rem;
        letter-spacing: -0.01em;
    }

    .detail-meta {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
    }

    .detail-body {
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, transparent);
        padding: 12px;
        min-height: 180px;
    }

    .body-text {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.55;
    }

    .detail-actions {
        display: inline-flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .empty {
        height: 100%;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 18px;
        gap: 6px;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 80%, transparent);
    }

    .empty-ico {
        width: 52px;
        height: 52px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        border: 1px solid var(--md-sys-color-outline-variant);
    }

    .empty-title {
        font-weight: 900;
        letter-spacing: -0.01em;
    }
</style>
