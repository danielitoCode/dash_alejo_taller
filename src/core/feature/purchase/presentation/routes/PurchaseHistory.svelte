<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { supplierStore } from "../viewmodel/supplier.store";
    import { purchaseHistoryStore } from "../viewmodel/purchase-history.store";
    import { filterPurchaseEntries } from "../../domain/util/filterPurchaseEntries";
    import {
        ChevronLeft,
        FileText,
        Package,
        Search,
        Truck,
        User,
    } from "lucide-svelte";

    let query = "";
    let supplierFilter = "";
    let userFilter = "";
    let dateFrom = "";
    let dateTo = "";
    let selectedId: string | null = null;

    onMount(() => {
        void supplierStore.syncAll().catch(() => {});
        void productStore.syncAll().catch(() => {});
        void purchaseHistoryStore.syncList().catch((e) => {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error("No se pudo cargar el historial de entradas.");
        });
    });

    async function openDetail(id: string) {
        selectedId = id;
        try {
            await purchaseHistoryStore.loadDetail(id);
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo abrir el detalle.");
            selectedId = null;
        }
    }

    function closeDetail() {
        selectedId = null;
        purchaseHistoryStore.clearDetail();
    }

    function productName(productId: string): string {
        const p = $productStore.items.find((x) => x.id === productId);
        return p?.name ?? productId.slice(0, 8);
    }

    function supplierName(supplierId: string | undefined): string {
        if (!supplierId) return "Sin proveedor";
        const s = $supplierStore.items.find((x) => x.id === supplierId);
        return s?.name ?? supplierId.slice(0, 8);
    }

    function formatMoney(n: number, currency = "USD"): string {
        const v = Number(n);
        if (!Number.isFinite(v)) return "—";
        const c = (currency || "USD").toUpperCase();
        return `${v.toLocaleString("es", { maximumFractionDigits: 2 })} ${c}`;
    }

    function formatDate(iso: string): string {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
            return d.toLocaleString("es", {
                dateStyle: "short",
                timeStyle: "short",
            });
        } catch {
            return iso.slice(0, 16);
        }
    }

    $: items = $purchaseHistoryStore.items;
    $: filtered = filterPurchaseEntries(items, {
        query,
        supplierId: supplierFilter,
        userId: userFilter,
        dateFrom,
        dateTo,
    });
    $: detail = $purchaseHistoryStore.detail;
    $: isInitialLoading = $purchaseHistoryStore.loading && items.length === 0;
    $: isRefreshing = $purchaseHistoryStore.loading && items.length > 0;
    $: uniqueUsers = [...new Set(items.map((e) => e.userId).filter(Boolean))].sort();
</script>

<section class="mgmt-page" aria-label="Historial de compras">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Historial de entradas</h1>
                <p class="mgmt-subtitle">
                    Facturas de compra registradas: cabecera, líneas y movements de stock (`entry_id`). Moneda principal USD.
                </p>
            </div>
            <div class="mgmt-meta">
                <span class="mgmt-chip">{filtered.length} / {items.length}</span>
                {#if isRefreshing}
                    <span class="mgmt-chip">
                        <LoadingSpinner size={16} label="Sync" subtle />
                        Sync…
                    </span>
                {/if}
            </div>
        </div>
    </header>

    {#if selectedId && detail}
        <section class="mgmt-card detail-panel" aria-label="Detalle de entrada">
            <div class="detail-head">
                <button class="mgmt-btn ghost" type="button" on:click={closeDetail}>
                    <Icon icon={ChevronLeft} size={18} ariaLabel="Volver" />
                    Volver al listado
                </button>
                {#if $purchaseHistoryStore.detailLoading}
                    <LoadingSpinner size={18} label="Cargando detalle" subtle />
                {/if}
            </div>

            <div class="detail-grid">
                <div>
                    <h2 class="mgmt-card-title">Cabecera</h2>
                    <dl class="meta-dl">
                        <div><dt>Id</dt><dd title={detail.entry.id}>{detail.entry.id}</dd></div>
                        <div><dt>Fecha</dt><dd>{formatDate(detail.entry.entryDateIso)}</dd></div>
                        <div><dt>Referencia</dt><dd>{detail.entry.reference || "—"}</dd></div>
                        <div>
                            <dt>Proveedor</dt>
                            <dd>
                                {detail.supplier?.name ??
                                    supplierName(detail.entry.supplierId)}
                            </dd>
                        </div>
                        <div><dt>Usuario</dt><dd>{detail.entry.userId}</dd></div>
                        <div><dt>Moneda</dt><dd>{(detail.entry.currency || "USD").toUpperCase()}</dd></div>
                        <div>
                            <dt>Total</dt>
                            <dd>{formatMoney(detail.entry.totalCost, detail.entry.currency)}</dd>
                        </div>
                        <div><dt>Líneas</dt><dd>{detail.lines.length}</dd></div>
                        {#if detail.entry.notes}
                            <div style="grid-column:1/-1">
                                <dt>Notas</dt>
                                <dd>{detail.entry.notes}</dd>
                            </div>
                        {/if}
                    </dl>
                </div>

                <div>
                    <h2 class="mgmt-card-title">Líneas</h2>
                    {#if detail.lines.length === 0}
                        <p class="mgmt-muted">Sin líneas.</p>
                    {:else}
                        <div class="lines-table">
                            {#each detail.lines as line (line.id)}
                                <article class="line-row">
                                    <div class="line-main">
                                        <strong>{productName(line.productId)}</strong>
                                        <span class="mgmt-muted">{line.productId.slice(0, 10)}…</span>
                                    </div>
                                    <div class="line-nums">
                                        <span>×{line.quantity}</span>
                                        <span>@ {formatMoney(line.unitCost, detail.entry.currency)}</span>
                                        <span class="line-total">{formatMoney(line.lineCost, detail.entry.currency)}</span>
                                    </div>
                                    <span class="concept-chip">{line.concept}</span>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div style="grid-column:1/-1">
                    <h2 class="mgmt-card-title">Movements de stock</h2>
                    {#if detail.movements.length === 0}
                        <p class="mgmt-muted">
                            No hay movements con este <code>entry_id</code>. Entradas previas a la
                            traza o fallo al escribir el movement.
                        </p>
                    {:else}
                        <div class="lines-table">
                            {#each detail.movements as m (m.id)}
                                <article class="line-row">
                                    <div class="line-main">
                                        <strong>{productName(m.productId)}</strong>
                                        <span class="mgmt-muted">{m.type} · {m.reason}</span>
                                    </div>
                                    <div class="line-nums">
                                        <span>+{m.quantity}</span>
                                        <span>bal {m.balanceAfter}</span>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </section>
    {:else}
        <section class="mgmt-card">
            <div class="filters">
                <label class="filter-field search">
                    <Icon icon={Search} size={16} ariaLabel="Buscar" />
                    <input
                        type="search"
                        placeholder="Id, referencia, usuario, notas…"
                        bind:value={query}
                    />
                </label>
                <label class="filter-field">
                    <span>Proveedor</span>
                    <select bind:value={supplierFilter}>
                        <option value="">Todos</option>
                        {#each $supplierStore.items as s}
                            <option value={s.id}>{s.name}</option>
                        {/each}
                    </select>
                </label>
                <label class="filter-field">
                    <span>Usuario</span>
                    <select bind:value={userFilter}>
                        <option value="">Todos</option>
                        {#each uniqueUsers as uid}
                            <option value={uid}>{uid}</option>
                        {/each}
                    </select>
                </label>
                <label class="filter-field">
                    <span>Desde</span>
                    <input type="date" bind:value={dateFrom} />
                </label>
                <label class="filter-field">
                    <span>Hasta</span>
                    <input type="date" bind:value={dateTo} />
                </label>
            </div>

            {#if isInitialLoading}
                <SkeletonList rows={6} />
            {:else if filtered.length === 0}
                <p class="mgmt-muted">No hay entradas con estos filtros.</p>
            {:else}
                <div class="entry-list">
                    {#each filtered as e (e.id)}
                        <button
                            type="button"
                            class="entry-row"
                            on:click={() => openDetail(e.id)}
                        >
                            <div class="entry-main">
                                <strong class="entry-ref">
                                    <Icon icon={FileText} size={16} ariaLabel="" />
                                    {e.reference?.trim() || e.id.slice(0, 8) + "…"}
                                </strong>
                                <span class="entry-meta">
                                    <span title="Proveedor">
                                        <Icon icon={Truck} size={14} ariaLabel="" />
                                        {supplierName(e.supplierId)}
                                    </span>
                                    <span title="Usuario">
                                        <Icon icon={User} size={14} ariaLabel="" />
                                        {e.userId.slice(0, 10)}{e.userId.length > 10 ? "…" : ""}
                                    </span>
                                    <span title="Líneas">
                                        <Icon icon={Package} size={14} ariaLabel="" />
                                        {e.lineCount} línea(s)
                                    </span>
                                </span>
                            </div>
                            <div class="entry-side">
                                <span class="entry-total">{formatMoney(e.totalCost, e.currency)}</span>
                                <span class="entry-date">{formatDate(e.entryDateIso)}</span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}
</section>

<style>
    .filters {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) repeat(4, minmax(100px, 0.7fr));
        gap: 10px;
        margin-bottom: 14px;
    }
    .filter-field {
        display: grid;
        gap: 4px;
    }
    .filter-field span {
        font-size: 0.78rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .filter-field.search {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 10px;
        padding: 0 10px;
        background: var(--md-sys-color-surface);
        align-self: end;
        height: 40px;
    }
    .filter-field.search input,
    .filter-field select,
    .filter-field input[type="date"] {
        width: 100%;
        height: 38px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 10px;
        padding: 0 10px;
        background: var(--md-sys-color-surface);
        color: inherit;
        font: inherit;
    }
    .filter-field.search input {
        border: 0;
        height: 100%;
        padding: 0;
        outline: 0;
    }
    .entry-list {
        display: grid;
        gap: 8px;
    }
    .entry-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        width: 100%;
        text-align: left;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        padding: 12px 14px;
        background: var(--md-sys-color-surface);
        color: inherit;
        font: inherit;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
    }
    .entry-row:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent);
    }
    .entry-main {
        min-width: 0;
        display: grid;
        gap: 6px;
    }
    .entry-ref {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.95rem;
    }
    .entry-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        font-size: 0.78rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .entry-meta span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .entry-side {
        text-align: right;
        display: grid;
        gap: 4px;
        flex-shrink: 0;
    }
    .entry-total {
        font-weight: 800;
        font-variant-numeric: tabular-nums;
    }
    .entry-date {
        font-size: 0.75rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .detail-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }
    .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 18px;
    }
    .meta-dl {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 14px;
        margin: 0;
    }
    .meta-dl dt {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
        margin: 0 0 2px;
    }
    .meta-dl dd {
        margin: 0;
        font-weight: 650;
        word-break: break-word;
    }
    .lines-table {
        display: grid;
        gap: 8px;
    }
    .line-row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
    }
    .line-main {
        min-width: 0;
        display: grid;
        gap: 2px;
    }
    .line-nums {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-variant-numeric: tabular-nums;
        font-size: 0.85rem;
        justify-content: flex-end;
    }
    .line-total {
        font-weight: 800;
    }
    .concept-chip {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 3px 8px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }
    @media (max-width: 900px) {
        .filters {
            grid-template-columns: 1fr 1fr;
        }
        .filter-field.search {
            grid-column: 1 / -1;
        }
        .detail-grid {
            grid-template-columns: 1fr;
        }
        .line-row {
            grid-template-columns: 1fr;
        }
    }
</style>
