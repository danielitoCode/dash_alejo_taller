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
    import { BadgeDollarSign, ChevronRight, CircleHelp, Clock, Inbox, Package, Search, ShieldCheck, Store, User, XCircle } from "lucide-svelte";

    export let navController: NavController;

    const SALE_TIPS = {
        pending: "Pedidos aún no confirmados. Requieren aprobación o rechazo del staff.",
        verified: "Ventas confirmadas: stock descontado y evento financiero registrado.",
        rejected: "Pedidos rechazados; el reserved se liberó sin salida de mercancía.",
        age: "Tiempo desde el pedido del cliente. En pendientes se atienden los más antiguos primero.",
        amount: "Importe total del pedido en la moneda del documento.",
        lines: "Número de líneas de producto incluidas en el pedido.",
        client: "Cliente asociado al pedido (cuenta o nombre resuelto).",
    } as const;

    let query = "";
    let statusFilter: SaleStatusFilter = BuyState.UNVERIFIED;

    onMount(() => {
        saleStore.syncAll().catch(() => toastStore.error("Error al sincronizar ventas"));
        userManagementStore.syncAll().catch(() => toastStore.error("Error al sincronizar usuarios"));
        productStore.syncAll().catch(() => toastStore.error("Error al sincronizar productos"));
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
        const safeId = (sale.id || "").toLowerCase();
        const safeUserId = (sale.userId || "").toLowerCase();
        return safeId.includes(q) || safeUserId.includes(q) || userName.includes(q);
    });
    $: emptyMessage =
        items.length === 0
            ? "No hay ventas registradas."
            : statusFilter === BuyState.UNVERIFIED
              ? "No hay pedidos pendientes."
              : statusFilter === BuyState.VERIFIED
                ? "No hay ventas confirmadas en este filtro."
                : statusFilter === BuyState.DELETED
                  ? "No hay ventas rechazadas en este filtro."
                  : "No hay resultados para la búsqueda.";
</script>

<section class="mgmt-screen">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Ventas</h1>
                <p class="mgmt-muted">
                    Pedidos de la tienda: pendientes con stock reservado, confirmadas y rechazadas.
                    Las citas de taller viven en Reservas.
                </p>
                {#if statusFilter === BuyState.UNVERIFIED}
                    <p class="queue-hint" title={SALE_TIPS.age}>
                        Cola por antigüedad: las más antiguas primero.
                    </p>
                {/if}
            </div>
            <div class="mgmt-chip-row status-tabs" role="tablist" aria-label="Filtrar por estado">
                <span class="mgmt-chip origin" title="Pedidos originados en la tienda cliente">
                    <Icon icon={Store} size={18} ariaLabel="Origen" />
                    Origen: tienda cliente
                </span>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === "all"} aria-selected={statusFilter === "all"} on:click={() => setStatusTab("all")}>
                    <Icon icon={BadgeDollarSign} size={18} ariaLabel="Total" />
                    {counts.total} total
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.UNVERIFIED} aria-selected={statusFilter === BuyState.UNVERIFIED} title={SALE_TIPS.pending} on:click={() => setStatusTab(BuyState.UNVERIFIED)}>
                    <Icon icon={Inbox} size={18} ariaLabel="Pendientes" />
                    {counts.pending} pendientes
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.VERIFIED} aria-selected={statusFilter === BuyState.VERIFIED} title={SALE_TIPS.verified} on:click={() => setStatusTab(BuyState.VERIFIED)}>
                    <Icon icon={ShieldCheck} size={18} ariaLabel="Confirmadas" />
                    {counts.verified} confirmadas
                </button>
                <button type="button" role="tab" class="mgmt-chip tab" class:active={statusFilter === BuyState.DELETED} aria-selected={statusFilter === BuyState.DELETED} title={SALE_TIPS.rejected} on:click={() => setStatusTab(BuyState.DELETED)}>
                    <Icon icon={XCircle} size={18} ariaLabel="Rechazadas" />
                    {counts.rejected} rechazadas
                </button>
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando...
                    </span>
                {/if}
            </div>
        </header>

        <section class="mgmt-card">
            <div class="filters">
                <label class="filter-field search">
                    <Icon icon={Search} size={18} ariaLabel="Buscar" />
                    <input type="search" placeholder="Buscar por venta o cliente..." bind:value={query} />
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
                <SkeletonTiles count={6} columns={2} />
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
                                        <span class="sale-ico" aria-hidden="true">
                                            <Icon icon={BadgeDollarSign} size={18} ariaLabel="" />
                                        </span>
                                        <div class="sale-id-text">
                                            <strong class="sale-title" title={sale.id}>#{sale.id.slice(0, 8)}…</strong>
                                            <span class="sale-client" title={SALE_TIPS.client}>
                                                <Icon icon={User} size={13} ariaLabel="" />
                                                {resolveUserSale(sale.id)}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        class="sale-status {saleStateClass(sale.verified)}"
                                        title={sale.verified === BuyState.UNVERIFIED
                                            ? SALE_TIPS.pending
                                            : sale.verified === BuyState.VERIFIED
                                              ? SALE_TIPS.verified
                                              : SALE_TIPS.rejected}
                                    >
                                        {saleStateLabel(sale.verified)}
                                        <span class="tip-ico" aria-hidden="true"><Icon icon={CircleHelp} size={11} ariaLabel="" /></span>
                                    </span>
                                </div>
                                <div class="sale-metrics">
                                    <div class="metric" title={SALE_TIPS.amount}>
                                        <span class="metric-label">Importe</span>
                                        <span class="metric-value">{formatSaleMoney(sale.amount, code)}</span>
                                    </div>
                                    <div class="metric" title={SALE_TIPS.lines}>
                                        <span class="metric-label">
                                            <Icon icon={Package} size={12} ariaLabel="" />
                                            Líneas
                                        </span>
                                        <span class="metric-value">{lineCount}</span>
                                    </div>
                                    {#if isPending && ageLabel}
                                        <div
                                            class="metric age-metric"
                                            class:warn={ageUrgency === "warn"}
                                            class:critical={ageUrgency === "critical"}
                                            title={SALE_TIPS.age}
                                        >
                                            <span class="metric-label">
                                                <Icon icon={Clock} size={12} ariaLabel="" />
                                                Antigüedad
                                            </span>
                                            <span class="metric-value">{ageLabel}</span>
                                        </div>
                                    {/if}
                                </div>
                                <div class="sale-card-foot">
                                    <span class="sale-open">Ver detalle</span>
                                    <Icon icon={ChevronRight} size={18} ariaLabel="" />
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
    h1 { margin: 0; font-size: 1.2rem; letter-spacing: -0.01em; font-weight: 1000; }
    .status-tabs { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .mgmt-chip.origin { opacity: 0.95; border-style: dashed; }
    .mgmt-chip.tab {
        cursor: pointer; border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent; font: inherit; color: inherit;
    }
    .mgmt-chip.tab:hover { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent); }
    .mgmt-chip.tab.active {
        border-color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
        font-weight: 800;
    }
    .queue-hint { margin: 8px 0 0; font-size: 0.86rem; font-weight: 650; color: var(--md-sys-color-primary); }
    .filters {
        display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(180px, 0.6fr);
        gap: 12px; margin-bottom: 12px;
    }
    .filter-field { display: grid; gap: 6px; }
    .filter-field span { font-size: 0.86rem; color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent); }
    .filter-field.search {
        display: flex; align-items: center; gap: 10px;
        border: 1px solid var(--md-sys-color-outline-variant); border-radius: 14px;
        padding: 0 12px; background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
    }
    .filter-field.search input, .filter-field select {
        width: 100%; height: 44px; border: 0; outline: 0; background: transparent; color: inherit; font: inherit;
    }
    .sales-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        gap: 14px;
    }
    .sale-card {
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-left: 4px solid var(--md-sys-color-outline-variant);
        background: linear-gradient(
            165deg,
            color-mix(in srgb, var(--md-sys-color-surface-variant) 14%, var(--md-sys-color-surface)) 0%,
            var(--md-sys-color-surface) 48%
        );
        box-shadow: 0 1px 2px color-mix(in srgb, black 5%, transparent), 0 10px 28px color-mix(in srgb, black 6%, transparent);
        overflow: hidden;
        transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
    }
    .sale-card.is-pending { border-left-color: #d97706; }
    .sale-card[data-status="VERIFIED"] { border-left-color: #16a34a; }
    .sale-card[data-status="DELETED"] { border-left-color: #94a3b8; opacity: 0.92; }
    .sale-card.age-warn { border-left-color: #ea580c; }
    .sale-card.age-critical {
        border-left-color: #dc2626;
        box-shadow: 0 0 0 1px color-mix(in srgb, #dc2626 25%, transparent), 0 10px 28px color-mix(in srgb, #dc2626 12%, transparent);
    }
    .sale-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--md-sys-color-outline-variant));
        box-shadow: 0 6px 20px color-mix(in srgb, black 8%, transparent);
        transform: translateY(-1px);
    }
    .sale-card-hit {
        width: 100%; text-align: left; border: 0; background: transparent; color: inherit; font: inherit;
        padding: 14px 16px; display: grid; gap: 12px; cursor: pointer;
    }
    .sale-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
    .sale-id-block { display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
    .sale-ico {
        width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
        color: var(--md-sys-color-primary);
    }
    .sale-id-text { min-width: 0; display: grid; gap: 2px; }
    .sale-title {
        font-size: 0.95rem; font-weight: 850; letter-spacing: -0.01em;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sale-client {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 0.8rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant);
    }
    .sale-status {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
        padding: 5px 10px; border-radius: 999px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent); white-space: nowrap;
    }
    .sale-status.unverified {
        color: #b45309; background: color-mix(in srgb, #f59e0b 14%, transparent);
        border-color: color-mix(in srgb, #f59e0b 30%, transparent);
    }
    .sale-status.verified {
        color: #15803d; background: color-mix(in srgb, #16a34a 14%, transparent);
        border-color: color-mix(in srgb, #16a34a 28%, transparent);
    }
    .sale-status.rejected { color: #64748b; background: color-mix(in srgb, #94a3b8 16%, transparent); }
    .tip-ico { opacity: 0.55; display: inline-flex; }
    .sale-metrics {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: 8px;
    }
    .metric {
        padding: 8px 10px; border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 22%, transparent);
        display: grid; gap: 2px; min-width: 0; cursor: help;
    }
    .metric-label {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .metric-value {
        font-size: 0.95rem; font-weight: 850; font-variant-numeric: tabular-nums;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .age-metric.warn .metric-value { color: #ea580c; }
    .age-metric.critical .metric-value { color: #dc2626; }
    .sale-card-foot {
        display: flex; justify-content: space-between; align-items: center; padding-top: 4px;
        border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
        font-size: 0.8rem; font-weight: 750; color: var(--md-sys-color-primary);
    }
    @media (max-width: 640px) {
        .filters { grid-template-columns: 1fr; }
        .sale-metrics { grid-template-columns: 1fr 1fr; }
    }
</style>
