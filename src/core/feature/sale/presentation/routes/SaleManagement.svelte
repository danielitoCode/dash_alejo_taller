<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { saleStore } from "../viewmodel/sale.store";
    import { BuyState } from "../../domain/entity/enums";
    import { salesDetail } from "../../../../infrastructure/presentation/navigation/nested.router";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonTiles from "../../../../infrastructure/presentation/components/SkeletonTiles.svelte";
    import {userManagementStore} from "../../../auth/presentation/viewmodel/user-management.store";
    import { BadgeDollarSign, ChevronRight, Inbox } from "lucide-svelte";

    export let navController: NavController;

    onMount(() => {
        saleStore.syncAll().catch(() => toastStore.error("Error al sincronizar ventas"));
        userManagementStore.syncAll().catch(() => toastStore.error("Error al usuarios desde administracion de ventas"));
    });

    function openDetail(id: string) {
        navController.navigate(salesDetail.path, { id });
    }

    $: items = $saleStore.items
        .slice()
        .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    $: pending = items.filter((s) => s.verified === BuyState.UNVERIFIED).length;
    $: isRefreshing = $saleStore.loading && items.length > 0;
    $: isInitialLoading = $saleStore.loading && items.length === 0;

    function resolveUserSale(saleId: string) {
        const sale = $saleStore.items.find(s => s.id === saleId);
        if (!sale) return "Usuario desconocido";
        const user = $userManagementStore.items.find(u => u.id === sale.userId);
        return user ? user.name : "Usuario desconocido";
    }
</script>

<section class="mgmt-screen">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Ventas</h1>
                <p class="mgmt-muted">Pedidos y confirmaciones</p>
            </div>
            <div class="mgmt-chip-row">
                <span class="mgmt-chip">
                    <Icon icon={BadgeDollarSign} size={18} ariaLabel="Total" />
                    {items.length} total
                </span>
                <span class="mgmt-chip">
                    <Icon icon={Inbox} size={18} ariaLabel="Pendientes" />
                    {pending} pendientes
                </span>
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando...
                    </span>
                {/if}
            </div>
        </header>
        <section class="mgmt-card">
            {#if isInitialLoading}
                <SkeletonTiles count={6} columns={2} />
            {:else if items.length === 0}
                <p class="mgmt-muted">No hay ventas registradas.</p>
            {:else}
                <div class="sales-grid">
                    {#each items as sale (sale.id)}
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
                                        <span class="pill {sale.verified === BuyState.UNVERIFIED ? 'unverified' : 'verified'}">
                                            {sale.verified}
                                        </span>
                                        <span class="dot">?</span>
                                        <span class="muted">{new Date(sale.date).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div class="sale-amount">${(sale.amount ?? 0).toFixed(2)}</div>
                            </div>

                            <div class="sale-meta">
                                <span class="muted">{sale.products?.length ?? 0} items</span>
                                <Icon icon={ChevronRight} size={16} ariaLabel="Abrir" />
                            </div>
                        </button>
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
        font-size: 1.0rem;
        letter-spacing: -0.01em;
        font-weight: 790;
    }
    .sales-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .sale-card {
        text-align: left;
        border-radius: 20px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        padding: 14px;
        display: grid;
        gap: 12px;
        box-shadow: 0 14px 34px color-mix(in srgb, black 30%, transparent);
    }

    .sale-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, var(--md-sys-color-surface) 88%);
    }

    .sale-card:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--md-sys-color-primary) 55%, white);
        outline-offset: 2px;
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
        font-size: 1.2rem;
        white-space: nowrap;
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

    .pill.verified {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
    }

    .pill.unverified {
        border-color: color-mix(in srgb, #a855f7 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #a855f7 12%, transparent);
    }

    .muted {
        color: inherit;
        opacity: 0.92;
    }

    .dot {
        opacity: 0.7;
    }

    @media (max-width: 860px) {
        .sales-grid {
            grid-template-columns: 1fr;
        }
    }
</style>



