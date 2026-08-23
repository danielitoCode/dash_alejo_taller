<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import { financeStore } from "../viewmodel/finance.store";
    import { BadgeDollarSign, PiggyBank, TrendingUp, Wallet } from "lucide-svelte";

    const money = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    let rangeDays = 30;

    async function load(days: number = rangeDays): Promise<void> {
        rangeDays = days;
        try {
            await financeStore.loadSummary(days);
        } catch {
            /* silent; error en store */
        }
    }

    onMount(() => {
        void load(30);
    });

    $: summary = $financeStore.summary;
    $: loading = $financeStore.loading;
    $: error = $financeStore.error;
    $: primary =
        summary.byCurrency.length === 1
            ? summary.byCurrency[0]
            : summary.byCurrency.find((b) => b.currency === "CUP") ??
              summary.byCurrency[0] ??
              null;
</script>

<section class="finance-panel" aria-label="Resumen financiero VERIFIED">
    <header class="fp-head">
        <div>
            <h2 class="fp-title">Finanzas (solo confirmadas)</h2>
            <p class="fp-sub">
                Ingresos, COGS y margen desde <code>sale_finance_event</code> — no incluye pendientes.
            </p>
        </div>
        <div class="fp-ranges" role="group" aria-label="Rango de fechas">
            {#each [7, 30, 90] as d}
                <button
                    type="button"
                    class="fp-range"
                    class:active={rangeDays === d}
                    on:click={() => load(d)}
                    disabled={loading}
                >
                    {d}d
                </button>
            {/each}
        </div>
    </header>

    {#if loading && summary.count === 0}
        <div class="fp-loading"><LoadingSpinner size={24} label="Cargando finanzas" /></div>
    {:else if error}
        <p class="fp-error">{error}</p>
    {:else if summary.count === 0}
        <p class="fp-empty">No hay eventos financieros en los últimos {rangeDays} días.</p>
    {:else}
        <div class="fp-kpis">
            <article class="fp-kpi">
                <div class="fp-ico revenue"><Icon icon={BadgeDollarSign} size={18} ariaLabel="Ingresos" /></div>
                <div>
                    <div class="fp-label">Ingresos</div>
                    <div class="fp-value">
                        {money.format(primary ? primary.revenue : summary.revenue)}
                        {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                    </div>
                </div>
            </article>
            <article class="fp-kpi">
                <div class="fp-ico cogs"><Icon icon={Wallet} size={18} ariaLabel="COGS" /></div>
                <div>
                    <div class="fp-label">COGS</div>
                    <div class="fp-value">
                        {money.format(primary ? primary.cogs : summary.cogs)}
                        {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                    </div>
                </div>
            </article>
            <article class="fp-kpi">
                <div class="fp-ico margin"><Icon icon={TrendingUp} size={18} ariaLabel="Margen" /></div>
                <div>
                    <div class="fp-label">Margen</div>
                    <div class="fp-value">
                        {money.format(primary ? primary.margin : summary.margin)}
                        {#if primary}<span class="fp-cur">{primary.currency}</span>{/if}
                    </div>
                </div>
            </article>
            <article class="fp-kpi">
                <div class="fp-ico count"><Icon icon={PiggyBank} size={18} ariaLabel="Eventos" /></div>
                <div>
                    <div class="fp-label">Ventas confirmadas</div>
                    <div class="fp-value">{summary.count}</div>
                </div>
            </article>
        </div>

        {#if summary.byCurrency.length > 1}
            <div class="fp-by-cur" aria-label="Desglose por moneda">
                {#each summary.byCurrency as b}
                    <div class="fp-cur-row">
                        <strong>{b.currency}</strong>
                        <span>{b.count} venta(s)</span>
                        <span>Ing. {money.format(b.revenue)}</span>
                        <span>COGS {money.format(b.cogs)}</span>
                        <span>Margen {money.format(b.margin)}</span>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</section>

<style>
    .finance-panel {
        margin-top: 16px;
        padding: 16px 18px;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 12%, var(--md-sys-color-surface));
        box-shadow: 0 8px 24px color-mix(in srgb, black 5%, transparent);
    }
    .fp-head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 14px;
    }
    .fp-title { margin: 0; font-size: 1.05rem; font-weight: 800; }
    .fp-sub {
        margin: 4px 0 0;
        font-size: 0.84rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .fp-sub code { font-size: 0.78rem; }
    .fp-ranges { display: inline-flex; gap: 6px; }
    .fp-range {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        font-weight: 700;
        font-size: 0.82rem;
        cursor: pointer;
    }
    .fp-range.active {
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant));
        color: var(--md-sys-color-primary);
    }
    .fp-loading, .fp-empty, .fp-error {
        margin: 0;
        padding: 16px 0;
        text-align: center;
        color: var(--md-sys-color-on-surface-variant);
    }
    .fp-error { color: var(--md-sys-color-error); }
    .fp-kpis {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
    }
    .fp-kpi {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
    }
    .fp-ico {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
    }
    .fp-ico.revenue { background: color-mix(in srgb, #16a34a 16%, transparent); color: #16a34a; }
    .fp-ico.cogs { background: color-mix(in srgb, #d97706 16%, transparent); color: #d97706; }
    .fp-ico.margin { background: color-mix(in srgb, #2563eb 16%, transparent); color: #2563eb; }
    .fp-ico.count { background: color-mix(in srgb, #7c3aed 16%, transparent); color: #7c3aed; }
    .fp-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .fp-value {
        font-size: 1.15rem;
        font-weight: 850;
        font-variant-numeric: tabular-nums;
        margin-top: 2px;
    }
    .fp-cur {
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 4px;
        opacity: 0.8;
    }
    .fp-by-cur { margin-top: 12px; display: grid; gap: 8px; }
    .fp-cur-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 16px;
        font-size: 0.86rem;
        padding: 8px 12px;
        border-radius: 10px;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 25%, transparent);
    }
    @media (max-width: 960px) {
        .fp-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
        .fp-kpis { grid-template-columns: 1fr; }
    }
</style>
