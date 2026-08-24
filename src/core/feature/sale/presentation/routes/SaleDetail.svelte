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
            .catch((e) => logger.error(e?.message ?? e, e?.stack))
            .finally(() => { loading = false; });
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
        if (d === DeliveryType.PICKUP || d === "PICKUP") return "Recogida";
        if (d === DeliveryType.DELIVERY || d === "DELIVERY") return "Entrega";
        return String(d ?? "—");
    }

    function saleStateClass(state: BuyState | string): string {
        if (state === BuyState.VERIFIED || state === "VERIFIED") return "ok";
        if (state === BuyState.DELETED || state === "DELETED") return "bad";
        return "pending";
    }

    $: currencyCode = (sale as any)?.currency ?? "";

    async function onConfirm() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        if (!window.confirm("Confirmar venta?\nStock −= qty · salida_venta · finance")) return;
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
        if (!window.confirm("Rechazar venta?\nSolo se libera reserved.")) return;
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
        <div class="mgmt-card"><p class="mgmt-muted">Cargando…</p></div>
    {:else if !sale}
        <div class="mgmt-card"><p class="mgmt-muted">No se encontró la venta.</p></div>
    {:else}
        <div class="detail-card">
            <div class="detail-accent" aria-hidden="true"></div>
            <div class="head">
                <div class="title">
                    <div class="ico"><Icon icon={BadgeDollarSign} size={18} ariaLabel="Venta" /></div>
                    <div class="title-text">
                        <h1>{user?.name ?? "Usuario desconocido"}</h1>
                        <p class="sub-line">
                            <Icon icon={User} size={13} ariaLabel="" />
                            {user?.email ?? "—"}
                        </p>
                        <p class="sub-line compact">
                            <Icon icon={Package} size={13} ariaLabel="" />
                            {sale.products.length} líneas
                            <span class="dot">·</span>
                            <Icon icon={Truck} size={13} ariaLabel="" />
                            {deliveryLabel(sale.deliveryType)}
                        </p>
                        <button type="button" class="details-toggle" aria-expanded={showDetails} on:click={() => (showDetails = !showDetails)}>
                            <Icon icon={ChevronDown} size={14} ariaLabel="" />
                            {showDetails ? "Ocultar meta" : "Ver meta"}
                        </button>
                        {#if showDetails}
                            <div class="meta">
                                <span class="meta-item"><Icon icon={Hash} size={13} ariaLabel="" /><code class="id-full">{sale.id}</code></span>
                                <span class="meta-item"><Icon icon={Clock} size={13} ariaLabel="" />Pedido: {formatIso(sale.date)}</span>
                                <span class="meta-item"><Icon icon={Clock} size={13} ariaLabel="" />Creado: {formatIso(sale.createdAtIso)}</span>
                                <span class="meta-item" title="Confirm: stock+salida+finance · Reject: libera reserved">
                                    <Icon icon={ShieldCheck} size={13} ariaLabel="" />
                                    Confirm baja stock · Reject libera reserved
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="right">
                    <span class="pill {saleStateClass(sale.verified)}" title={saleStateLabel(sale.verified)}>
                        {saleStateLabel(sale.verified)}
                    </span>
                    <div class="amount">{formatSaleMoney(sale.amount, currencyCode)}</div>
                    {#if currencyCode}<div class="currency-note">{currencyCode}</div>{/if}
                    {#if canDecide}
                        <div class="decision-actions">
                            <button class="mgmt-btn primary confirm-btn" type="button" disabled={busy} on:click={onConfirm}>
                                <Icon icon={CheckCircle2} size={16} ariaLabel="" />
                                {confirming ? "…" : "Confirmar"}
                            </button>
                            <button class="mgmt-btn danger reject-btn" type="button" disabled={busy} on:click={onReject}>
                                <Icon icon={XCircle} size={16} ariaLabel="" />
                                {rejecting ? "…" : "Rechazar"}
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
            <div class="lines-section">
                <div class="lines-head">
                    <h2>Líneas</h2>
                    <span class="lines-sum">{formatSaleMoney(lineSum, currencyCode)}</span>
                </div>
                <div class="lines">
                    {#each sale.products as line (line.productId + String(line.quantity))}
                        {@const product = $productStore.items.find((p) => p.id === line.productId)}
                        {@const avail = product ? availableStock(product) : null}
                        <article class="line-row">
                            <div class="line-main">
                                <div class="line-title">{product?.name || line.productId}</div>
                                <p class="line-sub">
                                    {formatSaleMoney(line.price, currencyCode)} · línea {formatSaleMoney(saleLineTotal(line), currencyCode)}
                                    {#if avail != null} · disp. {avail}{/if}
                                </p>
                            </div>
                            <div class="line-qty">×{line.quantity}</div>
                        </article>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</section>

<style>
    .sale-detail { gap: 12px; }
    .detail-card {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        background: var(--md-sys-color-surface);
        overflow: hidden;
    }
    .detail-accent {
        height: 3px;
        background: linear-gradient(90deg, var(--md-sys-color-primary), color-mix(in srgb, var(--md-sys-color-primary) 40%, #22c55e));
    }
    .head {
        display: flex; flex-wrap: wrap; gap: 14px;
        justify-content: space-between; align-items: flex-start;
        padding: 14px 16px 10px;
    }
    .title { display: flex; gap: 10px; align-items: flex-start; min-width: 0; flex: 1 1 220px; }
    .title h1 { margin: 0; font-size: 1.08rem; font-weight: 800; }
    .sub-line {
        margin: 3px 0 0; display: inline-flex; gap: 5px; align-items: center; flex-wrap: wrap;
        font-size: 0.82rem; color: var(--md-sys-color-on-surface-variant);
    }
    .ico {
        width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
        color: var(--md-sys-color-primary);
    }
    .dot { opacity: 0.5; }
    .details-toggle {
        margin-top: 6px; display: inline-flex; align-items: center; gap: 4px;
        border: 1px solid var(--md-sys-color-outline-variant); background: transparent;
        color: inherit; font: inherit; font-size: 0.78rem; font-weight: 650;
        padding: 4px 9px; border-radius: 7px; cursor: pointer;
    }
    .meta {
        margin-top: 8px; display: grid; gap: 5px; font-size: 0.78rem;
        padding: 8px 10px; border-radius: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 10%, transparent);
        color: var(--md-sys-color-on-surface-variant);
    }
    .meta-item { display: inline-flex; gap: 5px; align-items: flex-start; }
    .id-full { font-size: 0.72rem; word-break: break-all; }
    .right { display: grid; gap: 6px; justify-items: end; min-width: 140px; }
    .amount { font-size: 1.2rem; font-weight: 850; font-variant-numeric: tabular-nums; }
    .currency-note { font-size: 0.72rem; color: var(--md-sys-color-on-surface-variant); }
    .decision-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .confirm-btn, .reject-btn { display: inline-flex; align-items: center; gap: 5px; }
    .mgmt-btn.danger {
        border: 1px solid color-mix(in srgb, #ef4444 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 10%, transparent); color: #fca5a5;
        border-radius: 9px; padding: 8px 11px; cursor: pointer; font-weight: 700;
    }
    .pill {
        display: inline-flex; padding: 3px 8px; border-radius: 5px;
        font-size: 0.68rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .pill.pending { color: #b45309; background: color-mix(in srgb, #f59e0b 12%, transparent); }
    .pill.ok { color: #15803d; background: color-mix(in srgb, #16a34a 12%, transparent); }
    .pill.bad { color: #64748b; background: color-mix(in srgb, #94a3b8 12%, transparent); }
    .lines-section {
        border-top: 1px solid var(--md-sys-color-outline-variant);
        padding: 12px 16px 14px; display: grid; gap: 8px;
    }
    .lines-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
    .lines-head h2 { margin: 0; font-size: 0.9rem; font-weight: 750; }
    .lines-sum { font-size: 0.8rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant); }
    .lines { display: grid; gap: 6px; }
    .line-row {
        display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;
        padding: 10px 11px; border-radius: 9px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-left: 3px solid color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 8%, transparent);
    }
    .line-title { font-weight: 750; font-size: 0.88rem; }
    .line-sub { margin: 2px 0 0; font-size: 0.76rem; color: var(--md-sys-color-on-surface-variant); }
    .line-qty {
        font-weight: 800; font-variant-numeric: tabular-nums; font-size: 0.82rem;
        padding: 2px 7px; border-radius: 5px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
        color: var(--md-sys-color-primary);
    }
    @media (max-width: 720px) {
        .right { width: 100%; justify-items: stretch; }
        .decision-actions { justify-content: stretch; }
        .decision-actions .mgmt-btn { flex: 1; justify-content: center; }
    }
</style>
