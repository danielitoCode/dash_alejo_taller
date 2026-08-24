<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { saleStore } from "../viewmodel/sale.store";
    import { BuyState } from "../../domain/entity/enums";
    import {
        countSalesByStatus,
        filterSalesByStatus,
        saleStateLabel,
        type SaleStatusFilter,
    } from "../../domain/util/filterSalesByStatus";
    import {
        formatSaleAge,
        saleAgeHours,
        saleAgeUrgency,
        sortSalesForQueue,
    } from "../../domain/util/sortSalesByAge";
    import {
        formatSaleMoney,
        saleCurrencyCode,
    } from "../../domain/util/formatSaleMoney";
    import { salesDetail } from "../../../../infrastructure/presentation/navigation/nested.router";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonTiles from "../../../../infrastructure/presentation/components/SkeletonTiles.svelte";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { BadgeDollarSign, ChevronRight, Clock, Inbox, Package, Search, ShieldCheck, Store, User, XCircle } from "lucide-svelte";

    export let navController: NavController;

    const SALE_TIPS = {
        pending: "Pedidos aún no confirmados. Requieren aprobación o rechazo del staff.",
        verified: "Ventas confirmadas: stock descontado y evento financiero registrado.",
        rejected: "Pedidos rechazados; el reserved se liberó sin salida de mercancía.",
        age: "Tiempo desde el pedido. En pendientes se atienden los más antiguos primero.",
        amount: "Importe total del pedido.",
        lines: "Líneas de producto del pedido.",
        client: "Cliente del pedido.",
    } as const;

    let query = "";
    let statusFilter: SaleStatusFilter = BuyState.UNVERIFIED;

    onMount(() => {
        saleStore.syncAll().catch(() => toastStore.error("Error al sincronizar ventas"));
        userManagementStore.syncAll().catch(() => {});
        productStore.syncAll().catch(() => {});
    });

    function openDetail(id: string) {
        navController.navigate(salesDetail.path, { id });
    }

    function saleStateClass(state: BuyState): string {
        if (state === BuyState.UNVERIFIED) return "unverified";
        if (state === BuyState.DELETED) return "rejected";
        return "verified";
    }

    function setStatusTab(filter: SaleStatusFilter) {
        statusFilter = filter;
    }

    function resolveUserSale(saleId: string) {
        const sale = $saleStore.items.find((s) => s.id === saleId);
        if (!sale) return "Usuario desconocido";
        const user = $userManagementStore.items.find((u) => u.id === sale.userId);
        return user ? user.name : "Usuario desconocido";
    }

    $: items = $saleStore.items.slice();
    $: counts = countSalesByStatus(items);
    $: isRefreshing = $saleStore.loading && items.length > 0;
    $: isInitialLoading = $saleStore.loading && items.length === 0;
    $: byStatus = filterSalesByStatus(items, statusFilter);
    $: orderedByAge = sortSalesForQueue(byStatus, statusFilter);
    $: filteredItems = orderedByAge.filter((sale) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const userName = resolveUserSale(sale.id).toLowerCase();
        return (
            (sale.id || "").toLowerCase().includes(q) ||
            (sale.userId || "").toLowerCase().includes(q) ||
            userName.includes(q)
        );
    });
    $: emptyMessage =
        items.length === 0
            ? "No hay ventas registradas."
            : statusFilter === BuyState.UNVERIFIED
              ? "No hay pedidos pendientes."
              : statusFilter === BuyState.VERIFIED
                ? "No hay ventas confirmadas."
                : statusFilter === BuyState.DELETED
                  ? "No hay ventas rechazadas."
                  : "Sin resultados.";
</script>

<section class="mgmt-screen">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Ventas</h1>
                <p class="mgmt-muted">
                    Pedidos de la tienda. Las citas de taller están en Reservas.
                </p>
                {#if statusFilter === BuyState.UNVERIFIED}
                    <p class="queue-hint" title={SALE_TIPS.age}>Cola por antigüedad: las más antiguas primero.</p>
                {/if}
            </div>
            <div class="mgmt-chip-row status-tabs" role="tablist" aria-label="Filtrar por estado">
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === "all"} on:click={() => setStatusTab("all")}>
                    {counts.total} total
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.UNVERIFIED} title={SALE_TIPS.pending} on:click={() => setStatusTab(BuyState.UNVERIFIED)}>
                    {counts.pending} pendientes
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.VERIFIED} title={SALE_TIPS.verified} on:click={() => setStatusTab(BuyState.VERIFIED)}>
                    {counts.verified} confirmadas
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.DELETED} title={SALE_TIPS.rejected} on:click={() => setStatusTab(BuyState.DELETED)}>
                    {counts.rejected} rechazadas
                </button>
                {#if isRefreshing}
                    <span class="mgmt-chip"><LoadingSpinner size={14} label="Sync" subtle /></span>
                {/if}
            </div>
        </header>

        <section class="mgmt-card">
            <div class="filters">
                <label class="filter-field search">
                    <Icon icon={Search} size={16} ariaLabel="Buscar" />
                    <input type="search" placeholder="Buscar venta o cliente…" bind:value={query} />
                </label>
                <label class="filter-field">
                    <span>Estado</span>
                    <select bind:value={statusFilter}>
                        <option value="all">Todos</option>
                        <option value={BuyState.UNVERIFIED}>Pendientes</option>
                        <option value={BuyState.VERIFIED}>Confirmadas</option>
                        <option value={BuyState.DELETED}>Rechazadas</option>
                    </select>
                </label>
            </div>

            {#if isInitialLoading}
                <SkeletonTiles count={4} columns={2} />
            {:else if filteredItems.length === 0}
                <p class="mgmt-muted">{emptyMessage}</p>
            {:else}
                <div class="sales-grid">
                    {#each filteredItems as sale (sale.id)}
                        {@const code = saleCurrencyCode(sale.currency)}
                        {@const isPending = sale.verified === BuyState.UNVERIFIED}
                        {@const ageLabel = isPending ? formatSaleAge(sale) : ""}
                        {@const ageUrgency = isPending ? saleAgeUrgency(saleAgeHours(sale)) : "fresh"}
                        {@const lineCount = Array.isArray(sale.products) ? sale.products.length : 0}
                        <article
                            class="sale-card"
                            class:is-pending={isPending}
                            class:age-warn={isPending && ageUrgency === "warn"}
                            class:age-critical={isPending && ageUrgency === "critical"}
                            data-status={sale.verified}
                        >
                            <button type="button" class="sale-card-hit" on:click={() => openDetail(sale.id)}>
                                <div class="sale-card-top">
                                    <div class="sale-id-block">
                                        <div class="sale-id-text">
                                            <strong class="sale-title" title={sale.id}>#{sale.id.slice(0, 8)}…</strong>
                                            <span class="sale-client" title={SALE_TIPS.client}>{resolveUserSale(sale.id)}</span>
                                        </div>
                                    </div>
                                    <span
                                        class="sale-status {saleStateClass(sale.verified)}"
                                        title={sale.verified === BuyState.UNVERIFIED ? SALE_TIPS.pending : sale.verified === BuyState.VERIFIED ? SALE_TIPS.verified : SALE_TIPS.rejected}
                                    >
                                        {saleStateLabel(sale.verified)}
                                    </span>
                                </div>
                                <div class="sale-metrics">
                                    <div class="metric" title={SALE_TIPS.amount}>
                                        <span class="metric-label">Importe</span>
                                        <span class="metric-value">{formatSaleMoney(sale.amount, code)}</span>
                                    </div>
                                    <div class="metric" title={SALE_TIPS.lines}>
                                        <span class="metric-label">Líneas</span>
                                        <span class="metric-value">{lineCount}</span>
                                    </div>
                                    {#if isPending && ageLabel}
                                        <div class="metric age-metric" class:warn={ageUrgency === "warn"} class:critical={ageUrgency === "critical"} title={SALE_TIPS.age}>
                                            <span class="metric-label">Antigüedad</span>
                                            <span class="metric-value">{ageLabel}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="sale-card-foot">
                                    <span>Ver detalle</span>
                                    <Icon icon={ChevronRight} size={15} ariaLabel="" />
                                </div>
                            </button>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    </div>
</section>

<style>
    h1 { margin: 0; font-size: 1.15rem; font-weight: 850; letter-spacing: -0.01em; }
    .status-tabs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .mgmt-chip.tab {
        cursor: pointer; border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent; font: inherit; color: inherit; font-size: 0.84rem;
    }
    .mgmt-chip.tab:hover { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent); }
    .mgmt-chip.tab.active {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        font-weight: 750;
    }
    .queue-hint { margin: 6px 0 0; font-size: 0.8rem; font-weight: 600; color: var(--md-sys-color-primary); opacity: 0.9; }
    .filters {
        display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(140px, 0.45fr);
        gap: 10px; margin-bottom: 12px;
    }
    .filter-field { display: grid; gap: 4px; }
    .filter-field span { font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); }
    .filter-field.search {
        display: flex; align-items: center; gap: 8px;
        border: 1px solid var(--md-sys-color-outline-variant); border-radius: 10px;
        padding: 0 10px; background: var(--md-sys-color-surface);
    }
    .filter-field.search input, .filter-field select {
        width: 100%; height: 38px; border: 0; outline: 0; background: transparent; color: inherit; font: inherit;
    }
    .sales-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: 10px;
    }
    .sale-card {
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-left: 3px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        transition: border-color 120ms ease, background-color 120ms ease;
    }
    .sale-card.is-pending { border-left-color: #d97706; }
    .sale-card[data-status="VERIFIED"] { border-left-color: #16a34a; }
    .sale-card[data-status="DELETED"] { border-left-color: #94a3b8; opacity: 0.9; }
    .sale-card.age-warn { border-left-color: #ea580c; }
    .sale-card.age-critical { border-left-color: #dc2626; }
    .sale-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 20%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 6%, var(--md-sys-color-surface));
    }
    .sale-card-hit {
        width: 100%; text-align: left; border: 0; background: transparent; color: inherit; font: inherit;
        padding: 12px 13px; display: grid; gap: 8px; cursor: pointer;
    }
    .sale-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .sale-id-text { min-width: 0; display: grid; gap: 1px; }
    .sale-title {
        font-size: 0.86rem; font-weight: 750;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sale-client {
        font-size: 0.75rem; font-weight: 500; color: var(--md-sys-color-on-surface-variant);
    }
    .sale-status {
        font-size: 0.6rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.04em;
        padding: 2px 7px; border-radius: 5px; white-space: nowrap;
    }
    .sale-status.unverified { color: #b45309; background: color-mix(in srgb, #f59e0b 12%, transparent); }
    .sale-status.verified { color: #15803d; background: color-mix(in srgb, #16a34a 12%, transparent); }
    .sale-status.rejected { color: #64748b; background: color-mix(in srgb, #94a3b8 12%, transparent); }
    .sale-metrics { display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .metric { display: flex; flex-direction: column; gap: 0; cursor: help; }
    .metric-label {
        font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
        color: var(--md-sys-color-on-surface-variant); opacity: 0.8;
    }
    .metric-value { font-size: 0.86rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .age-metric.warn .metric-value { color: #ea580c; }
    .age-metric.critical .metric-value { color: #dc2626; font-weight: 800; }
    .sale-card-foot {
        display: flex; align-items: center; gap: 2px;
        font-size: 0.74rem; font-weight: 650; color: var(--md-sys-color-primary); opacity: 0.85;
    }
    @media (max-width: 640px) { .filters { grid-template-columns: 1fr; } }
</style>
