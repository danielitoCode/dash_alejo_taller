<script lang="ts">
    import { onMount } from "svelte";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { saleStore } from "../viewmodel/sale.store";
    import type { Sale } from "../../domain/entity/Sale";
    import { BuyState } from "../../domain/entity/enums";
    import { ArrowLeft, BadgeDollarSign, CheckCircle2, Clock, Package } from "lucide-svelte";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const saleId = navBackStackEntry?.args?.id ?? "";
    let loading = false;
    $: sale = saleId ? $saleStore.items.find((s) => s.id === saleId) ?? null : null;

    onMount(() => {
        if (!saleId) return;
        if (sale) return;
        loading = true;
        saleStore
            .syncAll()
            .catch((e) => {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error("No se pudo cargar la venta.");
            })
            .finally(() => (loading = false));
    });

    function back() {
        navController.popBackStack();
    }

    async function confirmSale(s: Sale) {
        if (s.verified !== BuyState.UNVERIFIED) return;
        toastStore.info("Confirmando venta…", 1200);
        try {
            await saleStore.setVerified(s.id, BuyState.VERIFIED);
            toastStore.success("Venta confirmada", 1400);
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error("No se pudo confirmar la venta.");
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
                <h1 class="mgmt-h1">Detalle de venta</h1>
                <p class="mgmt-muted">Pedidos y estado de compra</p>
            </div>
        </div>
    </header>

    {#if !saleId}
        <div class="mgmt-card">
            <p class="mgmt-muted">Falta el id de la venta.</p>
        </div>
    {:else if loading}
        <div class="mgmt-card">
            <p class="mgmt-muted">Cargando…</p>
        </div>
    {:else if !sale}
        <div class="mgmt-card">
            <p class="mgmt-muted">No se encontró la venta.</p>
        </div>
    {:else}
        <div class="detail-card">
            <div class="head">
                <div class="title">
                    <div class="ico">
                        <Icon icon={BadgeDollarSign} size={18} ariaLabel="Venta" />
                    </div>
                    <div>
                        <h2>Venta #{sale.id.slice(0, 8)}</h2>
                        <div class="meta">
                            <span class="meta-item">
                                <Icon icon={Clock} size={14} ariaLabel="Fecha" />
                                {new Date(sale.date).toLocaleString()}
                            </span>
                            <span class="meta-item">
                                <Icon icon={Package} size={14} ariaLabel="Items" />
                                {sale.products.length} items
                            </span>
                        </div>
                    </div>
                </div>

                <div class="right">
                    <span class="pill {sale.verified === BuyState.UNVERIFIED ? 'unverified' : 'verified'}">
                        {sale.verified}
                    </span>
                    <div class="amount">${sale.amount.toFixed(2)}</div>
                    {#if sale.verified === BuyState.UNVERIFIED}
                        <button class="mgmt-btn" type="button" on:click={() => confirmSale(sale)}>
                            <Icon icon={CheckCircle2} size={18} ariaLabel="Confirmar" />
                            Confirmar
                        </button>
                    {:else}
                        <button class="mgmt-btn ghost" type="button" disabled>
                            Confirmada
                        </button>
                    {/if}
                </div>
            </div>

            <div class="body">
                <h3>Productos</h3>
                <div class="items">
                    {#each sale.products as p, idx (idx)}
                        <div class="item">
                            <div class="item-top">
                                <strong>{p.productId}</strong>
                                <span class="muted">x{p.quantity}</span>
                            </div>
                            <div class="item-sub">
                                <span class="muted">Unit: ${p.price.toFixed(2)}</span>
                                <span class="dot">•</span>
                                <span class="muted">Total: ${(p.price * p.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
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
    }

    .head {
        padding: 16px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 14px;
        align-items: start;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .title {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        align-items: start;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        letter-spacing: -0.01em;
        font-weight: 950;
    }

    h3 {
        margin: 0 0 10px 0;
        font-weight: 950;
        letter-spacing: -0.01em;
    }

    .ico {
        width: 38px;
        height: 38px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 32%, transparent);
    }

    .meta {
        margin-top: 6px;
        display: inline-flex;
        gap: 12px;
        flex-wrap: wrap;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
        font-size: 0.88rem;
    }

    .meta-item {
        display: inline-flex;
        gap: 6px;
        align-items: center;
    }

    .right {
        display: grid;
        gap: 10px;
        justify-items: end;
        min-width: 180px;
    }

    .amount {
        font-size: 1.5rem;
        font-weight: 1000;
        letter-spacing: -0.02em;
    }

    .pill {
        font-size: 0.72rem;
        font-weight: 900;
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
        justify-self: end;
    }

    .pill.verified {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
    }

    .pill.unverified {
        border-color: color-mix(in srgb, #a855f7 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #a855f7 12%, transparent);
    }

    .body {
        padding: 16px;
    }

    .items {
        display: grid;
        gap: 10px;
    }

    .item {
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
        border-radius: 18px;
        padding: 12px;
        display: grid;
        gap: 6px;
    }

    .item-top {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: baseline;
    }

    .item-sub {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
        font-size: 0.88rem;
    }

    .muted {
        color: inherit;
        opacity: 0.92;
    }

    .dot {
        opacity: 0.7;
    }

    @media (max-width: 720px) {
        .head {
            grid-template-columns: 1fr;
        }
        .right {
            justify-items: start;
            min-width: 0;
        }
        .amount,
        .pill {
            justify-self: start;
        }
    }
</style>

