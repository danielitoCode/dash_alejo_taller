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
        formatSaleMoney,
        saleCurrencyCode,
    } from "../../domain/util/formatSaleMoney";
    import { salesDetail } from "../../../../infrastructure/presentation/navigation/nested.router";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonTiles from "../../../../infrastructure/presentation/components/SkeletonTiles.svelte";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { BadgeDollarSign, ChevronRight, Inbox, Search, ShieldCheck, Store, XCircle } from "lucide-svelte";

    export let navController: NavController;

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

    function getSaleItemsDetails(saleId: string) {
        const sale = $saleStore.items.find((s) => s.id === saleId);
        if (!sale || !Array.isArray(sale.products)) return [];

        return sale.products.map((item) => {
            const rawId = typeof item === "string" ? item : (item?.productId ?? "");
            const product = $productStore.items.find((p) => p.id === rawId);
            return {
                name: product ? product.name : "Producto reservado / desconocido",
                quantity: typeof item === "object" ? (item?.quantity ?? 1) : 1,
                price: typeof item === "object" ? (item?.price ?? 0) : 0,
            };
        });
    }

    function resolveUserSale(saleId: string) {
        const sale = $saleStore.items.find((s) => s.id === saleId);
        if (!sale) return "Usuario desconocido";
        const user = $userManagementStore.items.find((u) => u.id === sale.userId);
        return user ? user.name : "Usuario desconocido";
    }

    $: items = $saleStore.items
        .slice()
        .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    $: counts = countSalesByStatus(items);
    $: isRefreshing = $saleStore.loading && items.length > 0;
    $: isInitialLoading = $saleStore.loading && items.length === 0;

    $: byStatus = filterSalesByStatus(items, statusFilter);

    $: filteredItems = byStatus.filter((sale) => {
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
                    Supervisión de pedidos originados en la tienda (web/Android). Este panel no crea ventas B2C.
                </p>
            </div>
            <div class="mgmt-chip-row status-tabs" role="tablist" aria-label="Filtrar por estado">
                <span class="mgmt-chip origin" title="Core1 4.4">
                    <Icon icon={Store} size={18} ariaLabel="Origen" />
                    Origen: tienda cliente
                </span>
                <button
                    type="button"
                    role="tab"
                    class="mgmt-chip tab"
                    class:active={statusFilter === "all"}
                    aria-selected={statusFilter === "all"}
                    on:click={() => setStatusTab("all")}
                >
                    <Icon icon={BadgeDollarSign} size={18} ariaLabel="Total" />
                    {counts.total} total
                </button>
                <button
                    type="button"
                    role="tab"
                    class="mgmt-chip tab"
                    class:active={statusFilter === BuyState.UNVERIFIED}
                    aria-selected={statusFilter === BuyState.UNVERIFIED}
                    on:click={() => setStatusTab(BuyState.UNVERIFIED)}
                >
                    <Icon icon={Inbox} size={18} ariaLabel="Pendientes" />
                    {counts.pending} pendientes
                </button>
                <button
                    type="button"
                    role="tab"
                    class="mgmt-chip tab"
                    class:active={statusFilter === BuyState.VERIFIED}
                    aria-selected={statusFilter === BuyState.VERIFIED}
                    on:click={() => setStatusTab(BuyState.VERIFIED)}
                >
                    <Icon icon={ShieldCheck} size={18} ariaLabel="Confirmadas" />
                    {counts.verified} confirmadas
                </button>
                <button
                    type="button"
                    role="tab"
                    class="mgmt-chip tab"
                    class:active={statusFilter === BuyState.DELETED}
                    aria-selected={statusFilter === BuyState.DELETED}
                    on:click={() => setStatusTab(BuyState.DELETED)}
                >
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
                        <div class="sale-card-wrapper">
                            <button class="sale-card" type="button" on:click={() => openDetail(sale.id)}>
                                <div class="sale-top">
                                    <div>
                                        <div class="sale-title">
                                            <h1>Venta: #{sale.id.slice(0, 8)}</h1>
                                        </div>
                                        <div class="sale-user-title">
                                            <h2>Usuario: {resolveUserSale(sale.id)}</h2>
                                        </div>
                                        <div class="sale-sub">
                                            <span class="pill {saleStateClass(sale.verified)}">
                                                {saleStateLabel(sale.verified)}
                                            </span>
                                            {#if code}
                                                <span class="pill currency">{code}</span>
                                            {/if}
                                            <span class="dot">•</span>
                                            <span class="muted">{new Date(sale.date).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div class="sale-amount">
                                        {formatSaleMoney(sale.amount ?? 0, sale.currency)}
                                    </div>
                                </div>

                                <div class="sale-meta">
                                    <span class="muted">{sale.products?.length ?? 0} items</span>
                                    <Icon icon={ChevronRight} size={16} ariaLabel="Abrir" />
                                </div>
                            </button>

                            <div class="custom-tooltip">
                                <div class="tooltip-header">
                                    <Icon icon={Inbox} size={14} ariaLabel="Productos" />
                                    <span>Contenido del pedido</span>
                                </div>
                                <div class="tooltip-body">
                                    {#each getSaleItemsDetails(sale.id) as item}
                                        <div class="tooltip-item">
                                            <span class="tooltip-qty">{item.quantity}x</span>
                                            <span class="tooltip-name">{item.name}</span>
                                            <span class="tooltip-price">
                                                {formatSaleMoney(item.price, sale.currency)}
                                            </span>
                                        </div>
                                    {:else}
                                        <span class="tooltip-empty">No hay productos en esta venta</span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </section>
    </div>
</section>

<style>
    h1 {
        margin: 0;
        font-size: 1.2rem;
        letter-spacing: -0.01em;
        font-weight: 1000;
    }

    h2 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: -0.01em;
        font-weight: 790;
    }

    .status-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }

    .mgmt-chip.origin {
        opacity: 0.95;
        border-style: dashed;
    }

    .mgmt-chip.tab {
        cursor: pointer;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        font: inherit;
        color: inherit;
        transition: background-color 140ms ease, border-color 140ms ease;
    }

    .mgmt-chip.tab:hover {
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }

    .mgmt-chip.tab.active {
        border-color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
        font-weight: 800;
    }

    .sales-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .filters {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(180px, 0.6fr);
        gap: 12px;
        margin-bottom: 12px;
    }

    .filter-field {
        display: grid;
        gap: 6px;
    }

    .filter-field span {
        font-size: 0.86rem;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent);
    }

    .filter-field.search {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 14px;
        padding: 0 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
    }

    .filter-field.search input,
    .filter-field select {
        width: 100%;
        height: 44px;
        border: 0;
        outline: 0;
        background: transparent;
        color: inherit;
        font: inherit;
    }

    .sale-card-wrapper {
        position: relative;
    }

    .sale-card {
        width: 100%;
        text-align: left;
        border-radius: 20px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        padding: 14px;
        display: grid;
        gap: 12px;
        box-shadow: 0 14px 34px color-mix(in srgb, black 30%, transparent);
        transition: border-color 0.2s ease, background-color 0.2s ease;
        cursor: pointer;
    }

    .sale-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, var(--md-sys-color-surface) 88%);
        z-index: 2;
    }

    .sale-card-wrapper:hover .custom-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28),
            visibility 0s ease 0s;
    }

    .sale-top {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
    }

    .sale-title {
        color: var(--md-sys-color-on-background);
        font-weight: 950;
        letter-spacing: -0.01em;
    }

    .sale-user-title {
        color: var(--md-sys-color-on-background);
        font-weight: 1200;
        letter-spacing: -0.01em;
    }

    .sale-sub {
        margin-top: 6px;
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
        font-size: 0.88rem;
    }

    .sale-amount {
        color: var(--md-sys-color-on-background);
        font-weight: 1000;
        letter-spacing: -0.02em;
        font-size: 1.15rem;
        white-space: nowrap;
        text-align: right;
    }

    .sale-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
        font-size: 0.88rem;
    }

    .pill {
        font-size: 0.72rem;
        font-weight: 900;
        padding: 4px 8px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
        white-space: nowrap;
        color: var(--md-sys-color-on-surface);
    }

    .pill.currency {
        font-weight: 800;
        letter-spacing: 0.04em;
        opacity: 0.95;
    }

    .pill.verified {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 15%, transparent);
        color: #4ade80;
    }

    .pill.unverified {
        border-color: color-mix(in srgb, #f97316 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f97316 15%, transparent);
        color: #fb923c;
    }

    .pill.rejected {
        border-color: color-mix(in srgb, #ef4444 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 15%, transparent);
        color: #f87171;
    }

    .muted {
        color: inherit;
        opacity: 0.92;
    }

    .dot {
        opacity: 0.7;
    }

    .custom-tooltip {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        width: 100%;
        max-width: 320px;
        background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 90%, black);
        backdrop-filter: blur(8px);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent);
        border-radius: 14px;
        padding: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        z-index: 50;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s ease 0.2s;
        pointer-events: none;
    }

    .tooltip-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        font-weight: 800;
        color: var(--md-sys-color-on-surface);
        padding-bottom: 8px;
        border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .tooltip-body {
        display: grid;
        gap: 6px;
    }

    .tooltip-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 8px;
        align-items: center;
        font-size: 0.9rem;
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 80%, transparent);
    }

    .tooltip-qty {
        font-weight: 900;
        color: var(--md-sys-color-primary);
        font-size: 0.85rem;
    }

    .tooltip-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
    }

    .tooltip-price {
        font-weight: 700;
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 60%, transparent);
        font-variant-numeric: tabular-nums;
    }

    .tooltip-empty {
        font-size: 0.85rem;
        color: var(--md-sys-color-error);
        font-style: italic;
    }

    @media (max-width: 860px) {
        .filters {
            grid-template-columns: 1fr;
        }

        .sales-grid {
            grid-template-columns: 1fr;
        }

        .custom-tooltip {
            display: none;
        }
    }
</style>
