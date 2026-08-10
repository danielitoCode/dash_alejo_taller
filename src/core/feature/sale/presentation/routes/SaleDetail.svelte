<script lang="ts">
    import { onMount } from "svelte";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { saleStore } from "../viewmodel/sale.store";
    import { BuyState, DeliveryType } from "../../domain/entity/enums";
    import { saleLineTotal } from "../../domain/entity/Sale";
    import { saleStateLabel } from "../../domain/util/filterSalesByStatus";
    import { formatSaleMoney } from "../../domain/util/formatSaleMoney";
    import {
        ArrowLeft,
        BadgeDollarSign,
        CheckCircle2,
        Clock,
        Hash,
        Package,
        ShieldCheck,
        Truck,
        User,
    } from "lucide-svelte";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const saleId = navBackStackEntry?.args?.id ?? "";
    let loading = false;
    let confirming = false;

    $: sale = saleId ? $saleStore.items.find((s) => s.id === saleId) ?? null : null;
    $: user = sale ? $userManagementStore.items.find((u) => u.id === sale.userId) : null;
    $: canConfirm = sale?.verified === BuyState.UNVERIFIED && !confirming;

    onMount(() => {
        if (!saleId) return;
        loading = true;
        Promise.all([
            sale ? Promise.resolve() : saleStore.syncAll(),
            userManagementStore.syncAll(),
            productStore.syncAll(),
        ])
            .catch((e) => {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error("No se pudo cargar el detalle de la venta.");
            })
            .finally(() => (loading = false));
    });

    function back() {
        navController.popBackStack();
    }

    function resolveProduct(productId: string) {
        const product = $productStore.items.find((p) => p.id === productId);
        return product?.name ?? "Producto desconocido";
    }

    function saleStateClass(state: BuyState): string {
        if (state === BuyState.UNVERIFIED) return "unverified";
        if (state === BuyState.DELETED) return "rejected";
        return "verified";
    }

    function deliveryLabel(d: DeliveryType | null | undefined): string {
        if (d === DeliveryType.PICKUP) return "Recogida (PICKUP)";
        if (d === DeliveryType.DELIVERY) return "Entrega (DELIVERY)";
        return "No indicado";
    }

    function formatIso(iso: string | undefined): string {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    }

    async function onConfirm() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        const ok = window.confirm(
            "Confirmar esta venta (VERIFIED)?\n\n" +
                "Se aplicará la misma semántica que el operador:\n" +
                "• existence -= qty por línea\n" +
                "• reserved -= qty por línea\n\n" +
                "Esta acción es idempotente si ya está confirmada."
        );
        if (!ok) return;

        confirming = true;
        try {
            toastStore.info("Confirmando venta y actualizando stock…", 2000);
            await saleStore.confirmSale(sale.id);
            await productStore.syncAll().catch(() => {});
            toastStore.success("Venta confirmada (VERIFIED). Stock actualizado.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo confirmar la venta.");
        } finally {
            confirming = false;
        }
    }

    $: currencyCode = sale?.currency?.trim() || null;
    $: linesTotal = sale
        ? sale.products.reduce((acc, p) => acc + saleLineTotal(p), 0)
        : 0;
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
                <p class="mgmt-muted">
                    Supervisión · confirmación con semántica de stock idéntica al operador
                </p>
            </div>
        </div>
    </header>

    {#if !saleId}
        <div class="mgmt-card">
            <p class="mgmt-muted">Falta el id de la venta.</p>
        </div>
    {:else if loading && !sale}
        <div class="mgmt-card">
            <p class="mgmt-muted">Cargando...</p>
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
                        <h1>{user?.name ?? "Usuario desconocido"}</h1>
                        <p class="sub-line">
                            <Icon icon={User} size={14} ariaLabel="Email" />
                            {user?.email ?? "—"}
                        </p>
                        <div class="meta">
                            <span class="meta-item">
                                <Icon icon={Hash} size={14} ariaLabel="Id venta" />
                                <code class="id-full">{sale.id}</code>
                            </span>
                            <span class="meta-item">
                                <Icon icon={User} size={14} ariaLabel="User id" />
                                <code class="id-full">{sale.userId || "—"}</code>
                            </span>
                            <span class="meta-item">
                                <Icon icon={Clock} size={14} ariaLabel="Fecha pedido" />
                                Pedido: {formatIso(sale.date)}
                            </span>
                            <span class="meta-item">
                                <Icon icon={Clock} size={14} ariaLabel="Creado" />
                                Creado: {formatIso(sale.createdAtIso)}
                            </span>
                            <span class="meta-item">
                                <Icon icon={Clock} size={14} ariaLabel="Actualizado" />
                                Actualizado: {formatIso(sale.updatedAtIso)}
                            </span>
                            <span class="meta-item">
                                <Icon icon={Package} size={14} ariaLabel="Items" />
                                {sale.products.length} líneas
                            </span>
                            <span class="meta-item">
                                <Icon icon={Truck} size={14} ariaLabel="Entrega" />
                                {deliveryLabel(sale.deliveryType)}
                            </span>
                            <span class="meta-item">
                                <Icon icon={ShieldCheck} size={14} ariaLabel="Operación" />
                                Confirm: existence−=qty y reserved−=qty (paridad operador)
                            </span>
                        </div>
                    </div>
                </div>

                <div class="right">
                    <span class="pill {saleStateClass(sale.verified)}">
                        {saleStateLabel(sale.verified)}
                        <span class="pill-code">({sale.verified})</span>
                    </span>
                    <div class="amount">{formatSaleMoney(sale.amount, currencyCode)}</div>
                    <div class="currency-note">
                        {#if currencyCode}
                            Moneda del documento: <strong>{currencyCode}</strong>
                        {:else}
                            Sin <code>currency</code> en documento (no se fuerza USD)
                        {/if}
                    </div>

                    {#if canConfirm}
                        <button
                            class="mgmt-btn primary confirm-btn"
                            type="button"
                            disabled={confirming}
                            on:click={onConfirm}
                        >
                            <Icon icon={CheckCircle2} size={18} ariaLabel="Confirmar" />
                            {confirming ? "Confirmando…" : "Confirmar venta"}
                        </button>
                    {:else if sale.verified === BuyState.VERIFIED}
                        <button class="mgmt-btn ghost" type="button" disabled>
                            Ya confirmada
                        </button>
                    {:else if sale.verified === BuyState.DELETED}
                        <button class="mgmt-btn ghost" type="button" disabled>
                            Rechazada (no confirmable)
                        </button>
                    {/if}
                </div>
            </div>

            <div class="body">
                <div class="body-head">
                    <h3>Líneas del pedido</h3>
                    <span class="muted">Suma líneas: {formatSaleMoney(linesTotal, currencyCode)}</span>
                </div>
                <div class="items">
                    {#each sale.products as p, idx (p.productId + "-" + idx)}
                        <div class="item">
                            <div class="item-top">
                                <div>
                                    <strong>{resolveProduct(p.productId)}</strong>
                                    <div class="product-id muted">id: <code>{p.productId}</code></div>
                                </div>
                                <span class="qty">×{p.quantity}</span>
                            </div>
                            <div class="item-sub">
                                <span>Unit: {formatSaleMoney(p.price, currencyCode)}</span>
                                <span class="dot">•</span>
                                <span>Línea: {formatSaleMoney(saleLineTotal(p), currencyCode)}</span>
                            </div>
                        </div>
                    {:else}
                        <p class="muted">Sin productos en este pedido.</p>
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
        min-width: 0;
    }

    h1 {
        margin: 0;
        font-size: 1.35rem;
        letter-spacing: -0.01em;
        font-weight: 1000;
    }

    h3 {
        margin: 0;
        font-weight: 950;
        letter-spacing: -0.01em;
    }

    .sub-line {
        margin: 4px 0 0;
        display: inline-flex;
        gap: 6px;
        align-items: center;
        font-size: 0.92rem;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 75%, transparent);
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
        margin-top: 10px;
        display: grid;
        gap: 8px;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 78%, transparent);
        font-size: 0.86rem;
    }

    .meta-item {
        display: inline-flex;
        gap: 6px;
        align-items: flex-start;
        min-width: 0;
    }

    .id-full {
        font-size: 0.78rem;
        word-break: break-all;
    }

    .right {
        display: grid;
        gap: 10px;
        justify-items: end;
        min-width: 180px;
    }

    .amount {
        font-size: 1.45rem;
        font-weight: 1000;
        letter-spacing: -0.02em;
    }

    .currency-note {
        font-size: 0.8rem;
        text-align: right;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent);
        max-width: 220px;
    }

    .confirm-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
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

    .pill-code {
        font-weight: 600;
        opacity: 0.85;
    }

    .pill.verified {
        border-color: color-mix(in srgb, #22c55e 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
        color: #4ade80;
    }

    .pill.unverified {
        border-color: color-mix(in srgb, #f97316 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f97316 12%, transparent);
        color: #fb923c;
    }

    .pill.rejected {
        border-color: color-mix(in srgb, #ef4444 38%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 12%, transparent);
        color: #f87171;
    }

    .body {
        padding: 16px;
    }

    .body-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 10px;
        flex-wrap: wrap;
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
        align-items: flex-start;
    }

    .product-id {
        margin-top: 2px;
        font-size: 0.78rem;
    }

    .qty {
        font-weight: 900;
        white-space: nowrap;
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
        opacity: 0.9;
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
        .pill,
        .currency-note {
            justify-self: start;
            text-align: left;
        }
    }
</style>
