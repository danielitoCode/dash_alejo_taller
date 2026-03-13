<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../components/Icon.svelte";
    import { categoryStore } from "../../../feature/category/presentation/viewmodel/category.store";
    import { productStore } from "../../../feature/product/presentation/viewmodel/product.store";
    import { promotionStore } from "../../../feature/notification/presentation/viewmodel/promotion.store";
    import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store";
    import { toastStore } from "../viewmodel/toast.store";
    import { logger } from "../util/logger.service";
    import {
        BarChart3,
        BadgeDollarSign,
        Boxes,
        CalendarDays,
        Clock,
        Package,
        Percent,
        ShieldCheck,
        ShoppingCart,
        Tags,
        TrendingUp
    } from "lucide-svelte";

    type DailyPoint = { day: string; total: number };

    const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function toDayKey(d: Date): string {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function toLabel(d: Date): string {
        return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    }

    function safeDate(input: string): Date | null {
        const d = new Date(input);
        return Number.isFinite(d.getTime()) ? d : null;
    }

    function sum<T>(list: T[], fn: (x: T) => number): number {
        return list.reduce((acc, it) => acc + fn(it), 0);
    }

    onMount(() => {
        toastStore.info("Actualizando métricas…", 1600);
        Promise.all([
            productStore.syncAll(),
            categoryStore.syncAll(),
            promotionStore.syncAll(),
            saleStore.syncAll()
        ]).catch((e) => {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error("No se pudieron cargar algunas métricas.");
        });
    });

    $: products = $productStore.items;
    $: categories = $categoryStore.items;
    $: promos = $promotionStore.items;
    $: sales = $saleStore.items;

    $: now = new Date();
    $: last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    $: sales30 = sales.filter((s) => {
        const d = safeDate(s.date);
        return d ? d >= last30 && d <= now : false;
    });

    $: totalRevenue30 = sum(sales30, (s) => s.amount);
    $: totalOrders30 = sales30.length;
    $: avgTicket30 = totalOrders30 ? totalRevenue30 / totalOrders30 : 0;

    // verified is a string enum in the DTO; in domain it's BuyState (string-like)
    $: verified30 = sales30.filter((s: any) => String(s.verified).toLowerCase().includes("verified")).length;
    $: pending30 = Math.max(0, totalOrders30 - verified30);

    $: dailySeries = (() => {
        const days = 14;
        const map = new Map<string, number>();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            map.set(toDayKey(d), 0);
        }

        for (const sale of sales) {
            const d = safeDate(sale.date);
            if (!d) continue;
            const key = toDayKey(d);
            if (!map.has(key)) continue;
            map.set(key, (map.get(key) || 0) + sale.amount);
        }

        return Array.from(map.entries()).map(([key, total]) => {
            const d = safeDate(key) || new Date(key);
            return { day: toLabel(d), total };
        });
    })();

    $: topProducts = (() => {
        const acc = new Map<string, { revenue: number; units: number }>();
        for (const sale of sales30) {
            for (const it of sale.products ?? []) {
                const cur = acc.get(it.productId) ?? { revenue: 0, units: 0 };
                cur.revenue += it.quantity * it.price;
                cur.units += it.quantity;
                acc.set(it.productId, cur);
            }
        }

        const list = Array.from(acc.entries())
            .map(([id, v]) => {
                const p = products.find((x) => x.id === id);
                return {
                    id,
                    name: p?.name ?? `Producto ${id.slice(0, 8)}`,
                    photoUrl: p?.photoUrl ?? "",
                    revenue: v.revenue,
                    units: v.units
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return list;
    })();

    $: productsByCategory = (() => {
        const map = new Map<string, number>();
        for (const p of products) map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
        return Array.from(map.entries())
            .map(([categoryId, count]) => ({
                categoryId,
                name: categories.find((c) => c.id === categoryId)?.name ?? categoryId,
                count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    })();

    $: maxDaily = Math.max(1, ...dailySeries.map((p) => p.total));
</script>

<section class="mgmt-page" aria-label="Principal">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Principal</h1>
                <p class="mgmt-subtitle">Métricas rápidas y analítica del negocio basada en los datos del sistema.</p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Clock} size={18} ariaLabel="Actualizado" />
                    {now.toLocaleString()}
                </span>
            </div>
        </div>
    </header>

    <section class="kpi-grid" aria-label="Indicadores">
        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={BadgeDollarSign} size={18} ariaLabel="Ingresos" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Ingresos (30 días)</div>
                <div class="kpi-value">${money.format(totalRevenue30)}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={ShoppingCart} size={18} ariaLabel="Órdenes" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Órdenes (30 días)</div>
                <div class="kpi-value">{totalOrders30}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={TrendingUp} size={18} ariaLabel="Ticket promedio" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Ticket promedio</div>
                <div class="kpi-value">${money.format(avgTicket30)}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={ShieldCheck} size={18} ariaLabel="Verificadas" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Verificadas / Pendientes</div>
                <div class="kpi-value">{verified30} / {pending30}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Package} size={18} ariaLabel="Productos" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Productos</div>
                <div class="kpi-value">{products.length}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Tags} size={18} ariaLabel="Categorías" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Categorías</div>
                <div class="kpi-value">{categories.length}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Percent} size={18} ariaLabel="Promos" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Promociones</div>
                <div class="kpi-value">{promos.length}</div>
            </div>
        </article>
    </section>

    <section class="dash-grid" aria-label="Analítica">
        <section class="mgmt-card chart-card" aria-label="Ventas por día">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Ventas · últimos 14 días</h2>
                <span class="mgmt-chip">
                    <Icon icon={CalendarDays} size={18} ariaLabel="Rango" />
                    14 días
                </span>
            </div>

            <div class="chart">
                <svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Gráfica de barras">
                    {#each dailySeries as p, idx (p.day)}
                        {@const barW = 700 / dailySeries.length}
                        {@const x = idx * barW}
                        {@const h = Math.round((p.total / maxDaily) * 150)}
                        {@const y = 170 - h}
                        <rect
                            x={x + barW * 0.18}
                            y={y}
                            width={barW * 0.64}
                            height={h}
                            rx="10"
                            fill="color-mix(in srgb, var(--md-sys-color-primary) 72%, transparent)"
                        />
                    {/each}
                    <line x1="0" y1="170" x2="700" y2="170" stroke="color-mix(in srgb, var(--md-sys-color-outline) 25%, transparent)" />
                </svg>
            </div>

            <div class="chart-foot">
                {#each dailySeries as p (p.day)}
                    <div class="tick" title={`$${money.format(p.total)}`}>
                        <span>{p.day}</span>
                    </div>
                {/each}
            </div>
        </section>

        <section class="mgmt-card" aria-label="Top productos">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Top productos (30 días)</h2>
                <span class="mgmt-chip">
                    <Icon icon={Boxes} size={18} ariaLabel="Top" />
                    Top 5
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                {#if topProducts.length === 0}
                    <div class="mgmt-muted">Aún no hay suficientes ventas para mostrar un ranking.</div>
                {/if}
                {#each topProducts as p (p.id)}
                    <article class="mgmt-row">
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            {#if p.photoUrl}
                                <img class="mgmt-avatar" src={p.photoUrl} alt="" aria-hidden="true" />
                            {:else}
                                <div class="mgmt-avatar" aria-hidden="true"></div>
                            {/if}
                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">{p.name}</div>
                                <p class="mgmt-row-sub">{p.units} uds · ${money.format(p.revenue)}</p>
                            </div>
                        </div>
                    </article>
                {/each}
            </div>
        </section>

        <section class="mgmt-card" aria-label="Distribución por categoría">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Productos por categoría</h2>
                <span class="mgmt-chip">
                    <Icon icon={BarChart3} size={18} ariaLabel="Distribución" />
                    Top {productsByCategory.length}
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                {#if productsByCategory.length === 0}
                    <div class="mgmt-muted">Aún no hay productos cargados.</div>
                {/if}
                {#each productsByCategory as c (c.categoryId)}
                    <article class="mgmt-row">
                        <div class="mgmt-row-main">
                            <div class="mgmt-row-title">{c.name}</div>
                            <p class="mgmt-row-sub">{c.count} productos</p>
                        </div>
                        <div class="bar">
                            <span style={`--w:${Math.min(100, (c.count / Math.max(1, productsByCategory[0]?.count ?? 1)) * 100)}%`}></span>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    </section>
</section>

<style>
    .kpi-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .kpi {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
    }

    .kpi-ico {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-primary-container) 60%, transparent);
        color: var(--md-sys-color-on-primary-container);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
        flex: 0 0 auto;
    }

    .kpi-main {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .kpi-label {
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 70%, transparent);
        font-weight: 700;
        font-size: 0.92rem;
    }

    .kpi-value {
        font-weight: 900;
        letter-spacing: -0.02em;
        font-size: 1.35rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dash-grid {
        display: grid;
        gap: 14px;
        margin-top: 14px;
    }

    @media (min-width: 980px) {
        .dash-grid {
            grid-template-columns: 1.35fr 1fr;
            align-items: start;
        }
    }

    .chart-card {
        grid-column: 1 / -1;
    }

    .chart-head {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .chart {
        margin-top: 12px;
        width: 100%;
        height: 190px;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 86%, transparent);
        overflow: hidden;
        padding: 10px;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-outline) 8%, transparent);
    }

    .chart svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    .chart-foot {
        margin-top: 8px;
        display: grid;
        grid-template-columns: repeat(14, 1fr);
        gap: 6px;
        font-size: 0.72rem;
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 68%, transparent);
        user-select: none;
    }

    .tick {
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .bar {
        width: min(220px, 100%);
        height: 10px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
        overflow: hidden;
        align-self: center;
    }

    .bar > span {
        display: block;
        height: 100%;
        width: var(--w);
        background: color-mix(in srgb, var(--md-sys-color-primary) 68%, transparent);
        border-radius: 999px;
    }
</style>

