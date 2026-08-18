<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { supportInboxStore } from "../viewmodel/support-inbox.store";
    import type { SupportReason, SupportStatus } from "../../domain/entity/SupportMessage";
    import { supportDetail } from "../../../../infrastructure/presentation/navigation/nested.router";
    import { CircleHelp, Inbox, Mail, MessageSquareText, Search, Shield, Wrench } from "lucide-svelte";

    export let navController: NavController;

    let query = "";
    let reason: SupportReason | "all" = "all";
    let status: SupportStatus | "all" = "all";

    const countsStore = supportInboxStore.counts;

    onMount(() => {
        supportInboxStore.syncAll().catch(() => {});
        return supportInboxStore.startRealtime();
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
        .sort((a, b) => {
            // 1) tickets con mensajes nuevos arriba
            const ua = (a.unreadStaff ?? 0) > 0 ? 1 : 0;
            const ub = (b.unreadStaff ?? 0) > 0 ? 1 : 0;
            if (ua !== ub) return ub - ua;
            // 2) por llegada / última actividad (createdAtIso = lastMessageAt)
            return (b.createdAtIso || "").localeCompare(a.createdAtIso || "");
        });

    $: isRefreshing = $supportInboxStore.loading && items.length > 0;
    $: isInitialLoading = $supportInboxStore.loading && items.length === 0;

    function openDetail(id: string) {
        navController.navigate(supportDetail.path, { id });
    }

    function reasonLabel(r: SupportReason): string {
        if (r === "soporte") return "Soporte";
        if (r === "pregunta_tecnica") return "Pregunta técnica";
        if (r === "facturacion") return "Facturación";
        return "Otro";
    }

    function reasonIcon(r: SupportReason) {
        if (r === "pregunta_tecnica") return Wrench;
        if (r === "facturacion") return Shield;
        if (r === "soporte") return MessageSquareText;
        return CircleHelp;
    }

    function statusLabel(s: SupportStatus): string {
        if (s === "nuevo") return "Nuevo";
        if (s === "en_proceso") return "En proceso";
        if (s === "resuelto") return "Resuelto";
        return "Cerrado";
    }

    function badgeClass(s: SupportStatus): string {
        if (s === "nuevo") return "badge new";
        if (s === "en_proceso") return "badge progress";
        return "badge done";
    }
</script>

<section class="mgmt-container">
    <header class="mgmt-page-head">
        <div class="mgmt-page-title">
            <div class="title-row">
                <Icon icon={Inbox} size={22} className="title-ico" ariaLabel="Mensajes" />
                <div>
                    <h1 class="mgmt-h1">Mensajes</h1>
                    <p class="mgmt-muted">Bandeja de soporte entrante</p>
                </div>
            </div>
            <div class="head-stats">
                {#if (counts.unread ?? 0) > 0}
                    <span class="stat-pill hot">
                        {counts.unread} sin leer
                    </span>
                {/if}
                <span class="stat-pill">{counts.nuevo ?? 0} nuevos</span>
                <span class="stat-pill">{counts.enProceso ?? 0} en proceso</span>
            </div>
        </div>
    </header>

    <div class="mgmt-toolbar">
        <div class="search-wrap">
            <Icon icon={Search} size={16} className="search-ico" />
            <input
                class="mgmt-input"
                type="search"
                placeholder="Buscar por nombre, email, asunto…"
                bind:value={query}
            />
        </div>
        <select class="mgmt-select" bind:value={reason} aria-label="Filtrar por motivo">
            <option value="all">Todos los motivos</option>
            <option value="soporte">Soporte</option>
            <option value="pregunta_tecnica">Pregunta técnica</option>
            <option value="facturacion">Facturación</option>
            <option value="otro">Otro</option>
        </select>
        <select class="mgmt-select" bind:value={status} aria-label="Filtrar por estado">
            <option value="all">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
        </select>
        {#if isRefreshing}
            <LoadingSpinner size={18} />
        {/if}
    </div>

    <div class="mgmt-grid">
        <div class="mgmt-main">
            <section class="mgmt-card">
                <div class="list-head">
                    <strong>Tickets</strong>
                    <span class="mgmt-muted">{filtered.length}</span>
                </div>

                <div class="list-body">
                    {#if isInitialLoading}
                        <SkeletonList rows={9} showAvatar={false} showActions={false} lines={2} compact />
                    {:else if filtered.length === 0}
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
                            class="row-btn"
                            class:unread={(m.unreadStaff ?? 0) > 0}
                            type="button"
                            on:click={() => openDetail(m.id)}
                            aria-label={m.subject}
                        >
                            <div class="row-left">
                                <div class="row-ico">
                                    <Icon icon={reasonIcon(m.reason)} size={18} ariaLabel={reasonLabel(m.reason)} />
                                </div>
                                <div class="row-main">
                                    <div class="row-top">
                                        <span class="row-title">
                                            {m.subject || "Sin asunto"}
                                            {#if (m.unreadStaff ?? 0) > 0}
                                                <span
                                                    class="item-unread-badge"
                                                    title={`${m.unreadStaff ?? 0} mensaje(s) nuevo(s)`}
                                                    aria-label={`${m.unreadStaff ?? 0} sin leer`}
                                                >{(m.unreadStaff ?? 0) > 99 ? "99+" : (m.unreadStaff ?? 0)}</span>
                                            {/if}
                                        </span>
                                        <span class={badgeClass(m.status)}>{statusLabel(m.status)}</span>
                                    </div>
                                    <div class="row-sub">
                                        <span>{m.fromName || m.fromEmail}</span>
                                        <span class="dot">•</span>
                                        <span>{reasonLabel(m.reason)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row-time" title={m.createdAtIso}>{new Date(m.createdAtIso).toLocaleString()}</div>
                        </button>
                    {/each}
                </div>
            </section>
        </div>
    </div>
</section>

<style>
    .list-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .title-row {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .title-ico {
        opacity: 0.9;
    }

    .head-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
    }

    .stat-pill {
        font-size: 0.78rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }

    .stat-pill.hot {
        background: color-mix(in srgb, #d92d20 16%, transparent);
        border-color: color-mix(in srgb, #d92d20 35%, var(--md-sys-color-outline-variant));
        color: color-mix(in srgb, #d92d20 85%, var(--md-sys-color-on-surface));
    }

    .search-wrap {
        position: relative;
        flex: 1;
        min-width: 180px;
    }

    .search-ico {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.6;
        pointer-events: none;
    }

    .search-wrap :global(input) {
        padding-left: 36px;
    }

    .list-body {
        display: grid;
        max-height: min(70vh, 720px);
        overflow: auto;
    }

    .row-btn {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        text-align: left;
        padding: 12px 14px;
        border: 0;
        border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: background 120ms ease;
    }

    .row-btn:hover {
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
    }

    .row-btn.unread {
        background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
    }

    .row-left {
        display: flex;
        gap: 12px;
        align-items: center;
        min-width: 0;
    }

    .row-ico {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 55%, transparent);
        flex-shrink: 0;
    }

    .row-main {
        min-width: 0;
        display: grid;
        gap: 4px;
    }

    .row-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    .row-title {
        font-weight: 950;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .item-unread-badge {
        flex-shrink: 0;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #d92d20;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 800;
        line-height: 1;
        border: 2px solid var(--md-sys-color-surface);
        box-shadow: 0 4px 10px rgb(0 0 0 / 0.18);
    }

    .row-btn.unread .row-title {
        font-weight: 950;
    }

    .row-sub {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
        font-size: 0.88rem;
    }

    .dot {
        opacity: 0.7;
    }

    .row-time {
        color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent);
        font-size: 0.86rem;
        white-space: nowrap;
    }

    .badge {
        font-size: 0.72rem;
        font-weight: 900;
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
        white-space: nowrap;
    }

    .badge.new {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
    }

    .badge.progress {
        border-color: color-mix(in srgb, #f59e0b 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 14%, transparent);
    }

    .badge.done {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
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
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 50%, transparent);
        margin-bottom: 4px;
    }

    .empty-title {
        font-weight: 800;
        font-size: 1.05rem;
    }
</style>
