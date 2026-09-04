<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { saleStore } from "../viewmodel/sale.store";
    import {
        aggregateSaleOperations,
        pendingQueuePreview,
    } from "../../domain/util/aggregateSaleOperations";
    import {
        formatSaleAge,
        saleAgeUrgency,
        saleAgeHours,
    } from "../../domain/util/sortSalesByAge";
    import { formatSaleMoney } from "../../domain/util/formatSaleMoney";
    import { BuyState } from "../../domain/entity/enums";
    import { sales, salesDetail } from "../../../../infrastructure/presentation/navigation/nested.router";
    import {
        Clock,
        Inbox,
        ShieldCheck,
        XCircle,
        ChevronRight,
        CircleAlert,
        RefreshCw,
    } from "lucide-svelte";

    export let navController: NavController;

    const PERIOD_DAYS = 30;
    /** Preview en dashboard; listado completo en Ventas. */
    const PREVIEW_LIMIT = 7;

    let syncing = false;
    let nowMs = Date.now();

    async function refreshFromServer(): Promise<void> {
        if (syncing) return;
        syncing = true;
        try {
            await saleStore.syncAll();
        } catch {
            /* error queda en saleStore */
        } finally {
            syncing = false;
        }
    }

    onMount(() => {
        void refreshFromServer();
        const onFocus = () => {
            void refreshFromServer();
        };
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    });

    $: salesList = $saleStore.items ?? [];
    $: loading = $saleStore.loading;
    // Firma de estado: cualquier confirm/reject/create cambia esto
    $: statusKey = salesList
        .map((s) => `${s.id}:${s.verified}:${s.updatedAtIso ?? ""}`)
        .join("|");
    /**
     * nowMs fresco cuando cambia statusKey (evita período con reloj congelado).
     * Sin operador coma: CI / noUnusedLocals lo rechaza.
     */
    $: {
        void statusKey;
        nowMs = Date.now();
    }
    $: ops = aggregateSaleOperations(salesList, {
        periodDays: PERIOD_DAYS,
        nowMs,
    });
    $: queue = pendingQueuePreview(salesList, PREVIEW_LIMIT, nowMs);

    function openSales() {
        navController.goToSection(sales.path);
    }

    function openDetail(id: string) {
        navController.navigate(salesDetail.path, { id });
    }
</script>

<section class="op" aria-label="Supervisión operativa de ventas" aria-busy={loading || syncing}>
    <div class="op-accent" aria-hidden="true"></div>
    <header class="op-head">
        <div class="op-brand">
            <span class="op-brand-ico">
                <Icon icon={Inbox} size={20} ariaLabel="Operación" />
            </span>
            <div>
                <h2 class="op-title">Operación · cola de ventas</h2>
                <p class="op-sub">
                    Estados de pedido (<code>Sale</code>) — <strong>no</strong> es el bloque financiero.
                    Confirmados/rechazados en {PERIOD_DAYS} días; cola UNVERIFIED (hasta {PREVIEW_LIMIT} en preview).
                </p>
            </div>
        </div>
        <div class="op-actions">
            <button
                type="button"
                class="op-link"
                on:click={() => refreshFromServer()}
                disabled={loading || syncing}
                aria-label="Actualizar cola operativa"
            >
                <Icon icon={RefreshCw} size={16} ariaLabel="" />
                {syncing || loading ? "Actualizando…" : "Actualizar"}
            </button>
            <button type="button" class="op-link primary" on:click={openSales}>
                Ir a Ventas
                <Icon icon={ChevronRight} size={16} ariaLabel="" />
            </button>
        </div>
    </header>

    <div class="op-kpis" class:dim={loading || syncing}>
        <article class="op-kpi pending">
            <div class="op-ico"><Icon icon={Clock} size={18} ariaLabel="" /></div>
            <div>
                <span class="op-label">Pendientes abiertos</span>
                <span class="op-value">{ops.unverifiedOpen}</span>
                <span class="op-note">
                    0–12h {ops.aging.fresh} · 12–48h {ops.aging.warn} · ≥48h {ops.aging.critical}
                </span>
            </div>
        </article>
        <article class="op-kpi ok">
            <div class="op-ico"><Icon icon={ShieldCheck} size={18} ariaLabel="" /></div>
            <div>
                <span class="op-label">Confirmados ({PERIOD_DAYS}d)</span>
                <span class="op-value">{ops.verifiedInPeriod}</span>
                <span class="op-note">Actividad en el período</span>
            </div>
        </article>
        <article class="op-kpi bad">
            <div class="op-ico"><Icon icon={XCircle} size={18} ariaLabel="" /></div>
            <div>
                <span class="op-label">Rechazados ({PERIOD_DAYS}d)</span>
                <span class="op-value">{ops.deletedInPeriod}</span>
                <span class="op-note">Actividad en el período</span>
            </div>
        </article>
        <article class="op-kpi neutral">
            <div class="op-ico"><Icon icon={CircleAlert} size={18} ariaLabel="" /></div>
            <div>
                <span class="op-label">Creados ({PERIOD_DAYS}d)</span>
                <span class="op-value">{ops.createdInPeriod}</span>
                <span class="op-note">Cualquier estado</span>
            </div>
        </article>
    </div>

    <div class="op-queue">
        <div class="op-queue-head">
            <h3 class="op-queue-title">Cola UNVERIFIED (más antiguas primero)</h3>
            {#if ops.aging.critical > 0}
                <span class="op-badge crit">{ops.aging.critical} críticas (≥48h)</span>
            {/if}
        </div>
        {#if queue.length === 0}
            <p class="op-empty">
                {#if loading || syncing}
                    Cargando ventas…
                {:else if salesList.length === 0}
                    No hay ventas en memoria. Pulsa <strong>Actualizar</strong> o abre Ventas.
                {:else}
                    No hay pedidos pendientes ({BuyState.UNVERIFIED}). La cola operativa está vacía.
                {/if}
            </p>
        {:else}
            <ul class="op-list">
                {#each queue as s (s.id + ":" + s.verified)}
                    {@const urg = saleAgeUrgency(saleAgeHours(s, nowMs))}
                    <li>
                        <button type="button" class="op-row" on:click={() => openDetail(s.id)}>
                            <span class="op-age" data-urg={urg}>{formatSaleAge(s, nowMs)}</span>
                            <span class="op-row-main">
                                <span class="op-id">{s.id}</span>
                                <span class="op-amt">{formatSaleMoney(s.amount, s.currency)}</span>
                            </span>
                            <Icon icon={ChevronRight} size={16} ariaLabel="Detalle" />
                        </button>
                    </li>
                {/each}
            </ul>
            {#if ops.unverifiedOpen > PREVIEW_LIMIT}
                <button type="button" class="op-more" on:click={openSales}>
                    Ver los {ops.unverifiedOpen} pendientes en Ventas
                </button>
            {/if}
        {/if}
    </div>
</section>

<style>
    .op {
        position: relative; margin-top: 18px; border-radius: 18px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow: 0 12px 32px color-mix(in srgb, black 6%, transparent);
        overflow: hidden;
    }
    .op-accent { height: 4px; background: linear-gradient(90deg, #a855f7, #6366f1); }
    .op-head {
        display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;
        align-items: flex-start; padding: 16px 18px 10px;
    }
    .op-brand { display: flex; gap: 12px; min-width: 0; }
    .op-brand-ico {
        width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
        color: #7c3aed; background: color-mix(in srgb, #a855f7 14%, transparent);
        border: 1px solid color-mix(in srgb, #a855f7 28%, transparent); flex-shrink: 0;
    }
    .op-title { margin: 0; font-size: 1.05rem; font-weight: 850; }
    .op-sub {
        margin: 4px 0 0; font-size: 0.82rem; line-height: 1.4;
        color: var(--md-sys-color-on-surface-variant); max-width: 40rem;
    }
    .op-sub code { font-size: 0.76rem; }
    .op-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .op-link {
        display: inline-flex; align-items: center; gap: 4px; padding: 8px 12px; border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant); background: transparent;
        font-weight: 700; font-size: 0.82rem; cursor: pointer; color: inherit;
    }
    .op-link:disabled { opacity: 0.6; cursor: not-allowed; }
    .op-link:hover:not(:disabled) {
        border-color: color-mix(in srgb, #a855f7 40%, var(--md-sys-color-outline-variant));
    }
    .op-link.primary {
        background: color-mix(in srgb, #a855f7 12%, transparent);
        border-color: color-mix(in srgb, #a855f7 28%, transparent);
    }
    .op-kpis {
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px; padding: 4px 18px 14px;
    }
    .op-kpis.dim { opacity: 0.75; }
    .op-kpi {
        display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 22%, transparent);
        min-width: 0;
    }
    .op-kpi .op-ico {
        width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;
    }
    .op-kpi.pending .op-ico { background: color-mix(in srgb, #a855f7 16%, transparent); color: #7c3aed; }
    .op-kpi.ok .op-ico { background: color-mix(in srgb, #22c55e 16%, transparent); color: #16a34a; }
    .op-kpi.bad .op-ico { background: color-mix(in srgb, #ef4444 16%, transparent); color: #dc2626; }
    .op-kpi.neutral .op-ico { background: color-mix(in srgb, #64748b 16%, transparent); color: #475569; }
    .op-label {
        display: block; font-size: 0.68rem; font-weight: 800; text-transform: uppercase;
        letter-spacing: 0.03em; color: var(--md-sys-color-on-surface-variant);
    }
    .op-value { display: block; font-size: 1.25rem; font-weight: 850; font-variant-numeric: tabular-nums; }
    .op-note { display: block; font-size: 0.72rem; color: var(--md-sys-color-on-surface-variant); margin-top: 2px; }
    .op-queue { padding: 0 18px 18px; }
    .op-queue-head {
        display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .op-queue-title { margin: 0; font-size: 0.9rem; font-weight: 800; }
    .op-badge.crit {
        font-size: 0.72rem; font-weight: 750; padding: 4px 8px; border-radius: 999px;
        color: #b91c1c; background: color-mix(in srgb, #ef4444 14%, transparent);
        border: 1px solid color-mix(in srgb, #ef4444 28%, transparent);
    }
    .op-empty {
        margin: 0; padding: 14px; border-radius: 12px; font-size: 0.86rem;
        color: var(--md-sys-color-on-surface-variant);
        border: 1px dashed var(--md-sys-color-outline-variant); text-align: center;
    }
    .op-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .op-row {
        width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px;
        border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface); cursor: pointer; text-align: left; color: inherit;
    }
    .op-row:hover { border-color: color-mix(in srgb, #a855f7 35%, var(--md-sys-color-outline-variant)); }
    .op-age {
        flex-shrink: 0; font-size: 0.72rem; font-weight: 800; padding: 4px 8px; border-radius: 8px;
        min-width: 4.5rem; text-align: center;
    }
    .op-age[data-urg="fresh"] { background: color-mix(in srgb, #22c55e 14%, transparent); color: #15803d; }
    .op-age[data-urg="warn"] { background: color-mix(in srgb, #f59e0b 16%, transparent); color: #b45309; }
    .op-age[data-urg="critical"] { background: color-mix(in srgb, #ef4444 16%, transparent); color: #b91c1c; }
    .op-row-main { flex: 1; min-width: 0; display: grid; gap: 2px; }
    .op-id { font-size: 0.78rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .op-amt { font-size: 0.86rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .op-more {
        margin-top: 10px; width: 100%; padding: 10px; border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant); background: transparent;
        font-weight: 700; font-size: 0.84rem; cursor: pointer; color: inherit;
    }
    @media (max-width: 900px) { .op-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 520px) {
        .op-kpis { grid-template-columns: 1fr; }
        .op-head { flex-direction: column; }
        .op-actions { width: 100%; }
        .op-link { flex: 1; justify-content: center; }
    }
</style>
