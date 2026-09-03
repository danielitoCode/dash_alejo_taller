<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import { financeStore } from "../viewmodel/finance.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import {
        aggregateByProduct,
        type FinanceProductBucket,
    } from "../../domain/util/aggregateFinanceSummary";
    import {
        BadgeDollarSign,
        CircleHelp,
        Package,
        PiggyBank,
        RefreshCw,
        TrendingUp,
        Wallet,
    } from "lucide-svelte";

    const money = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const TOP_N = 10;

    /** Tips alineados Core 5: lectura sale_finance_event + snapshot Core 4; sin recalcular COGS. */
    const TIPS = {
        ingresos:
            "Suma del importe de ventas confirmadas (VERIFIED) en el periodo. Solo sale_finance_event; no incluye UNVERIFIED ni rechazadas.",
        cogs: "Costo de mercadería vendida congelado al confirmar (unitCostSnapshot × qty por línea). No se relee last_unit_cost del producto.",
        margen:
            "Margen bruto = Ingresos − COGS del evento financiero. Histórico estable; no se recalcula al cambiar costos de catálogo.",
        count: "Cantidad de eventos sale_finance_event en el rango (una venta confirmada → un evento).",
        range: "Filtra eventos por antigüedad desde hoy hacia atrás (7, 30 o 90 días).",
        refresh:
            "Recarga el resumen desde sale_finance_event y reconcilia ventas VERIFIED del rango sin evento (idempotente; no recalcula COGS de eventos ya existentes).",
        currency:
            "Desglose por moneda del documento. Los KPI principales priorizan CUP si hay varias monedas.",
        byProduct:
            "Top productos por ingresos de línea desde lines del evento (unitCostSnapshot). Eventos legacy sin lines no aportan filas. No se usa el costo actual del catálogo.",
    } as const;

    let rangeDays = 30;

    async function load(days: number = rangeDays): Promise<void> {
        rangeDays = days;
        try {
            await financeStore.loadSummary(days);
        } catch {
            /* error en store */
        }
    }

    onMount(() => {
        void load(30);
    });

    $: summary = $financeStore.summary;
    $: events = $financeStore.events;
    $: loading = $financeStore.loading;
    $: error = $financeStore.error;
    $: reconciled = $financeStore.reconciled;
    $: storeDays = $financeStore.rangeDays;
    $: if (storeDays && storeDays !== rangeDays && !loading) {
        rangeDays = storeDays;
    }
    $: primary =
        summary.byCurrency.length === 1
            ? summary.byCurrency[0]
            : summary.byCurrency.find((b) => b.currency === "CUP") ??
              summary.byCurrency[0] ??
              null;
    $: marginPct =
        primary && primary.revenue > 0
            ? (primary.margin / primary.revenue) * 100
            : summary.revenue > 0
              ? (summary.margin / summary.revenue) * 100
              : null;
    $: initialLoading = loading && summary.count === 0 && !error;
    $: refreshing = loading && summary.count > 0;

    $: productRows = aggregateByProduct(events) as FinanceProductBucket[];
    $: topProducts = productRows.slice(0, TOP_N);
    $: productNameById = new Map(
        ($productStore.items ?? []).map((p) => [p.id, p.name] as const)
    );

    function labelFor(productId: string): string {
        return productNameById.get(productId) || productId;
    }
</script>

<section class="fp" aria-label="Resumen financiero VERIFIED" aria-busy={loading}>
    <div class="fp-accent" aria-hidden="true"></div>
    <header class="fp-head">
        <div class="fp-head-main">
            <div class="fp-brand">
                <span class="fp-brand-ico">
                    <Icon icon={PiggyBank} size={20} ariaLabel="Finanzas" />
                </span>
                <div class="fp-brand-text">
                    <h2 class="fp-title">Finanzas operativas</h2>
                    <p class="fp-sub">
                        Solo ventas <strong>confirmadas</strong> · lectura
                        <code>sale_finance_event</code> (snapshot al VERIFIED)
                    </p>
                </div>
            </div>
        </div>
        <div class="fp-actions">
            <div class="fp-ranges" role="group" aria-label="Rango de fechas">
                {#each [7, 30, 90] as d}
                    <button
                        type="button"
                        class="fp-range tip-host"
                        class:active={rangeDays === d}
                        on:click={() => load(d)}
                        disabled={loading}
                        aria-label="Últimos {d} días"
                        aria-pressed={rangeDays === d}
                        title={TIPS.range}
                    >
                        {d} días
                        <span class="fp-tip" role="tooltip">{TIPS.range}</span>
                    </button>
                {/each}
            </div>
            <button
                type="button"
                class="fp-refresh tip-host"
                class:spinning={loading}
                on:click={() => load(rangeDays)}
                disabled={loading}
                aria-label="Actualizar y reconciliar faltantes"
                title={TIPS.refresh}
            >
                <Icon icon={RefreshCw} size={16} ariaLabel="" />
                <span class="fp-refresh-label">{loading ? "Cargando…" : "Actualizar"}</span>
                <span class="fp-tip" role="tooltip">{TIPS.refresh}</span>
            </button>
        </div>
    </header>

    {#if reconciled > 0}
        <p class="fp-banner" role="status">
            Se sincronizaron {reconciled} venta(s) confirmada(s) sin evento financiero previo.
        </p>
    {/if}

    {#if initialLoading}
        <div class="fp-loading"><LoadingSpinner size={26} label="Cargando finanzas" /></div>
    {:else if error && summary.count === 0}
        <div class="fp-error-block" role="alert">
            <p class="fp-error">{error}</p>
            <button type="button" class="fp-retry" on:click={() => load(rangeDays)} disabled={loading}>
                Reintentar
            </button>
        </div>
    {:else if summary.count === 0}
        <div class="fp-empty">
            <p>No hay eventos financieros en los últimos {rangeDays} días.</p>
            <p class="fp-empty-hint">
                Confirma ventas desde el panel o el operador; al confirmar se genera el evento de
                ingresos/COGS/margen con costo congelado. Pulsa <strong>Actualizar</strong> para
                reconciliar ventas ya confirmadas sin evento.
            </p>
        </div>
    {:else}
        <div class="fp-body" class:is-refreshing={refreshing}>
            {#if refreshing}
                <div class="fp-refresh-bar" aria-live="polite">
                    <LoadingSpinner size={14} label="Actualizando" subtle />
                    Actualizando resumen…
                </div>
            {/if}
            {#if error}
                <p class="fp-error soft" role="alert">{error}</p>
            {/if}
            <div class="fp-kpis">
                <article class="fp-kpi tip-host" title={TIPS.ingresos}>
                    <div class="fp-ico revenue">
                        <Icon icon={BadgeDollarSign} size={20} ariaLabel="Ingresos" />
                    </div>
                    <div class="fp-kpi-body">
                        <span class="fp-label">
                            Ingresos
                            <span class="fp-help" aria-hidden="true">
                                <Icon icon={CircleHelp} size={12} ariaLabel="" />
                            </span>
                        </span>
                        <span class="fp-value">
                            {money.format(primary ? primary.revenue : summary.revenue)}
                            {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                        </span>
                    </div>
                    <span class="fp-tip" role="tooltip">{TIPS.ingresos}</span>
                </article>

                <article class="fp-kpi tip-host" title={TIPS.cogs}>
                    <div class="fp-ico cogs">
                        <Icon icon={Wallet} size={20} ariaLabel="COGS" />
                    </div>
                    <div class="fp-kpi-body">
                        <span class="fp-label">
                            COGS
                            <span class="fp-help" aria-hidden="true">
                                <Icon icon={CircleHelp} size={12} ariaLabel="" />
                            </span>
                        </span>
                        <span class="fp-value">
                            {money.format(primary ? primary.cogs : summary.cogs)}
                            {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                        </span>
                    </div>
                    <span class="fp-tip" role="tooltip">{TIPS.cogs}</span>
                </article>

                <article class="fp-kpi tip-host" title={TIPS.margen}>
                    <div class="fp-ico margin">
                        <Icon icon={TrendingUp} size={20} ariaLabel="Margen" />
                    </div>
                    <div class="fp-kpi-body">
                        <span class="fp-label">
                            Margen bruto
                            <span class="fp-help" aria-hidden="true">
                                <Icon icon={CircleHelp} size={12} ariaLabel="" />
                            </span>
                        </span>
                        <span class="fp-value">
                            {money.format(primary ? primary.margin : summary.margin)}
                            {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                        </span>
                        {#if marginPct != null}
                            <span class="fp-pct">{marginPct.toFixed(1)}% sobre ingresos</span>
                        {/if}
                    </div>
                    <span class="fp-tip" role="tooltip">{TIPS.margen}</span>
                </article>

                <article class="fp-kpi tip-host" title={TIPS.count}>
                    <div class="fp-ico count">
                        <Icon icon={PiggyBank} size={20} ariaLabel="Eventos" />
                    </div>
                    <div class="fp-kpi-body">
                        <span class="fp-label">
                            Ventas con finance
                            <span class="fp-help" aria-hidden="true">
                                <Icon icon={CircleHelp} size={12} ariaLabel="" />
                            </span>
                        </span>
                        <span class="fp-value">{summary.count}</span>
                        <span class="fp-pct">últimos {rangeDays} días</span>
                    </div>
                    <span class="fp-tip" role="tooltip">{TIPS.count}</span>
                </article>
            </div>

            {#if summary.byCurrency.length > 1}
                <div class="fp-table-wrap tip-host" title={TIPS.currency}>
                    <table class="fp-table">
                        <caption class="fp-caption">
                            Desglose por moneda
                            <span class="fp-help" aria-hidden="true">
                                <Icon icon={CircleHelp} size={12} ariaLabel="" />
                            </span>
                        </caption>
                        <thead>
                            <tr>
                                <th>Moneda</th>
                                <th>Ventas</th>
                                <th>Ingresos</th>
                                <th>COGS</th>
                                <th>Margen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each summary.byCurrency as b}
                                <tr>
                                    <td data-label="Moneda"><strong>{b.currency}</strong></td>
                                    <td data-label="Ventas">{b.count}</td>
                                    <td data-label="Ingresos">{money.format(b.revenue)}</td>
                                    <td data-label="COGS">{money.format(b.cogs)}</td>
                                    <td data-label="Margen">{money.format(b.margin)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                    <span class="fp-tip fp-tip-table" role="tooltip">{TIPS.currency}</span>
                </div>
            {/if}

            <div class="fp-products tip-host" title={TIPS.byProduct}>
                <div class="fp-products-head">
                    <h3 class="fp-products-title">
                        <Icon icon={Package} size={16} ariaLabel="" />
                        Top productos
                        <span class="fp-help" aria-hidden="true">
                            <Icon icon={CircleHelp} size={12} ariaLabel="" />
                        </span>
                    </h3>
                    <span class="fp-products-meta">
                        {#if productRows.length === 0}
                            sin lines en el rango
                        {:else}
                            {Math.min(TOP_N, productRows.length)} de {productRows.length} · por ingresos de línea
                        {/if}
                    </span>
                </div>
                {#if topProducts.length === 0}
                    <p class="fp-products-empty">
                        No hay desglose por producto: los eventos del rango no tienen
                        <code>lines</code> (legacy Core 2) o aún no hay ventas confirmadas con snapshot.
                    </p>
                {:else}
                    <div class="fp-table-wrap">
                        <table class="fp-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cant.</th>
                                    <th>Ventas</th>
                                    <th>Ingresos</th>
                                    <th>COGS</th>
                                    <th>Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each topProducts as row (row.productId)}
                                    <tr>
                                        <td data-label="Producto">
                                            <strong class="fp-prod-name">{labelFor(row.productId)}</strong>
                                            {#if labelFor(row.productId) !== row.productId}
                                                <span class="fp-prod-id">{row.productId}</span>
                                            {/if}
                                        </td>
                                        <td data-label="Cant.">{row.quantity}</td>
                                        <td data-label="Ventas">{row.saleCount}</td>
                                        <td data-label="Ingresos">{money.format(row.lineRevenue)}</td>
                                        <td data-label="COGS">{money.format(row.lineCogs)}</td>
                                        <td data-label="Margen">{money.format(row.lineMargin)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
                <span class="fp-tip fp-tip-table" role="tooltip">{TIPS.byProduct}</span>
            </div>
        </div>
    {/if}
</section>

<style>
    .fp {
        position: relative;
        margin-top: 18px;
        padding: 0;
        border-radius: 18px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--md-sys-color-surface-variant) 18%, var(--md-sys-color-surface)) 0%,
            var(--md-sys-color-surface) 42%
        );
        box-shadow:
            0 1px 2px color-mix(in srgb, black 5%, transparent),
            0 12px 32px color-mix(in srgb, black 6%, transparent);
        overflow: visible;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }
    .fp-accent {
        height: 4px;
        border-radius: 18px 18px 0 0;
        background: linear-gradient(
            90deg,
            var(--md-sys-color-primary),
            color-mix(in srgb, var(--md-sys-color-primary) 40%, #22c55e)
        );
    }
    .fp-head {
        display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px;
        align-items: flex-start; padding: 16px 18px 12px; min-width: 0;
    }
    .fp-head-main { min-width: 0; flex: 1 1 220px; }
    .fp-brand { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
    .fp-brand-text { min-width: 0; }
    .fp-brand-ico {
        width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
        color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
        flex-shrink: 0;
    }
    .fp-title { margin: 0; font-size: 1.08rem; font-weight: 850; letter-spacing: -0.02em; }
    .fp-sub {
        margin: 4px 0 0; font-size: 0.82rem; color: var(--md-sys-color-on-surface-variant);
        line-height: 1.4; max-width: 42rem;
    }
    .fp-sub code { font-size: 0.76rem; word-break: break-all; }
    .fp-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; flex: 0 1 auto; min-width: 0; }
    .fp-ranges {
        display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 3px; border-radius: 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
        border: 1px solid var(--md-sys-color-outline-variant);
    }
    .fp-range {
        position: relative; padding: 7px 12px; border-radius: 9px; border: none;
        background: transparent; color: inherit; font-weight: 700; font-size: 0.8rem;
        cursor: pointer; white-space: nowrap;
    }
    .fp-range.active {
        background: var(--md-sys-color-surface); color: var(--md-sys-color-primary);
        box-shadow: 0 1px 3px color-mix(in srgb, black 8%, transparent);
    }
    .fp-range:disabled, .fp-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    .fp-refresh {
        position: relative; display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-radius: 10px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
        color: inherit; font-weight: 700; font-size: 0.82rem; cursor: pointer; white-space: nowrap;
    }
    .fp-refresh:hover:not(:disabled) {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
    }
    .fp-banner {
        margin: 0 18px 10px; padding: 8px 12px; border-radius: 10px; font-size: 0.84rem; font-weight: 650;
        color: color-mix(in srgb, #0d9488 80%, var(--md-sys-color-on-surface));
        background: color-mix(in srgb, #0d9488 12%, transparent);
        border: 1px solid color-mix(in srgb, #0d9488 22%, transparent);
    }
    .fp-loading, .fp-error {
        margin: 0; padding: 28px 18px; text-align: center; color: var(--md-sys-color-on-surface-variant);
    }
    .fp-error { color: var(--md-sys-color-error); }
    .fp-error.soft {
        margin: 0 18px 8px; padding: 8px 12px; text-align: left; border-radius: 10px;
        background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 22%, transparent);
        font-size: 0.84rem;
    }
    .fp-error-block {
        display: grid; gap: 12px; justify-items: center; padding: 28px 18px;
    }
    .fp-retry {
        padding: 8px 16px; border-radius: 10px; border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface); font-weight: 700; cursor: pointer;
    }
    .fp-empty { padding: 24px 18px 28px; text-align: center; color: var(--md-sys-color-on-surface-variant); }
    .fp-empty p { margin: 0; }
    .fp-empty-hint {
        margin-top: 8px !important; font-size: 0.86rem; max-width: 36rem;
        margin-left: auto; margin-right: auto; line-height: 1.45;
    }
    .fp-body { position: relative; }
    .fp-body.is-refreshing { opacity: 0.92; }
    .fp-refresh-bar {
        display: flex; align-items: center; gap: 8px; margin: 0 18px 8px;
        font-size: 0.78rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant);
    }
    .fp-kpis {
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px; padding: 4px 18px 18px; min-width: 0;
    }
    .fp-kpi {
        position: relative; display: flex; gap: 12px; align-items: center; padding: 14px;
        border-radius: 14px; border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow: 0 4px 12px color-mix(in srgb, black 4%, transparent);
        transition: border-color 140ms ease, box-shadow 140ms ease;
        min-width: 0; outline: none;
    }
    .fp-kpi:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--md-sys-color-outline-variant));
        box-shadow: 0 6px 16px color-mix(in srgb, black 6%, transparent);
    }
    .fp-ico {
        width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
        flex-shrink: 0; border: 1px solid transparent;
    }
    .fp-ico.revenue { background: color-mix(in srgb, #16a34a 14%, transparent); border-color: color-mix(in srgb, #16a34a 22%, transparent); color: #16a34a; }
    .fp-ico.cogs { background: color-mix(in srgb, #d97706 14%, transparent); border-color: color-mix(in srgb, #d97706 22%, transparent); color: #d97706; }
    .fp-ico.margin { background: color-mix(in srgb, #2563eb 14%, transparent); border-color: color-mix(in srgb, #2563eb 22%, transparent); color: #2563eb; }
    .fp-ico.count { background: color-mix(in srgb, #7c3aed 14%, transparent); border-color: color-mix(in srgb, #7c3aed 22%, transparent); color: #7c3aed; }
    .fp-kpi-body { min-width: 0; display: grid; gap: 2px; }
    .fp-label {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .fp-help { display: inline-flex; opacity: 0.55; flex-shrink: 0; }
    .fp-value {
        font-size: clamp(1rem, 2.5vw, 1.2rem); font-weight: 850;
        font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .fp-cur { font-size: 0.72rem; font-weight: 750; margin-left: 4px; opacity: 0.75; }
    .fp-pct {
        font-size: 0.72rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant);
    }
    .fp-products {
        position: relative;
        margin: 0 18px 18px;
        padding: 12px 0 0;
        border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    }
    .fp-products-head {
        display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
        gap: 8px; padding: 0 0 10px;
    }
    .fp-products-title {
        margin: 0; display: inline-flex; align-items: center; gap: 8px;
        font-size: 0.92rem; font-weight: 800;
    }
    .fp-products-meta {
        font-size: 0.75rem; font-weight: 650; color: var(--md-sys-color-on-surface-variant);
    }
    .fp-products-empty {
        margin: 0; padding: 12px 14px; border-radius: 12px; font-size: 0.86rem; line-height: 1.45;
        color: var(--md-sys-color-on-surface-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 28%, transparent);
        border: 1px dashed var(--md-sys-color-outline-variant);
    }
    .fp-products-empty code { font-size: 0.8rem; }
    .fp-prod-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 16rem; }
    .fp-prod-id {
        display: block; font-size: 0.68rem; font-weight: 600; opacity: 0.65;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 16rem;
    }
    .tip-host { position: relative; }
    .fp-tip {
        position: absolute; z-index: 40; left: 50%; bottom: calc(100% + 10px);
        transform: translateX(-50%) translateY(4px);
        width: max-content; max-width: min(280px, calc(100vw - 32px));
        padding: 10px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 600;
        line-height: 1.4; text-align: left; text-transform: none; letter-spacing: 0;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 94%, black);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 12px 28px color-mix(in srgb, black 18%, transparent);
        opacity: 0; visibility: hidden; pointer-events: none;
        transition: opacity 0.15s ease, transform 0.15s ease, visibility 0s linear 0.15s;
    }
    .fp-tip::after {
        content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: color-mix(in srgb, var(--md-sys-color-surface-container-highest) 94%, black);
    }
    .tip-host:hover > .fp-tip {
        opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); transition-delay: 0s;
    }
    .fp-tip-table {
        left: 12px; right: 12px; width: auto; max-width: none;
        transform: translateX(0) translateY(4px);
    }
    .tip-host:hover > .fp-tip-table { transform: translateX(0) translateY(0); }
    .fp-table-wrap {
        position: relative; overflow: auto; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        -webkit-overflow-scrolling: touch; outline: none;
    }
    .fp-table-wrap + .fp-table-wrap,
    .fp-kpis + .fp-table-wrap { margin: 0 18px 18px; }
    .fp-caption {
        caption-side: top; text-align: left; padding: 10px 12px 0;
        font-size: 0.78rem; font-weight: 750; color: var(--md-sys-color-on-surface-variant);
        display: flex; align-items: center; gap: 6px;
    }
    .fp-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 0; }
    .fp-table th {
        text-align: left; padding: 10px 12px; font-size: 0.72rem; text-transform: uppercase;
        letter-spacing: 0.04em; color: var(--md-sys-color-on-surface-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        border-bottom: 1px solid var(--md-sys-color-outline-variant); white-space: nowrap;
    }
    .fp-table td {
        padding: 10px 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
        font-variant-numeric: tabular-nums;
    }
    .fp-table tr:last-child td { border-bottom: none; }
    @media (max-width: 1100px) { .fp-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 768px) {
        .fp-head { flex-direction: column; align-items: stretch; padding: 14px 14px 10px; }
        .fp-actions { width: 100%; justify-content: space-between; }
        .fp-kpis { padding: 4px 14px 14px; gap: 10px; }
        .fp-kpis + .fp-table-wrap { margin: 0 14px 14px; }
        .fp-products { margin: 0 14px 14px; }
        .fp-banner { margin: 0 14px 10px; }
        .fp-value { font-size: 1.1rem; }
    }
    @media (max-width: 560px) {
        .fp-kpis { grid-template-columns: 1fr; }
        .fp-brand-ico { width: 40px; height: 40px; }
        .fp-title { font-size: 1rem; }
        .fp-sub { font-size: 0.78rem; }
        .fp-actions { flex-direction: column; align-items: stretch; }
        .fp-ranges { width: 100%; }
        .fp-range { flex: 1 1 0; text-align: center; }
        .fp-refresh { width: 100%; justify-content: center; }
        .fp-tip {
            left: 8px; right: 8px; width: auto; max-width: none;
            transform: translateX(0) translateY(4px);
        }
        .tip-host:hover > .fp-tip { transform: translateX(0) translateY(0); }
        .fp-tip::after { left: 24px; transform: none; }
    }
    @media (max-width: 420px) {
        .fp-table thead { display: none; }
        .fp-table tr {
            display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; padding: 12px;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
        }
        .fp-table tr:last-child { border-bottom: none; }
        .fp-table td {
            display: flex; flex-direction: column; gap: 2px; padding: 0; border: none; font-size: 0.88rem;
        }
        .fp-table td::before {
            content: attr(data-label); font-size: 0.68rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.03em;
            color: var(--md-sys-color-on-surface-variant);
        }
        .fp-table td:first-child { grid-column: 1 / -1; }
    }
    @media (prefers-reduced-motion: reduce) {
        .fp-kpi, .fp-tip { transition: none; }
    }
</style>
