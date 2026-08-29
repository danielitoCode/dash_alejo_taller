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
    import { sales } from "../../../../infrastructure/presentation/navigation/nested.router";
    import {
        ArrowLeft,
        BadgeDollarSign,
        CheckCircle2,
        ChevronDown,
        Clock,
        Hash,
        Package,
        ShieldCheck,
        Truck,
        User,
        XCircle,
    } from "lucide-svelte";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { availableStock } from "../../../product/domain/entity/Product";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const saleId = navBackStackEntry?.args?.id ?? "";
    let loading = false;
    let confirming = false;
    let rejecting = false;
    let showDetails = false;

    $: sale = saleId ? $saleStore.items.find((s) => s.id === saleId) ?? null : null;
    $: user = sale ? $userManagementStore.items.find((u) => u.id === sale.userId) : null;
    $: busy = confirming || rejecting;
    $: canDecide = sale?.verified === BuyState.UNVERIFIED && !busy;

    function goBack() {
        // Navegación anidada: nunca uses history.back() del browser.
        navController.popOrNavigate(sales.path);
    }

    onMount(() => {
        if (!saleId) return;
        loading = true;
        Promise.all([
            saleStore.syncAll(),
            userManagementStore.syncAll(),
            productStore.syncAll(),
        ])
            .catch((e) => logger.error(e?.message ?? e, e?.stack))
            .finally(() => {
                loading = false;
            });
    });

    function formatIso(value: string | number | Date | null | undefined): string {
        if (value == null || value === "") return "—";
        try {
            const d = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(d.getTime())) return String(value);
            return d.toLocaleString();
        } catch {
            return String(value);
        }
    }

    function deliveryLabel(d: DeliveryType | string | null | undefined): string {
        if (d === DeliveryType.PICKUP || d === "PICKUP") return "Recogida en tienda";
        if (d === DeliveryType.DELIVERY || d === "DELIVERY") return "Envío a domicilio";
        return String(d ?? "—");
    }

    function saleStateClass(state: BuyState | string): string {
        if (state === BuyState.VERIFIED || state === "VERIFIED") return "ok";
        if (state === BuyState.DELETED || state === "DELETED") return "bad";
        return "pending";
    }

    function productDisplayName(productId: string): string {
        const p = $productStore.items.find((x) => x.id === productId);
        if (p?.name?.trim()) return p.name.trim();
        return "Producto no encontrado en catálogo";
    }

    $: currencyCode = (sale as any)?.currency ?? "";

    async function onConfirm() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        if (!window.confirm("¿Confirmar esta venta?\nSe descontará stock y se registrará la salida.")) return;
        confirming = true;
        try {
            await saleStore.confirmSale(sale.id);
            toastStore.success("Venta confirmada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo confirmar.");
        } finally {
            confirming = false;
        }
    }

    async function onReject() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        if (!window.confirm("¿Rechazar esta venta?\nSolo se libera el stock reservado.")) return;
        rejecting = true;
        try {
            await saleStore.rejectSale(sale.id);
            toastStore.success("Venta rechazada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo rechazar.");
        } finally {
            rejecting = false;
        }
    }

    $: lineSum = sale?.products?.reduce((acc, p) => acc + saleLineTotal(p), 0) ?? 0;
</script>

<section class="mgmt-page sale-detail" aria-label="Detalle de venta">
    <header class="mgmt-header detail-back-bar">
        <div class="mgmt-toolbar">
            <button class="mgmt-btn ghost back-btn" type="button" on:click={goBack}>
                <Icon icon={ArrowLeft} size={18} ariaLabel="Volver" />
                Volver al listado de ventas
            </button>
        </div>
    </header>

    {#if !saleId}
        <div class="mgmt-card"><p class="mgmt-muted">Falta el identificador de la venta.</p></div>
    {:else if loading && !sale}
        <div class="mgmt-card"><p class="mgmt-muted">Cargando detalle del pedido…</p></div>
    {:else if !sale}
        <div class="mgmt-card"><p class="mgmt-muted">No se encontró esta venta.</p></div>
    {:else}
        <div class="detail-card">
            <div class="detail-accent" aria-hidden="true"></div>

            <div class="head">
                <div class="title">
                    <div class="ico" aria-hidden="true">
                        <Icon icon={BadgeDollarSign} size={20} ariaLabel="" />
                    </div>
                    <div class="title-text">
                        <p class="eyebrow">Pedido de venta</p>
                        <h1>{user?.name ?? "Cliente no identificado"}</h1>
                        <div class="chips">
                            {#if user?.email}
                                <span class="chip" title="Correo del cliente">
                                    <Icon icon={User} size={12} ariaLabel="" />
                                    {user.email}
                                </span>
                            {/if}
                            <span class="chip" title="Líneas del pedido">
                                <Icon icon={Package} size={12} ariaLabel="" />
                                {sale.products.length}
                                {sale.products.length === 1 ? "línea" : "líneas"}
                            </span>
                            <span class="chip" title="Modalidad de entrega">
                                <Icon icon={Truck} size={12} ariaLabel="" />
                                {deliveryLabel(sale.deliveryType)}
                            </span>
                        </div>

                        <button
                            type="button"
                            class="details-toggle"
                            aria-expanded={showDetails}
                            on:click={() => (showDetails = !showDetails)}
                        >
                            <Icon icon={ChevronDown} size={14} ariaLabel="" />
                            {showDetails ? "Ocultar datos técnicos" : "Ver datos técnicos"}
                        </button>

                        {#if showDetails}
                            <div class="meta">
                                <span class="meta-item">
                                    <Icon icon={Hash} size={13} ariaLabel="" />
                                    <span>ID venta: <code class="id-full">{sale.id}</code></span>
                                </span>
                                <span class="meta-item">
                                    <Icon icon={Clock} size={13} ariaLabel="" />
                                    Fecha del pedido: {formatIso(sale.date)}
                                </span>
                                <span class="meta-item">
                                    <Icon icon={Clock} size={13} ariaLabel="" />
                                    Registrado: {formatIso(sale.createdAtIso)}
                                </span>
                                <span
                                    class="meta-item"
                                    title="Confirmar descuenta stock y registra salida. Rechazar solo libera reserved."
                                >
                                    <Icon icon={ShieldCheck} size={13} ariaLabel="" />
                                    Confirmar → baja de stock · Rechazar → libera reserva
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="right">
                    <span
                        class="pill {saleStateClass(sale.verified)}"
                        title={saleStateLabel(sale.verified)}
                    >
                        {saleStateLabel(sale.verified)}
                    </span>
                    <div class="amount-block">
                        <span class="amount-label">Total del pedido</span>
                        <div class="amount">{formatSaleMoney(sale.amount, currencyCode)}</div>
                        {#if currencyCode}
                            <div class="currency-note">Moneda: {currencyCode}</div>
                        {/if}
                    </div>
                    {#if canDecide}
                        <div class="decision-actions">
                            <button
                                class="mgmt-btn primary confirm-btn"
                                type="button"
                                disabled={busy}
                                on:click={onConfirm}
                                title="Confirma la venta: descuenta stock y registra movimiento"
                            >
                                <Icon icon={CheckCircle2} size={16} ariaLabel="" />
                                {confirming ? "Confirmando…" : "Confirmar venta"}
                            </button>
                            <button
                                class="mgmt-btn danger reject-btn"
                                type="button"
                                disabled={busy}
                                on:click={onReject}
                                title="Rechaza el pedido y libera el stock reservado"
                            >
                                <Icon icon={XCircle} size={16} ariaLabel="" />
                                {rejecting ? "Rechazando…" : "Rechazar"}
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="lines-section">
                <div class="lines-head">
                    <div>
                        <h2>Productos del pedido</h2>
                        <p class="lines-sub">Detalle de cada ítem solicitado por el cliente</p>
                    </div>
                    <span class="lines-sum" title="Suma de las líneas">
                        Suma líneas: {formatSaleMoney(lineSum, currencyCode)}
                    </span>
                </div>

                <div class="lines">
                    {#each sale.products as line (line.productId + String(line.quantity))}
                        {@const product = $productStore.items.find((p) => p.id === line.productId)}
                        {@const avail = product ? availableStock(product) : null}
                        {@const displayName = productDisplayName(line.productId)}
                        <article class="line-row">
                            <div class="line-main">
                                <div class="line-title" title={displayName}>{displayName}</div>
                                <div class="line-id" title="Identificador del producto en catálogo">
                                    ID: {line.productId}
                                </div>
                                <p class="line-sub">
                                    <span title="Precio unitario">Unitario: {formatSaleMoney(line.price, currencyCode)}</span>
                                    <span class="sep">·</span>
                                    <span title="Importe de esta línea">Línea: {formatSaleMoney(saleLineTotal(line), currencyCode)}</span>
                                    {#if avail != null}
                                        <span class="sep">·</span>
                                        <span class="avail" title="Stock disponible actual">Disp.: {avail}</span>
                                    {/if}
                                </p>
                            </div>
                            <div class="line-qty" title="Cantidad pedida de este producto">
                                <span class="qty-label">Cantidad</span>
                                <span class="qty-value">×{line.quantity}</span>
                            </div>
                        </article>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    .sale-detail { gap: 12px; }
    .detail-back-bar { position: sticky; top: 0; z-index: 5; padding-bottom: 4px; }
    .back-btn {
        display: inline-flex; align-items: center; gap: 8px;
        font-weight: 700; border-radius: 10px; padding: 8px 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        color: var(--md-sys-color-primary); cursor: pointer;
    }
    .back-btn:hover {
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    }
    .detail-card {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px; background: var(--md-sys-color-surface); overflow: hidden;
    }
    .detail-accent {
        height: 3px;
        background: linear-gradient(90deg, var(--md-sys-color-primary), color-mix(in srgb, var(--md-sys-color-primary) 40%, #22c55e));
    }
    .head {
        display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between;
        align-items: flex-start; padding: 16px 18px 14px;
    }
    .title { display: flex; gap: 12px; align-items: flex-start; min-width: 0; flex: 1 1 260px; }
    .eyebrow {
        margin: 0 0 2px; font-size: 0.68rem; font-weight: 750; text-transform: uppercase;
        letter-spacing: 0.06em; color: var(--md-sys-color-primary); opacity: 0.9;
    }
    .title h1 { margin: 0; font-size: 1.15rem; font-weight: 800; letter-spacing: -0.015em; line-height: 1.25; }
    .ico {
        width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0;
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent); color: var(--md-sys-color-primary);
    }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .chip {
        display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; font-weight: 550;
        padding: 4px 9px; border-radius: 8px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 14%, transparent);
        color: var(--md-sys-color-on-surface-variant); max-width: 100%;
    }
    .details-toggle {
        margin-top: 10px; display: inline-flex; align-items: center; gap: 5px;
        border: 1px solid var(--md-sys-color-outline-variant); background: transparent; color: inherit;
        font: inherit; font-size: 0.78rem; font-weight: 650; padding: 5px 10px; border-radius: 8px; cursor: pointer;
    }
    .details-toggle:hover { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 25%, transparent); }
    .meta {
        margin-top: 10px; display: grid; gap: 6px; font-size: 0.8rem; padding: 10px 12px; border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 10%, transparent);
        color: var(--md-sys-color-on-surface-variant);
    }
    .meta-item { display: inline-flex; gap: 6px; align-items: flex-start; min-width: 0; }
    .id-full { font-size: 0.74rem; word-break: break-all; }
    .right { display: grid; gap: 10px; justify-items: end; min-width: 170px; }
    .amount-block { text-align: right; }
    .amount-label {
        display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.04em; color: var(--md-sys-color-on-surface-variant); margin-bottom: 2px;
    }
    .amount { font-size: 1.28rem; font-weight: 850; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .currency-note { font-size: 0.72rem; color: var(--md-sys-color-on-surface-variant); margin-top: 2px; }
    .decision-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .confirm-btn, .reject-btn { display: inline-flex; align-items: center; gap: 6px; }
    .mgmt-btn.danger {
        border: 1px solid color-mix(in srgb, #ef4444 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 10%, transparent); color: #fca5a5;
        border-radius: 9px; padding: 9px 12px; cursor: pointer; font-weight: 700;
    }
    .pill {
        display: inline-flex; padding: 4px 10px; border-radius: 6px; font-size: 0.68rem;
        font-weight: 750; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .pill.pending { color: #b45309; background: color-mix(in srgb, #f59e0b 12%, transparent); }
    .pill.ok { color: #15803d; background: color-mix(in srgb, #16a34a 12%, transparent); }
    .pill.bad { color: #64748b; background: color-mix(in srgb, #94a3b8 12%, transparent); }
    .lines-section {
        border-top: 1px solid var(--md-sys-color-outline-variant); padding: 14px 18px 16px; display: grid; gap: 12px;
    }
    .lines-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .lines-head h2 { margin: 0; font-size: 0.95rem; font-weight: 750; }
    .lines-sub { margin: 2px 0 0; font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant); }
    .lines-sum { font-size: 0.82rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant); }
    .lines { display: grid; gap: 8px; }
    .line-row {
        display: flex; justify-content: space-between; gap: 14px; align-items: center;
        padding: 12px 14px; border-radius: 10px; border: 1px solid var(--md-sys-color-outline-variant);
        border-left: 3px solid color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 8%, transparent);
    }
    .line-main { min-width: 0; flex: 1 1 auto; }
    .line-title { font-weight: 750; font-size: 0.95rem; line-height: 1.3; color: var(--md-sys-color-on-surface); }
    .line-id {
        margin-top: 2px; font-size: 0.72rem; font-weight: 500; color: var(--md-sys-color-on-surface-variant);
        opacity: 0.55; letter-spacing: 0.01em; word-break: break-all;
    }
    .line-sub {
        margin: 6px 0 0; font-size: 0.78rem; color: var(--md-sys-color-on-surface-variant);
        display: flex; flex-wrap: wrap; gap: 4px 0; align-items: center;
    }
    .sep { margin: 0 6px; opacity: 0.45; }
    .avail { color: var(--md-sys-color-primary); font-weight: 600; }
    .line-qty {
        flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; min-width: 72px;
        padding: 6px 10px; border-radius: 8px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
        color: var(--md-sys-color-primary); text-align: right;
    }
    .qty-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; }
    .qty-value { font-weight: 850; font-size: 0.95rem; font-variant-numeric: tabular-nums; line-height: 1.1; }
    @media (max-width: 720px) {
        .right { width: 100%; justify-items: stretch; }
        .amount-block { text-align: left; }
        .decision-actions { justify-content: stretch; }
        .decision-actions .mgmt-btn { flex: 1; justify-content: center; }
        .line-row { flex-direction: column; align-items: stretch; gap: 10px; }
        .line-qty { flex-direction: row; justify-content: space-between; align-items: center; width: 100%; text-align: left; }
    }
</style>
