<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../components/Icon.svelte";
    import InfraStatusPanel from "../components/InfraStatusPanel.svelte";
    import { categoryStore } from "../../../feature/category/presentation/viewmodel/category.store";
    import { productStore } from "../../../feature/product/presentation/viewmodel/product.store";
    import { promotionStore } from "../../../feature/notification/presentation/viewmodel/promotion.store";
    import { isPromotionActive } from "../../../feature/notification/domain/entity/Promotion";
    import { BuyState } from "../../../feature/sale/domain/entity/enums";
    import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store";
    import { toastStore } from "../viewmodel/toast.store";
    import { logger } from "../util/logger.service";
    import {
        BarChart3,
        BadgeDollarSign,
        Boxes,
        CalendarDays,
        CircleAlert,
        CircleOff,
        CircleSlash,
        Clock,
        FolderKanban,
        Package,
        Percent,
        ShieldCheck,
        ShoppingCart,
        Tags,
        TrendingUp
    } from "lucide-svelte";

    const money = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    function toDayKey(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function toLabel(date: Date): string {
        return date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    }

    function safeDate(input: string): Date | null {
        const date = new Date(input);
        return Number.isFinite(date.getTime()) ? date : null;
    }

    function sum<T>(list: T[], fn: (item: T) => number): number {
        return list.reduce((acc, item) => acc + fn(item), 0);
    }

    onMount(() => {
        toastStore.info("Actualizando metricas...", 1600);
        Promise.all([
            productStore.syncAll(),
            categoryStore.syncAll(),
            promotionStore.syncAll(),
            saleStore.syncAll()
        ]).catch((error) => {
            logger.error(error?.message ?? error, error?.stack);
            toastStore.error("No se pudieron cargar algunas metricas.");
        });
    });

    $: products = $productStore.items;
    $: categories = $categoryStore.items;
    $: promotions = $promotionStore.items;
    $: sales = $saleStore.items;

    $: now = new Date();
    $: last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    $: sales30 = sales.filter((sale) => {
        const date = safeDate(sale.date);
        return date ? date >= last30 && date <= now : false;
    });

    $: totalRevenue30 = sum(sales30, (sale) => sale.amount);
    $: totalOrders30 = sales30.length;
    $: avgTicket30 = totalOrders30 ? totalRevenue30 / totalOrders30 : 0;
    $: verified30 = sales30.filter((sale) => sale.verified === BuyState.VERIFIED).length;
    $: pending30 = sales30.filter((sale) => sale.verified === BuyState.UNVERIFIED).length;
    $: rejected30 = sales30.filter((sale) => sale.verified === BuyState.DELETED).length;
    $: verifiedRevenue30 = sum(
        sales30.filter((sale) => sale.verified === BuyState.VERIFIED),
        (sale) => sale.amount
    );
    $: pendingRevenue30 = sum(
        sales30.filter((sale) => sale.verified === BuyState.UNVERIFIED),
        (sale) => sale.amount
    );
    $: activeProducts = products.filter((product) => product.status === "active").length;
    $: inactiveProducts = Math.max(0, products.length - activeProducts);
    $: activeCategories = categories.filter((category) => category.status === "active").length;
    $: inactiveCategories = Math.max(0, categories.length - activeCategories);
    $: activePromotions = promotions.filter((promotion) => isPromotionActive(promotion, now.getTime())).length;
    $: expiredPromotions = Math.max(0, promotions.length - activePromotions);

    $: dailySeries = (() => {
        const days = 14;
        const map = new Map<string, number>();
        for (let index = days - 1; index >= 0; index--) {
            const date = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
            map.set(toDayKey(date), 0);
        }

        for (const sale of sales30) {
            const date = safeDate(sale.date);
            if (!date) continue;
            const key = toDayKey(date);
            if (!map.has(key)) continue;
            map.set(key, (map.get(key) ?? 0) + sale.amount);
        }

        return Array.from(map.entries()).map(([key, total]) => ({
            day: toLabel(new Date(key)),
            total
        }));
    })();

    $: topProducts = (() => {
        const acc = new Map<string, { revenue: number; units: number }>();
        for (const sale of sales30) {
            for (const item of sale.products ?? []) {
                const current = acc.get(item.productId) ?? { revenue: 0, units: 0 };
                current.revenue += item.quantity * item.price;
                current.units += item.quantity;
                acc.set(item.productId, current);
            }
        }

        return Array.from(acc.entries())
            .map(([id, value]) => {
                const product = products.find((item) => item.id === id);
                return {
                    id,
                    name: product?.name ?? `Producto ${id.slice(0, 8)}`,
                    photoUrl: product?.photoUrl ?? "",
                    revenue: value.revenue,
                    units: value.units
                };
            })
            .sort((left, right) => right.revenue - left.revenue)
            .slice(0, 5);
    })();

    $: productsByCategory = (() => {
        const map = new Map<string, number>();
        for (const product of products) {
            map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + 1);
        }

        return Array.from(map.entries())
            .map(([categoryId, count]) => ({
                categoryId,
                name: categories.find((category) => category.id === categoryId)?.name ?? categoryId,
                count
            }))
            .sort((left, right) => right.count - left.count)
            .slice(0, 6);
    })();

    $: maxDaily = Math.max(1, ...dailySeries.map((point) => point.total));
</script>

<section class="mgmt-page" aria-label="Principal">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Principal</h1>
                <p class="mgmt-subtitle">Lectura ejecutiva del negocio con foco en catalogo, ventas y supervision.</p>
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
                <div class="kpi-label">Ingresos confirmados (30 dias)</div>
                <div class="kpi-value">${money.format(verifiedRevenue30)}</div>
                <div class="kpi-note">Pendiente por validar: ${money.format(pendingRevenue30)}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={ShoppingCart} size={18} ariaLabel="Ordenes" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Ordenes (30 dias)</div>
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
                <Icon icon={ShieldCheck} size={18} ariaLabel="Estados" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Confirmadas / Pendientes / Rechazadas</div>
                <div class="kpi-value">{verified30} / {pending30} / {rejected30}</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Package} size={18} ariaLabel="Productos" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Productos activos</div>
                <div class="kpi-value">{activeProducts}</div>
                <div class="kpi-note">{inactiveProducts} inactivos</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Tags} size={18} ariaLabel="Categorias" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Categorias activas</div>
                <div class="kpi-value">{activeCategories}</div>
                <div class="kpi-note">{inactiveCategories} inactivas</div>
            </div>
        </article>

        <article class="mgmt-card kpi">
            <div class="kpi-ico">
                <Icon icon={Percent} size={18} ariaLabel="Promociones" />
            </div>
            <div class="kpi-main">
                <div class="kpi-label">Promociones vigentes</div>
                <div class="kpi-value">{activePromotions}</div>
                <div class="kpi-note">{expiredPromotions} expiradas</div>
            </div>
        </article>
    </section>

    <section class="dash-grid" aria-label="Analitica">
        <section class="mgmt-card chart-card" aria-label="Ventas por dia">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Ventas de los ultimos 14 dias</h2>
                <span class="mgmt-chip">
                    <Icon icon={CalendarDays} size={18} ariaLabel="Rango" />
                    14 dias
                </span>
            </div>

            <div class="chart">
                <svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Grafica de barras">
                    {#each dailySeries as point, index (point.day)}
                        {@const barWidth = 700 / dailySeries.length}
                        {@const x = index * barWidth}
                        {@const height = Math.round((point.total / maxDaily) * 150)}
                        {@const y = 170 - height}
                        <rect
                            x={x + barWidth * 0.18}
                            y={y}
                            width={barWidth * 0.64}
                            height={height}
                            rx="10"
                            fill="color-mix(in srgb, var(--md-sys-color-primary) 72%, transparent)"
                        />
                    {/each}
                    <line
                        x1="0"
                        y1="170"
                        x2="700"
                        y2="170"
                        stroke="color-mix(in srgb, var(--md-sys-color-outline) 25%, transparent)"
                    />
                </svg>
            </div>

            <div class="chart-foot">
                {#each dailySeries as point (point.day)}
                    <div class="tick" title={`$${money.format(point.total)}`}>
                        <span>{point.day}</span>
                    </div>
                {/each}
            </div>
        </section>

        <section class="mgmt-card" aria-label="Top productos">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Top productos (30 dias)</h2>
                <span class="mgmt-chip">
                    <Icon icon={Boxes} size={18} ariaLabel="Top" />
                    Top 5
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                {#if topProducts.length === 0}
                    <div class="mgmt-muted">Aun no hay suficientes ventas para mostrar un ranking.</div>
                {/if}
                {#each topProducts as product (product.id)}
                    <article class="mgmt-row">
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            {#if product.photoUrl}
                                <img class="mgmt-avatar" src={product.photoUrl} alt="" aria-hidden="true" />
                            {:else}
                                <div class="mgmt-avatar" aria-hidden="true"></div>
                            {/if}
                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">{product.name}</div>
                                <p class="mgmt-row-sub">{product.units} uds · ${money.format(product.revenue)}</p>
                            </div>
                        </div>
                    </article>
                {/each}
            </div>
        </section>

        <section class="mgmt-card" aria-label="Situacion operativa">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Situacion operativa</h2>
                <span class="mgmt-chip">
                    <Icon icon={FolderKanban} size={18} ariaLabel="Supervision" />
                    Supervision
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Pedidos pendientes de validacion</div>
                        <p class="mgmt-row-sub">Cola actual que debe resolverse desde Android operador.</p>
                    </div>
                    <div class="status-badge pending">
                        <Icon icon={CircleAlert} size={16} ariaLabel="Pendientes" />
                        {pending30}
                    </div>
                </article>

                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Pedidos confirmados</div>
                        <p class="mgmt-row-sub">Operaciones validadas en el periodo actual.</p>
                    </div>
                    <div class="status-badge verified">
                        <Icon icon={ShieldCheck} size={16} ariaLabel="Confirmados" />
                        {verified30}
                    </div>
                </article>

                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Pedidos rechazados</div>
                        <p class="mgmt-row-sub">Casos cerrados sin validacion operativa.</p>
                    </div>
                    <div class="status-badge rejected">
                        <Icon icon={CircleSlash} size={16} ariaLabel="Rechazados" />
                        {rejected30}
                    </div>
                </article>
            </div>
        </section>

        <section class="mgmt-card" aria-label="Distribucion por categoria">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Productos por categoria</h2>
                <span class="mgmt-chip">
                    <Icon icon={BarChart3} size={18} ariaLabel="Distribucion" />
                    Top {productsByCategory.length}
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                {#if productsByCategory.length === 0}
                    <div class="mgmt-muted">Aun no hay productos cargados.</div>
                {/if}
                {#each productsByCategory as category (category.categoryId)}
                    <article class="mgmt-row">
                        <div class="mgmt-row-main">
                            <div class="mgmt-row-title">{category.name}</div>
                            <p class="mgmt-row-sub">{category.count} productos</p>
                        </div>
                        <div class="bar">
                            <span style={`--w:${Math.min(100, (category.count / Math.max(1, productsByCategory[0]?.count ?? 1)) * 100)}%`}></span>
                        </div>
                    </article>
                {/each}
            </div>
        </section>

        <section class="mgmt-card" aria-label="Estado del catalogo">
            <div class="chart-head">
                <h2 class="mgmt-card-title" style="margin:0">Estado del catalogo</h2>
                <span class="mgmt-chip">
                    <Icon icon={Boxes} size={18} ariaLabel="Catalogo" />
                    Gobierno
                </span>
            </div>

            <div class="mgmt-list" style="margin-top:12px">
                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Productos</div>
                        <p class="mgmt-row-sub">{products.length} registrados en total.</p>
                    </div>
                    <div class="status-badge neutral">
                        <Icon icon={Package} size={16} ariaLabel="Productos" />
                        {activeProducts} activos
                    </div>
                </article>

                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Categorias</div>
                        <p class="mgmt-row-sub">{categories.length} familias disponibles.</p>
                    </div>
                    <div class="status-badge neutral">
                        <Icon icon={Tags} size={16} ariaLabel="Categorias" />
                        {activeCategories} activas
                    </div>
                </article>

                <article class="mgmt-row">
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">Promociones</div>
                        <p class="mgmt-row-sub">{promotions.length} promociones entre vigentes e historicas.</p>
                    </div>
                    <div class="status-badge muted">
                        <Icon icon={CircleOff} size={16} ariaLabel="Promociones" />
                        {activePromotions} vigentes
                    </div>
                </article>
            </div>
        </section>
    </section>

    <InfraStatusPanel />
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

    .kpi-note {
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 66%, transparent);
        font-size: 0.82rem;
        font-weight: 700;
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

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 7px 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        font-weight: 900;
        white-space: nowrap;
    }

    .status-badge.pending {
        border-color: color-mix(in srgb, #a855f7 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #a855f7 12%, transparent);
    }

    .status-badge.verified {
        border-color: color-mix(in srgb, #22c55e 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 12%, transparent);
    }

    .status-badge.rejected {
        border-color: color-mix(in srgb, #ef4444 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 12%, transparent);
    }

    .status-badge.neutral,
    .status-badge.muted {
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 36%, transparent);
    }
</style>
