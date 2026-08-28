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
    import { purchaseStore } from "../viewmodel/purchase.store";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import type { BusinessRole } from "../../../auth/domain/entity/BusinessRole";
    import { filterPurchaseEntries } from "../../domain/util/filterPurchaseEntries";
    import type { PurchaseEntry } from "../../domain/entity/PurchaseEntry";
    import {
        Building2,
        CalendarDays,
        ChevronLeft,
        ClipboardList,
        FileText,
        Layers,
        Package,
        RefreshCw,
        Search,
        Truck,
        User,
        Wallet,
    } from "lucide-svelte";

    let query = "";
    let supplierFilter = "";
    let productFilter = "";
    let userFilter = "";
    let dateFrom = "";
    let dateTo = "";
    /** "" = todas; USD | CUP */
    let currencyFilter = "";
    /** date_desc | amount_asc | amount_desc */
    let sortMode: "date_desc" | "amount_asc" | "amount_desc" = "date_desc";
    let selectedId: string | null = null;
    /** entryIds que contienen el producto filtrado (null = sin filtro producto). */
    let productEntryIds: Set<string> | null = null;
    let productFilterLoading = false;

    onMount(() => {
        void supplierStore.syncAll().catch(() => {});
        void productStore.syncAll().catch(() => {});
        void userManagementStore.syncAll().catch(() => {});
        void reloadList();
    });

    async function reloadList(): Promise<void> {
        try {
            await purchaseHistoryStore.syncList();
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
            toastStore.error("No se pudo cargar el historial de entradas.");
        }
    }

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
        return p?.name ?? productId.slice(0, 10);
    }

    function supplierName(supplierId: string | undefined): string {
        if (!supplierId) return "Sin proveedor";
        const s = $supplierStore.items.find((x) => x.id === supplierId);
        return s?.name ?? supplierId.slice(0, 8);
    }

    function roleLabel(role: BusinessRole | string | null | undefined): string {
        switch (String(role || "").toLowerCase()) {
            case "owner":
                return "Propietario";
            case "admin":
                return "Administrador";
            case "sales":
                return "Ventas";
            case "viewer":
                return "Visualizador";
            default:
                return role ? String(role) : "Sin rol";
        }
    }

    /** Resuelve nombre + rol para auditoría (fallback al id si no está en el directorio). */
    function resolveStaff(userId: string | undefined | null): {
        id: string;
        name: string;
        role: string;
        known: boolean;
    } {
        const id = String(userId || "").trim();
        if (!id) {
            return { id: "", name: "Sin usuario", role: "—", known: false };
        }
        const u = $userManagementStore.items.find((x) => x.id === id);
        if (u) {
            return {
                id,
                name: u.name || u.email || id,
                role: roleLabel(u.role),
                known: true,
            };
        }
        return {
            id,
            name: id.length > 14 ? id.slice(0, 14) + "…" : id,
            role: "Usuario no listado",
            known: false,
        };
    }

    function entryCurrency(e: Pick<PurchaseEntry, "currency"> | string | undefined): "USD" | "CUP" {
        const raw =
            typeof e === "string"
                ? e
                : e && typeof e === "object"
                  ? e.currency
                  : "";
        return String(raw || "USD").trim().toUpperCase() === "CUP" ? "CUP" : "USD";
    }

    function formatMoney(n: number, currency: string = "USD"): string {
        const v = Number(n);
        if (!Number.isFinite(v)) return "—";
        const c = entryCurrency(currency);
        return `${v.toLocaleString("es", { maximumFractionDigits: 2 })} ${c}`;
    }

    function formatDate(iso: string): string {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
            return d.toLocaleString("es", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso.slice(0, 16);
        }
    }

    function cupToUsdDisplay(amountCup: number, rate: number | undefined): string | null {
        const a = Number(amountCup);
        const r = Number(rate);
        if (!Number.isFinite(a) || !Number.isFinite(r) || r <= 0) return null;
        return (a / r).toLocaleString("es", { maximumFractionDigits: 4 });
    }

    function sourceLabel(source: string | undefined): string {
        if (source === "manual") return "manual (staff)";
        if (source === "DIRECTORIO_CUBANO") return "API Directorio Cubano";
        return source?.trim() || "—";
    }

    function conceptLabel(c: string): string {
        switch (c) {
            case "purchase":
                return "Compra";
            case "royalty":
                return "Royalty";
            case "other":
                return "Otro";
            default:
                return c;
        }
    }

    /** Carga entryIds para filtro por producto. */
    async function applyProductFilter(productId: string): Promise<void> {
        const pid = String(productId || "").trim();
        if (!pid) {
            productEntryIds = null;
            return;
        }
        productFilterLoading = true;
        try {
            const lines = await purchaseStore.listLinesByProduct(pid, 100);
            productEntryIds = new Set(lines.map((l) => l.entryId).filter(Boolean));
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
            toastStore.error("No se pudo filtrar por producto.");
            productEntryIds = new Set();
        } finally {
            productFilterLoading = false;
        }
    }

    $: void (async () => {
        await applyProductFilter(productFilter);
    })();

    $: items = $purchaseHistoryStore.items;
    $: filteredBase = filterPurchaseEntries(items, {
        query,
        supplierId: supplierFilter,
        userId: userFilter,
        dateFrom,
        dateTo,
    });
    $: filteredCurrency =
        currencyFilter === "CUP" || currencyFilter === "USD"
            ? filteredBase.filter((e) => entryCurrency(e) === currencyFilter)
            : filteredBase;
    $: filteredProduct =
        productEntryIds == null
            ? filteredCurrency
            : filteredCurrency.filter((e) => productEntryIds!.has(e.id));
    $: filtered = (() => {
        const list = [...filteredProduct];
        if (sortMode === "amount_asc") {
            list.sort((a, b) => Number(a.totalCost) - Number(b.totalCost));
        } else if (sortMode === "amount_desc") {
            list.sort((a, b) => Number(b.totalCost) - Number(a.totalCost));
        } else {
            list.sort(
                (a, b) =>
                    String(b.entryDateIso || "").localeCompare(String(a.entryDateIso || ""))
            );
        }
        return list;
    })();

    $: detail = $purchaseHistoryStore.detail;
    $: isInitialLoading = $purchaseHistoryStore.loading && items.length === 0;
    $: isRefreshing = $purchaseHistoryStore.loading && items.length > 0;

    /** userIds presentes en el historial, ordenados por nombre de staff. */
    $: uniqueUserIds = [...new Set(items.map((e) => e.userId).filter(Boolean))];
    $: userFilterOptions = uniqueUserIds
        .map((id) => resolveStaff(id))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

    $: productOptions = [...$productStore.items].sort((a, b) =>
        a.name.localeCompare(b.name, "es")
    );

    $: detailCurrency = detail ? entryCurrency(detail.entry) : "USD";
    $: detailIsCup = detailCurrency === "CUP";
    $: detailRate =
        detail?.entry.exchangeRate != null && Number(detail.entry.exchangeRate) > 0
            ? Number(detail.entry.exchangeRate)
            : undefined;
    $: detailStaff = detail ? resolveStaff(detail.entry.userId) : null;

    $: statsUsd = items.filter((e) => entryCurrency(e) === "USD").length;
    $: statsCup = items.filter((e) => entryCurrency(e) === "CUP").length;
</script>

<section class="mgmt-page ph-page" aria-label="Historial de compras">
    <header class="mgmt-header ph-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Historial de entradas</h1>
                <p class="mgmt-subtitle">
                    Facturas de compra con traza de stock y costos. Moneda referencial
                    <strong>USD</strong>; CUP solo cuando el pago fue en pesos (tasa congelada al registrar).
                </p>
            </div>
            <div class="mgmt-meta ph-meta">
                <span class="stat-pill" title="Entradas USD">
                    <Icon icon={Wallet} size={14} ariaLabel="" />
                    {statsUsd} USD
                </span>
                <span class="stat-pill cup" title="Entradas CUP">
                    <Icon icon={Wallet} size={14} ariaLabel="" />
                    {statsCup} CUP
                </span>
                <span class="mgmt-chip">{filtered.length} / {items.length}</span>
                <button
                    class="mgmt-btn ghost"
                    type="button"
                    on:click={() => reloadList()}
                    disabled={$purchaseHistoryStore.loading}
                >
                    <Icon icon={RefreshCw} size={18} ariaLabel="Actualizar" />
                    Actualizar
                </button>
            </div>
        </div>
    </header>

    {#if selectedId && detail}
        <section class="mgmt-card detail-shell" aria-label="Detalle de entrada">
            <div class="detail-toolbar">
                <button class="mgmt-btn ghost" type="button" on:click={closeDetail}>
                    <Icon icon={ChevronLeft} size={18} ariaLabel="Volver" />
                    Volver al listado
                </button>
                <div class="detail-toolbar-right">
                    <span class="currency-badge lg" class:cup={detailIsCup}>{detailCurrency}</span>
                    {#if $purchaseHistoryStore.detailLoading}
                        <LoadingSpinner size={18} label="Cargando detalle" subtle />
                    {/if}
                </div>
            </div>

            <div class="detail-hero">
                <div class="detail-hero-icon" aria-hidden="true">
                    <Icon icon={FileText} size={28} ariaLabel="" />
                </div>
                <div class="detail-hero-main">
                    <span class="detail-kicker">Factura de entrada</span>
                    <h2 class="detail-ref">
                        {detail.entry.reference?.trim() || detail.entry.id}
                    </h2>
                    <div class="detail-hero-chips">
                        <span class="meta-chip">
                            <Icon icon={CalendarDays} size={14} ariaLabel="" />
                            {formatDate(detail.entry.entryDateIso)}
                        </span>
                        <span class="meta-chip">
                            <Icon icon={Building2} size={14} ariaLabel="" />
                            {detail.supplier?.name ?? supplierName(detail.entry.supplierId)}
                        </span>
                        {#if detailStaff}
                            <span class="meta-chip user-chip" title={detailStaff.id}>
                                <Icon icon={User} size={14} ariaLabel="" />
                                <span class="user-chip-text">
                                    <span class="user-name">{detailStaff.name}</span>
                                    <span class="user-role">{detailStaff.role}</span>
                                </span>
                            </span>
                        {/if}
                        <span class="meta-chip chip-total">
                            <Icon icon={Wallet} size={14} ariaLabel="" />
                            {formatMoney(detail.entry.totalCost, detailCurrency)}
                        </span>
                        <span class="meta-chip">
                            <Icon icon={Layers} size={14} ariaLabel="" />
                            {detail.lines.length} línea(s)
                        </span>
                    </div>
                </div>
            </div>

            {#if detailIsCup}
                <aside class="audit-box" aria-label="Auditoría de tipo de cambio">
                    <div class="audit-head">
                        <Icon icon={ClipboardList} size={18} ariaLabel="" />
                        <h3 class="audit-title">Auditoría CUP → USD</h3>
                    </div>
                    <p class="audit-lead">
                        Pago en <strong>CUP</strong>. Los montos de línea están en pesos. Inventario y COGS usan
                        <strong>USD</strong> con la tasa congelada al registrar (no se recalcula después).
                    </p>
                    {#if detailRate}
                        <dl class="audit-dl">
                            <div>
                                <dt>Tasa snapshot</dt>
                                <dd>1 USD = <strong>{detailRate}</strong> CUP</dd>
                            </div>
                            <div>
                                <dt>Momento</dt>
                                <dd>
                                    {detail.entry.exchangeRateAt
                                        ? formatDate(detail.entry.exchangeRateAt)
                                        : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt>Fuente</dt>
                                <dd>{sourceLabel(detail.entry.exchangeRateSource)}</dd>
                            </div>
                            <div>
                                <dt>Total ≈ USD</dt>
                                <dd class="audit-usd">
                                    {cupToUsdDisplay(detail.entry.totalCost, detailRate) ?? "—"} USD
                                </dd>
                            </div>
                        </dl>
                    {:else}
                        <p class="audit-warn">
                            CUP sin snapshot de tasa en el documento. No se puede reconstruir el equivalente USD.
                        </p>
                    {/if}
                </aside>
            {/if}

            {#if detail.entry.notes}
                <p class="notes-block">
                    <span class="notes-label">Notas</span>
                    {detail.entry.notes}
                </p>
            {/if}

            <div class="detail-sections">
                <section class="detail-section">
                    <h3 class="section-title">
                        <Icon icon={Package} size={18} ariaLabel="" />
                        Líneas ({detailCurrency})
                    </h3>
                    {#if detail.lines.length === 0}
                        <p class="mgmt-muted">Sin líneas.</p>
                    {:else}
                        <div class="line-cards">
                            {#each detail.lines as line (line.id)}
                                {@const usdUnit =
                                    detailIsCup && detailRate
                                        ? cupToUsdDisplay(line.unitCost, detailRate)
                                        : null}
                                {@const usdLine =
                                    detailIsCup && detailRate
                                        ? cupToUsdDisplay(line.lineCost, detailRate)
                                        : null}
                                <article class="line-card">
                                    <div class="line-card-top">
                                        <div class="line-product">
                                            <strong>{productName(line.productId)}</strong>
                                            <span class="mono muted">{line.productId}</span>
                                        </div>
                                        <span class="concept-chip">{conceptLabel(line.concept)}</span>
                                    </div>
                                    <div class="line-metrics">
                                        <div class="metric">
                                            <span class="metric-label">Cantidad</span>
                                            <span class="metric-value">×{line.quantity}</span>
                                        </div>
                                        <div class="metric">
                                            <span class="metric-label">Costo unit.</span>
                                            <span class="metric-value"
                                                >{formatMoney(line.unitCost, detailCurrency)}</span
                                            >
                                        </div>
                                        <div class="metric">
                                            <span class="metric-label">Total línea</span>
                                            <span class="metric-value emphasis"
                                                >{formatMoney(line.lineCost, detailCurrency)}</span
                                            >
                                        </div>
                                    </div>
                                    {#if usdUnit != null}
                                        <p class="usd-equiv">
                                            → last_unit_cost ≈ <strong>{usdUnit} USD/u</strong>
                                            {#if usdLine != null}
                                                · línea ≈ {usdLine} USD
                                            {/if}
                                        </p>
                                    {/if}
                                </article>
                            {/each}
                        </div>
                    {/if}
                </section>

                <section class="detail-section">
                    <h3 class="section-title">
                        <Icon icon={Layers} size={18} ariaLabel="" />
                        Movements de stock
                    </h3>
                    {#if detail.movements.length === 0}
                        <p class="mgmt-muted">
                            No hay movements con este <code>entry_id</code>.
                        </p>
                    {:else}
                        <div class="line-cards">
                            {#each detail.movements as m (m.id)}
                                <article class="line-card compact">
                                    <div class="line-card-top">
                                        <div class="line-product">
                                            <strong>{productName(m.productId)}</strong>
                                            <span class="mgmt-muted">{m.type} · {m.reason}</span>
                                        </div>
                                        <div class="line-metrics inline">
                                            <span class="metric-value">+{m.quantity}</span>
                                            <span class="mgmt-muted">bal {m.balanceAfter}</span>
                                        </div>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </section>
            </div>
        </section>
    {:else}
        <section class="mgmt-card list-shell">
            <div class="filters-panel">
                <label class="filter-field search">
                    <Icon icon={Search} size={16} ariaLabel="Buscar" />
                    <input
                        type="search"
                        placeholder="Buscar id, referencia, notas…"
                        bind:value={query}
                    />
                </label>
                <label class="filter-field">
                    <span>Moneda</span>
                    <select bind:value={currencyFilter}>
                        <option value="">Todas</option>
                        <option value="USD">USD (principal)</option>
                        <option value="CUP">CUP (pesos)</option>
                    </select>
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
                    <span>Producto</span>
                    <select bind:value={productFilter} disabled={productFilterLoading}>
                        <option value="">Todos</option>
                        {#each productOptions as p}
                            <option value={p.id}>{p.name}</option>
                        {/each}
                    </select>
                </label>
                <label class="filter-field">
                    <span>Usuario</span>
                    <select bind:value={userFilter}>
                        <option value="">Todos</option>
                        {#each userFilterOptions as u}
                            <option value={u.id}>{u.name} — {u.role}</option>
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
                <label class="filter-field">
                    <span>Ordenar</span>
                    <select bind:value={sortMode}>
                        <option value="date_desc">Fecha (recientes)</option>
                        <option value="amount_asc">Monto: menor → mayor</option>
                        <option value="amount_desc">Monto: mayor → menor</option>
                    </select>
                </label>
            </div>

            {#if isInitialLoading || productFilterLoading}
                <div class="list-pad"><SkeletonList rows={5} /></div>
            {:else if filtered.length === 0}
                <p class="mgmt-muted empty-state">No hay entradas con estos filtros.</p>
            {:else}
                <div class="entry-list">
                    {#each filtered as e (e.id)}
                        {@const cur = entryCurrency(e)}
                        {@const isCup = cur === "CUP"}
                        {@const rate =
                            e.exchangeRate != null && Number(e.exchangeRate) > 0
                                ? Number(e.exchangeRate)
                                : undefined}
                        {@const usdTotal = isCup ? cupToUsdDisplay(e.totalCost, rate) : null}
                        {@const staff = resolveStaff(e.userId)}
                        <button type="button" class="entry-card" on:click={() => openDetail(e.id)}>
                            <span class="entry-icon" class:cup={isCup} aria-hidden="true">
                                <Icon icon={FileText} size={22} ariaLabel="" />
                            </span>
                            <div class="entry-body">
                                <div class="entry-title-row">
                                    <span class="entry-label">Factura</span>
                                    <strong class="entry-ref">
                                        {e.reference?.trim() || e.id.slice(0, 12) + "…"}
                                    </strong>
                                    <span class="currency-badge sm" class:cup={isCup}>{cur}</span>
                                </div>
                                <div class="entry-chips">
                                    <span class="meta-chip" title="Fecha">
                                        <Icon icon={CalendarDays} size={14} ariaLabel="" />
                                        {formatDate(e.entryDateIso)}
                                    </span>
                                    <span class="meta-chip" title="Proveedor">
                                        <Icon icon={Truck} size={14} ariaLabel="" />
                                        {supplierName(e.supplierId)}
                                    </span>
                                    <span class="meta-chip user-chip" title={staff.id}>
                                        <Icon icon={User} size={14} ariaLabel="" />
                                        <span class="user-chip-text">
                                            <span class="user-name">{staff.name}</span>
                                            <span class="user-role">{staff.role}</span>
                                        </span>
                                    </span>
                                    <span class="meta-chip" title="Líneas">
                                        <Icon icon={Package} size={14} ariaLabel="" />
                                        {e.lineCount} línea(s)
                                    </span>
                                    {#if isCup && rate}
                                        <span class="meta-chip chip-rate" title="Tasa snapshot">
                                            1 USD = {rate} CUP
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <div class="entry-side">
                                <span class="entry-total">{formatMoney(e.totalCost, cur)}</span>
                                {#if usdTotal != null}
                                    <span class="entry-usd-equiv">≈ {usdTotal} USD</span>
                                {/if}
                                <span class="open-hint">Ver detalle →</span>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
            {#if isRefreshing}
                <div class="refresh-bar">
                    <LoadingSpinner size={16} label="Sync" subtle />
                    Sincronizando…
                </div>
            {/if}
        </section>
    {/if}
</section>

<style>
    .ph-page {
        display: grid;
        gap: 0;
    }
    .ph-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
    .stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 750;
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent);
        color: var(--md-sys-color-primary);
    }
    .stat-pill.cup {
        background: color-mix(in srgb, #f59e0b 14%, transparent);
        border-color: color-mix(in srgb, #f59e0b 32%, transparent);
        color: #fbbf24;
    }

    .list-shell {
        margin-top: 12px;
        padding: 0;
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow:
            0 1px 2px color-mix(in srgb, black 6%, transparent),
            0 8px 24px color-mix(in srgb, black 5%, transparent);
    }
    .filters-panel {
        display: grid;
        grid-template-columns: minmax(160px, 1.4fr) repeat(4, minmax(100px, 0.75fr)) repeat(3, minmax(110px, 0.7fr));
        gap: 10px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 12%, transparent);
    }
    .filter-field {
        display: grid;
        gap: 4px;
    }
    .filter-field span {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
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

    .list-pad {
        padding: 16px;
    }
    .empty-state {
        margin: 0;
        padding: 36px 24px;
        text-align: center;
    }
    .entry-list {
        display: grid;
        gap: 12px;
        padding: 16px;
    }
    .entry-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        width: 100%;
        text-align: left;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 16px;
        padding: 14px 16px;
        background: linear-gradient(
            165deg,
            color-mix(in srgb, var(--md-sys-color-surface-variant) 14%, var(--md-sys-color-surface)) 0%,
            var(--md-sys-color-surface) 48%
        );
        color: inherit;
        font: inherit;
        cursor: pointer;
        transition:
            border-color 0.15s,
            box-shadow 0.15s,
            background 0.15s;
    }
    .entry-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        box-shadow: 0 6px 20px color-mix(in srgb, black 8%, transparent);
    }
    .entry-icon {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
    }
    .entry-icon.cup {
        color: #fbbf24;
        background: color-mix(in srgb, #f59e0b 14%, transparent);
        border-color: color-mix(in srgb, #f59e0b 30%, transparent);
    }
    .entry-body {
        min-width: 0;
        flex: 1;
        display: grid;
        gap: 10px;
    }
    .entry-title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }
    .entry-label {
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--md-sys-color-on-surface-variant);
        padding: 2px 8px;
        border-radius: 6px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
    }
    .entry-ref {
        font-size: 1.05rem;
        font-weight: 800;
        letter-spacing: -0.01em;
    }
    .entry-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 28%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
        max-width: 100%;
    }
    .user-chip {
        align-items: flex-start;
        padding-top: 4px;
        padding-bottom: 4px;
    }
    .user-chip-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        line-height: 1.2;
        min-width: 0;
    }
    .user-name {
        font-weight: 750;
        font-size: 0.82rem;
    }
    .user-role {
        font-size: 0.68rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface-variant);
        letter-spacing: 0.02em;
    }
    .chip-total {
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent);
        color: var(--md-sys-color-primary);
        font-weight: 750;
    }
    .chip-rate {
        background: color-mix(in srgb, #f59e0b 12%, transparent);
        border-color: color-mix(in srgb, #f59e0b 28%, transparent);
        color: #fbbf24;
        font-weight: 700;
    }
    .entry-side {
        text-align: right;
        display: grid;
        gap: 4px;
        flex-shrink: 0;
        align-content: start;
        min-width: 120px;
    }
    .entry-total {
        font-weight: 800;
        font-size: 1.05rem;
        font-variant-numeric: tabular-nums;
    }
    .entry-usd-equiv {
        font-size: 0.78rem;
        font-weight: 650;
        color: var(--md-sys-color-primary);
        font-variant-numeric: tabular-nums;
    }
    .open-hint {
        margin-top: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--md-sys-color-primary);
        opacity: 0.85;
    }
    .entry-card:hover .open-hint {
        opacity: 1;
    }
    .refresh-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px 12px;
        font-size: 0.8rem;
        color: var(--md-sys-color-on-surface-variant);
    }

    .currency-badge {
        display: inline-flex;
        align-items: center;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
        color: var(--md-sys-color-primary);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent);
    }
    .currency-badge.cup {
        background: color-mix(in srgb, #f59e0b 18%, transparent);
        color: #fbbf24;
        border-color: color-mix(in srgb, #f59e0b 40%, transparent);
    }
    .currency-badge.sm {
        font-size: 0.65rem;
        padding: 1px 6px;
    }
    .currency-badge.lg {
        font-size: 0.85rem;
        padding: 4px 12px;
    }

    .detail-shell {
        margin-top: 12px;
        padding: 0;
        overflow: hidden;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow:
            0 1px 2px color-mix(in srgb, black 6%, transparent),
            0 8px 24px color-mix(in srgb, black 5%, transparent);
    }
    .detail-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .detail-toolbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .detail-hero {
        display: flex;
        gap: 16px;
        padding: 18px 20px;
        background: linear-gradient(
            120deg,
            color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent),
            transparent 55%
        );
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .detail-hero-icon {
        flex-shrink: 0;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent);
    }
    .detail-hero-main {
        min-width: 0;
        display: grid;
        gap: 8px;
    }
    .detail-kicker {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .detail-ref {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        word-break: break-word;
    }
    .detail-hero-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .audit-box {
        margin: 16px 20px 0;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid color-mix(in srgb, #f59e0b 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 8%, transparent);
        display: grid;
        gap: 10px;
    }
    .audit-head {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fbbf24;
    }
    .audit-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 800;
    }
    .audit-lead {
        margin: 0;
        font-size: 0.84rem;
        line-height: 1.45;
        color: var(--md-sys-color-on-surface-variant);
    }
    .audit-dl {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 14px;
        margin: 0;
    }
    .audit-dl dt {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
        margin: 0 0 2px;
    }
    .audit-dl dd {
        margin: 0;
        font-weight: 650;
        font-size: 0.9rem;
    }
    .audit-usd {
        color: var(--md-sys-color-primary);
        font-weight: 800;
    }
    .audit-warn {
        margin: 0;
        font-size: 0.84rem;
        color: var(--md-sys-color-error);
        font-weight: 650;
    }

    .notes-block {
        margin: 14px 20px 0;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px dashed var(--md-sys-color-outline-variant);
        font-size: 0.88rem;
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.45;
    }
    .notes-label {
        display: block;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface);
        margin-bottom: 4px;
    }

    .detail-sections {
        display: grid;
        gap: 20px;
        padding: 18px 20px 22px;
    }
    .section-title {
        margin: 0 0 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 800;
    }
    .line-cards {
        display: grid;
        gap: 10px;
    }
    .line-card {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 10%, transparent);
        display: grid;
        gap: 10px;
    }
    .line-card.compact {
        gap: 6px;
    }
    .line-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
    }
    .line-product {
        min-width: 0;
        display: grid;
        gap: 2px;
    }
    .line-product strong {
        font-size: 0.95rem;
    }
    .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.75rem;
    }
    .muted {
        opacity: 0.7;
    }
    .line-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }
    .line-metrics.inline {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
    }
    .metric {
        display: grid;
        gap: 2px;
    }
    .metric-label {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
        font-weight: 700;
    }
    .metric-value {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        font-size: 0.92rem;
    }
    .metric-value.emphasis {
        color: var(--md-sys-color-primary);
        font-weight: 800;
    }
    .usd-equiv {
        margin: 0;
        font-size: 0.8rem;
        color: var(--md-sys-color-primary);
        font-weight: 650;
    }
    .concept-chip {
        flex-shrink: 0;
        font-size: 0.68rem;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 4px 10px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        border: 1px solid var(--md-sys-color-outline-variant);
    }

    @media (max-width: 1100px) {
        .filters-panel {
            grid-template-columns: 1fr 1fr 1fr;
        }
        .filter-field.search {
            grid-column: 1 / -1;
        }
    }
    @media (max-width: 720px) {
        .filters-panel {
            grid-template-columns: 1fr 1fr;
        }
        .entry-card {
            flex-direction: column;
        }
        .entry-side {
            text-align: left;
            min-width: 0;
            width: 100%;
            flex-direction: row;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
        }
        .detail-hero {
            flex-direction: column;
        }
        .audit-dl {
            grid-template-columns: 1fr;
        }
        .line-metrics {
            grid-template-columns: 1fr;
        }
        .line-card-top {
            flex-direction: column;
        }
    }
</style>
