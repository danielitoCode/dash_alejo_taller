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
            })
            .finally(() => {
                loading = false;
            });
    });

    function formatIso(value: string | number | Date | null | undefined): string {
        if (value == null || value === "") return "\u2014";
        try {
            const d = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(d.getTime())) return String(value);
            return d.toLocaleString();
        } catch {
            return String(value);
        }
    }

    function deliveryLabel(d: DeliveryType | string | null | undefined): string {
        if (d === DeliveryType.PICKUP || d === "PICKUP") return "Recogida (PICKUP)";
        if (d === DeliveryType.DELIVERY || d === "DELIVERY") return "Entrega (DELIVERY)";
        return String(d ?? "\u2014");
    }

    function saleStateClass(state: BuyState | string): string {
        if (state === BuyState.VERIFIED || state === "VERIFIED") return "ok";
        if (state === BuyState.DELETED || state === "DELETED") return "bad";
        return "pending";
    }

    $: currencyCode = (sale as any)?.currency ?? "";

    async function onConfirm() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        const ok = window.confirm(
            "Confirmar esta venta (VERIFIED)?\n\n" +
                "\u2022 existence -= qty por l\u00ednea\n" +
                "\u2022 reserved -= qty por l\u00ednea\n" +
                "\u2022 stock_movements salida_venta + finance"
        );
        if (!ok) return;
        confirming = true;
        try {
            await saleStore.confirmSale(sale.id);
            toastStore.success("Venta confirmada (VERIFIED). Stock y movimiento registrados.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo confirmar.");
        } finally {
            confirming = false;
        }
    }

    async function onReject() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        const ok = window.confirm(
            "Rechazar esta venta (DELETED)?\n\n" +
                "\u2022 reserved -= qty por l\u00ednea\n" +
                "\u2022 existence NO cambia\n"
        );
        if (!ok) return;
        rejecting = true;
        try {
            await saleStore.rejectSale(sale.id);
            toastStore.success("Venta rechazada (DELETED). Reserva liberada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo rechazar.");
        } finally {
            rejecting = false;
        }
    }

    $: lineSum =
        sale?.products?.reduce((acc, p) => acc + saleLineTotal(p), 0) ?? 0;
</script>

<section class="mgmt-page sale-detail" aria-label="Detalle de venta">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <button class="mgmt-btn ghost" type="button" on:click={() => navController.popBackStack()}>
                <Icon icon={ArrowLeft} size={18} ariaLabel="Volver" />
                Volver
            </button>
        </div>
    </header>

    {#if !saleId}
        <div class="mgmt-card"><p class="mgmt-muted">Falta el id de la venta.</p></div>
    {:else if loading && !sale}
        <div class="mgmt-card"><p class="mgmt-muted">Cargando...</p></div>
    {:else if !sale}
        <div class="mgmt-card"><p class="mgmt-muted">No se encontr\u00f3 la venta.</p></div>
    {:else}
        <div class="detail-card">
            <div class="detail-accent" aria-hidden="true"></div>
            <div class="head">
                <div class="title">
                    <div class="ico">
                        <Icon icon={BadgeDollarSign} size={18} ariaLabel="Venta" />
                    </div>
                    <div class="title-text">
                        <h1>{user?.name ?? "Usuario desconocido"}</h1>
                        <p class="sub-line">
                            <Icon icon={User} size={14} ariaLabel="Email" />
                            {user?.email ?? "\u2014"}
                        </p>
                        <p class="sub-line compact">
                            <Icon icon={Package} size={14} ariaLabel="Items" />
                            {sale.products.length} l\u00edneas
                            <span class="dot">\u00b7</span>
                            <Icon icon={Truck} size={14} ariaLabel="Entrega" />
                            {deliveryLabel(sale.deliveryType)}
                        </p>
                        <button
                            type="button"
                            class="details-toggle"
                            aria-expanded={showDetails}
                            on:click={() => (showDetails = !showDetails)}
                            title="IDs, fechas y reglas de confirmaci\u00f3n/rechazo"
                        >
                            <Icon icon={ChevronDown} size={16} ariaLabel="" />
                            {showDetails ? "Ocultar detalles" : "Ver detalles"}
                        </button>
                        {#if showDetails}
                            <div class="meta" id="sale-extra-details">
                                <span class="meta-item" title="Identificador del documento sale">
                                    <Icon icon={Hash} size={14} ariaLabel="Id venta" />
                                    <code class="id-full">{sale.id}</code>
                                </span>
                                <span class="meta-item" title="Usuario cliente del pedido">
                                    <Icon icon={User} size={14} ariaLabel="User id" />
                                    <code class="id-full">{sale.userId || "\u2014"}</code>
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
                                <span class="meta-item" title="Efecto en stock al confirmar o rechazar">
                                    <Icon icon={ShieldCheck} size={14} ariaLabel="Operaci\u00f3n" />
                                    Confirm: existence\u2212=qty + reserved\u2212=qty + salida_venta \u00b7 Reject: solo reserved\u2212=qty
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="right">
                    <span
                        class="pill {saleStateClass(sale.verified)}"
                        title={sale.verified === BuyState.UNVERIFIED
                            ? "Pendiente de aprobaci\u00f3n"
                            : sale.verified === BuyState.VERIFIED
                              ? "Confirmada: stock y finance aplicados"
                              : "Rechazada: reserved liberado"}
                    >
                        {saleStateLabel(sale.verified)}
                        <span class="pill-code">({sale.verified})</span>
                    </span>
                    <div class="amount" title="Importe total del pedido">{formatSaleMoney(sale.amount, currencyCode)}</div>
                    <div class="currency-note">
                        {#if currencyCode}
                            Moneda del documento: <strong>{currencyCode}</strong>
                        {:else}
                            Sin <code>currency</code> en documento
                        {/if}
                    </div>

                    {#if canDecide}
                        <div class="decision-actions">
                            <button
                                class="mgmt-btn primary confirm-btn"
                                type="button"
                                disabled={busy}
                                title="Confirma: baja stock, escribe salida_venta y finance"
                                on:click={onConfirm}
                            >
                                <Icon icon={CheckCircle2} size={18} ariaLabel="Confirmar" />
                                {confirming ? "Confirmando\u2026" : "Confirmar"}
                            </button>
                            <button
                                class="mgmt-btn danger reject-btn"
                                type="button"
                                disabled={busy}
                                title="Rechaza: libera reserved sin salida de mercanc\u00eda"
                                on:click={onReject}
                            >
                                <Icon icon={XCircle} size={18} ariaLabel="Rechazar" />
                                {rejecting ? "Rechazando\u2026" : "Rechazar"}
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="lines-section">
                <div class="lines-head">
                    <h2>L\u00edneas del pedido</h2>
                    <span class="lines-sum">Suma l\u00edneas: {formatSaleMoney(lineSum, currencyCode)}</span>
                </div>
                <div class="lines">
                    {#each sale.products as line (line.productId + String(line.quantity))}
                        {@const product = $productStore.items.find((p) => p.id === line.productId)}
                        {@const avail = product ? availableStock(product) : null}
                        <article class="line-row">
                            <div class="line-main">
                                <div class="line-title">{product?.name || line.productId}</div>
                                <p class="line-sub">ID: {line.productId}</p>
                                <p class="line-sub">
                                    Unidad: {formatSaleMoney(line.price, currencyCode)}
                                    \u00b7 L\u00ednea: {formatSaleMoney(saleLineTotal(line), currencyCode)}
                                    {#if avail != null}
                                        \u00b7 <span class="avail" title="available = max(0, existence \u2212 reserved)">disponible ahora: {avail}</span>
                                    {/if}
                                </p>
                            </div>
                            <div class="line-qty">\u00d7{line.quantity}</div>
                        </article>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    .sale-detail { gap: 14px; }
    .detail-card {
        position: relative;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 18px;
        padding: 0;
        background: linear-gradient(
            165deg,
            color-mix(in srgb, var(--md-sys-color-surface-variant) 16%, var(--md-sys-color-surface)) 0%,
            var(--md-sys-color-surface) 40%
        );
        display: grid;
        gap: 0;
        box-shadow: 0 1px 2px color-mix(in srgb, black 5%, transparent), 0 12px 32px color-mix(in srgb, black 6%, transparent);
        overflow: hidden;
    }
    .detail-accent {
        height: 4px;
        background: linear-gradient(90deg, var(--md-sys-color-primary), color-mix(in srgb, var(--md-sys-color-primary) 40%, #22c55e));
    }
    .head {
        display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-start;
        padding: 16px 18px 8px;
    }
    .title { display: flex; gap: 12px; align-items: flex-start; min-width: 0; flex: 1 1 240px; }
    .title h1 { margin: 0; font-size: 1.2rem; font-weight: 900; letter-spacing: -0.02em; }
    .sub-line {
        margin: 4px 0 0; display: inline-flex; gap: 6px; align-items: center; flex-wrap: wrap;
        font-size: 0.9rem; color: color-mix(in srgb, var(--md-sys-color-on-background) 75%, transparent);
    }
    .ico {
        width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        color: var(--md-sys-color-primary);
    }
    .title-text { min-width: 0; }
    .sub-line.compact { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 4px; }
    .dot { opacity: 0.55; }
    .details-toggle {
        margin-top: 8px; display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 25%, transparent);
        color: inherit; font: inherit; font-size: 0.84rem; font-weight: 700;
        padding: 6px 12px; border-radius: 10px; cursor: pointer;
    }
    .meta {
        margin-top: 10px; display: grid; gap: 8px; font-size: 0.86rem;
        padding: 10px 12px; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 18%, transparent);
        color: var(--md-sys-color-on-surface-variant);
    }
    .meta-item { display: inline-flex; gap: 6px; align-items: flex-start; min-width: 0; }
    .id-full { font-size: 0.78rem; word-break: break-all; }
    .right { display: grid; gap: 10px; justify-items: end; min-width: 180px; }
    .amount { font-size: 1.45rem; font-weight: 1000; letter-spacing: -0.02em; }
    .currency-note {
        font-size: 0.8rem; text-align: right;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent); max-width: 220px;
    }
    .decision-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .confirm-btn, .reject-btn { display: inline-flex; align-items: center; gap: 8px; }
    .mgmt-btn.danger {
        border: 1px solid color-mix(in srgb, #ef4444 45%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 18%, transparent); color: #fca5a5;
        border-radius: 12px; padding: 10px 14px; cursor: pointer; font-weight: 700;
    }
    .mgmt-btn.danger:disabled { opacity: 0.55; cursor: not-allowed; }
    .pill {
        display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px;
        font-size: 0.82rem; font-weight: 800; border: 1px solid var(--md-sys-color-outline-variant);
        cursor: help;
    }
    .pill.pending {
        background: color-mix(in srgb, #f59e0b 18%, transparent);
        border-color: color-mix(in srgb, #f59e0b 40%, var(--md-sys-color-outline-variant)); color: #fbbf24;
    }
    .pill.ok {
        background: color-mix(in srgb, #16a34a 14%, transparent);
        border-color: color-mix(in srgb, #16a34a 28%, transparent); color: #15803d;
    }
    .pill.bad {
        background: color-mix(in srgb, #ef4444 16%, transparent);
        border-color: color-mix(in srgb, #ef4444 40%, var(--md-sys-color-outline-variant)); color: #fca5a5;
    }
    .pill-code { font-weight: 600; opacity: 0.85; font-size: 0.75rem; }
    .lines-section {
        display: grid; gap: 10px; border-top: 1px solid var(--md-sys-color-outline-variant);
        padding: 14px 18px 18px;
    }
    .lines-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
    .lines-head h2 { margin: 0; font-size: 1rem; font-weight: 850; }
    .lines-sum { font-size: 0.88rem; font-weight: 700; color: color-mix(in srgb, var(--md-sys-color-on-background) 80%, transparent); }
    .lines { display: grid; gap: 8px; }
    .line-row {
        display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;
        padding: 12px 14px; border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-left: 3px solid color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 18%, transparent);
    }
    .line-main { min-width: 0; }
    .line-title { font-weight: 800; }
    .line-sub { margin: 2px 0 0; font-size: 0.84rem; color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent); }
    .line-qty {
        font-weight: 900; white-space: nowrap; font-variant-numeric: tabular-nums;
        padding: 4px 10px; border-radius: 8px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
        color: var(--md-sys-color-primary); font-size: 0.9rem;
    }
    .avail { color: color-mix(in srgb, var(--md-sys-color-primary) 85%, white); font-weight: 650; }
    @media (max-width: 720px) {
        .right { width: 100%; justify-items: stretch; }
        .decision-actions { justify-content: stretch; }
        .decision-actions .mgmt-btn { flex: 1; justify-content: center; }
        .currency-note { text-align: left; max-width: none; }
    }
</style>
