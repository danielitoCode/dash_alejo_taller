<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { inventoryStore } from "../viewmodel/inventory.store";
    import { purchaseStore } from "../../../purchase/presentation/viewmodel/purchase.store";
    import type { StockMovement } from "../../domain/entity/StockMovement";
    import type { PurchaseEntry, PurchaseEntryLine } from "../../../purchase/domain/entity/PurchaseEntry";
    import { ClipboardList, FileText, RefreshCw } from "lucide-svelte";

    type Tab = "movements" | "invoices";

    let tab: Tab = "movements";
    let loading = false;
    let movements: StockMovement[] = [];
    let entries: PurchaseEntry[] = [];
    let expandedEntryId: string | null = null;
    let entryLines: Record<string, PurchaseEntryLine[]> = {};
    let mounted = false;

    async function loadMovements(): Promise<void> {
        movements = await inventoryStore.listRecentMovements(80);
    }

    async function loadEntries(): Promise<void> {
        entries = await purchaseStore.listEntries(50);
    }

    async function refresh(): Promise<void> {
        loading = true;
        try {
            if (tab === "movements") await loadMovements();
            else await loadEntries();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(
                e instanceof Error ? e.message : "No se pudo cargar el listado.",
                5000
            );
        } finally {
            loading = false;
        }
    }

    async function toggleEntry(id: string): Promise<void> {
        if (expandedEntryId === id) {
            expandedEntryId = null;
            return;
        }
        expandedEntryId = id;
        if (!entryLines[id]) {
            try {
                entryLines[id] = await purchaseStore.listLinesByEntry(id);
                entryLines = entryLines;
            } catch (e: any) {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error("No se pudieron cargar las líneas de la factura.", 4500);
            }
        }
    }

    function typeLabel(t: string): string {
        switch (t) {
            case "entrada": return "Entrada";
            case "salida_venta": return "Salida venta";
            case "ajuste": return "Ajuste";
            case "devolucion": return "Devolución";
            default: return t;
        }
    }

    function fmtDate(iso?: string): string {
        if (!iso) return "—";
        try {
            return new Date(iso).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    }

    onMount(() => {
        mounted = true;
        void refresh();
    });

    $: if (mounted && tab) {
        void refresh();
    }
</script>

<section class="mgmt-page inv-page" aria-label="Inventario — trazas">
    <header class="mgmt-header inv-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Inventario</h1>
                <p class="mgmt-subtitle">
                    Historial de movimientos de stock y facturas de entrada de mercancía.
                </p>
            </div>
            <div class="mgmt-meta">
                <button class="mgmt-btn ghost" type="button" on:click={() => refresh()} disabled={loading}>
                    <Icon icon={RefreshCw} size={18} ariaLabel="Actualizar" />
                    Actualizar
                </button>
            </div>
        </div>
        <div class="tab-row" role="tablist">
            <button
                class="tab-btn"
                class:active={tab === "movements"}
                type="button"
                role="tab"
                aria-selected={tab === "movements"}
                on:click={() => (tab = "movements")}
            >
                <Icon icon={ClipboardList} size={16} ariaLabel="Movimientos" />
                Movimientos
            </button>
            <button
                class="tab-btn"
                class:active={tab === "invoices"}
                type="button"
                role="tab"
                aria-selected={tab === "invoices"}
                on:click={() => (tab = "invoices")}
            >
                <Icon icon={FileText} size={16} ariaLabel="Facturas" />
                Facturas de entrada
            </button>
        </div>
    </header>

    <div class="mgmt-card inv-card">
        {#if loading}
            <div class="loading-wrap"><LoadingSpinner size={28} label="Cargando" /></div>
        {:else if tab === "movements"}
            {#if movements.length === 0}
                <p class="mgmt-muted empty-state">No hay movimientos registrados todavía.</p>
            {:else}
                <div class="table-wrap">
                    <table class="trace-table">
                        <thead>
                            <tr>
                                <th title="Fecha y hora en que se registró el movimiento de stock">Fecha</th>
                                <th title="Tipo de movimiento: entrada por compra, ajuste auditado, salida por venta o devolución">Tipo</th>
                                <th title="Identificador del producto afectado en el catálogo">Producto</th>
                                <th title="Cantidad de unidades movidas en este registro (valor positivo; el tipo indica si suma o resta)">Cantidad</th>
                                <th title="Existencia del producto inmediatamente después de aplicar este movimiento">Balance después</th>
                                <th title="Motivo o referencia del movimiento (factura, ajuste, venta, etc.)">Motivo</th>
                                <th title="Usuario del panel que registró el movimiento">Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each movements as m (m.id)}
                                <tr>
                                    <td class="cell-date">{fmtDate(m.createdAtIso)}</td>
                                    <td><span class="type-pill type-{m.type}">{typeLabel(m.type)}</span></td>
                                    <td class="mono">{m.productId}</td>
                                    <td class="cell-qty">{m.quantity}</td>
                                    <td class="cell-balance">{m.balanceAfter}</td>
                                    <td class="reason">{m.reason}</td>
                                    <td class="mono muted-id">{m.userId}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {:else}
            {#if entries.length === 0}
                <p class="mgmt-muted empty-state">No hay facturas de entrada registradas.</p>
            {:else}
                <div class="entry-list">
                    {#each entries as e (e.id)}
                        <article class="entry-card" class:expanded={expandedEntryId === e.id}>
                            <button
                                class="entry-card-head"
                                type="button"
                                on:click={() => toggleEntry(e.id)}
                                aria-expanded={expandedEntryId === e.id}
                            >
                                <div class="entry-card-main">
                                    <strong class="entry-ref">{e.reference || e.id}</strong>
                                    <p class="entry-meta">
                                        {fmtDate(e.entryDateIso)} · {e.lineCount} línea(s) · total
                                        <span class="entry-total">{e.totalCost} {e.currency}</span>
                                        {#if e.supplierId}
                                            · proveedor <span class="mono">{e.supplierId}</span>
                                        {/if}
                                    </p>
                                </div>
                                <span class="details-toggle" aria-hidden="true">
                                    {expandedEntryId === e.id ? "Ocultar detalles" : "Ver detalles"}
                                    <span class="chev">{expandedEntryId === e.id ? "▾" : "▸"}</span>
                                </span>
                            </button>
                            {#if expandedEntryId === e.id}
                                <div class="entry-card-body">
                                    {#if (entryLines[e.id] ?? []).length === 0}
                                        <p class="mgmt-muted">Sin líneas cargadas.</p>
                                    {:else}
                                        <div class="table-wrap inner">
                                            <table class="trace-table compact">
                                                <thead>
                                                    <tr>
                                                        <th title="Producto de catálogo incluido en esta línea de la factura">Producto</th>
                                                        <th title="Cantidad de unidades compradas en esta línea">Cantidad</th>
                                                        <th title="Costo unitario pagado por cada unidad de esta línea">Costo unitario</th>
                                                        <th title="Importe total de la línea (cantidad × costo unitario)">Total línea</th>
                                                        <th title="Concepto contable o de inventario asociado a la línea">Concepto</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {#each entryLines[e.id] as line (line.id)}
                                                        <tr>
                                                            <td class="mono">{line.productId}</td>
                                                            <td class="cell-qty">{line.quantity}</td>
                                                            <td>{line.unitCost}</td>
                                                            <td class="cell-balance">{line.lineCost}</td>
                                                            <td>{line.concept}</td>
                                                        </tr>
                                                    {/each}
                                                </tbody>
                                            </table>
                                        </div>
                                    {/if}
                                    {#if e.notes}
                                        <p class="notes"><span class="notes-label">Notas:</span> {e.notes}</p>
                                    {/if}
                                </div>
                            {/if}
                        </article>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</section>

<style>
    .inv-page { display: grid; gap: 0; }
    .inv-header { margin-bottom: 4px; }
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    .tab-btn {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 9px 16px; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 18%, transparent);
        color: var(--md-sys-color-on-surface); font-weight: 650; font-size: 0.92rem;
        cursor: pointer; transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }
    .tab-btn:hover { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent); }
    .tab-btn.active {
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, var(--md-sys-color-outline-variant));
        color: var(--md-sys-color-primary);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
    }
    .inv-card {
        margin-top: 14px; padding: 0; overflow: hidden; border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow: 0 1px 2px color-mix(in srgb, black 6%, transparent), 0 8px 24px color-mix(in srgb, black 5%, transparent);
    }
    .loading-wrap { display: grid; place-items: center; padding: 48px 24px; }
    .empty-state { margin: 0; padding: 36px 24px; text-align: center; }
    .table-wrap { overflow: auto; }
    .table-wrap.inner {
        border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 12%, transparent);
    }
    .trace-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.9rem; }
    .trace-table thead th {
        position: sticky; top: 0; z-index: 1; text-align: left; padding: 12px 14px;
        font-size: 0.72rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.04em;
        color: var(--md-sys-color-on-surface-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 55%, var(--md-sys-color-surface));
        border-bottom: 1px solid var(--md-sys-color-outline-variant); white-space: nowrap; cursor: help;
    }
    .trace-table tbody td {
        text-align: left; padding: 12px 14px;
        border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
        vertical-align: middle;
    }
    .trace-table tbody tr { transition: background 120ms ease; }
    .trace-table tbody tr:hover { background: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent); }
    .trace-table tbody tr:last-child td { border-bottom: none; }
    .trace-table.compact thead th, .trace-table.compact tbody td { padding: 8px 10px; font-size: 0.86rem; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.8rem; }
    .muted-id { opacity: 0.75; }
    .cell-date { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--md-sys-color-on-surface-variant); font-size: 0.86rem; }
    .cell-qty { font-weight: 700; font-variant-numeric: tabular-nums; }
    .cell-balance { font-weight: 650; font-variant-numeric: tabular-nums; }
    .reason { max-width: 280px; word-break: break-word; color: var(--md-sys-color-on-surface-variant); font-size: 0.88rem; }
    .type-pill {
        display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
        font-size: 0.76rem; font-weight: 750; letter-spacing: 0.01em; border: 1px solid transparent;
    }
    .type-entrada {
        background: color-mix(in srgb, #16a34a 18%, transparent);
        border-color: color-mix(in srgb, #16a34a 28%, transparent);
        color: color-mix(in srgb, #16a34a 70%, var(--md-sys-color-on-surface));
    }
    .type-ajuste {
        background: color-mix(in srgb, #d97706 18%, transparent);
        border-color: color-mix(in srgb, #d97706 28%, transparent);
        color: color-mix(in srgb, #d97706 70%, var(--md-sys-color-on-surface));
    }
    .type-salida_venta {
        background: color-mix(in srgb, #2563eb 16%, transparent);
        border-color: color-mix(in srgb, #2563eb 26%, transparent);
        color: color-mix(in srgb, #2563eb 70%, var(--md-sys-color-on-surface));
    }
    .type-devolucion {
        background: color-mix(in srgb, #7c3aed 16%, transparent);
        border-color: color-mix(in srgb, #7c3aed 26%, transparent);
        color: color-mix(in srgb, #7c3aed 70%, var(--md-sys-color-on-surface));
    }
    .entry-list { display: grid; gap: 12px; padding: 16px; }
    .entry-card {
        border: 1px solid var(--md-sys-color-outline-variant); border-radius: 14px; overflow: hidden;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 10%, var(--md-sys-color-surface));
        transition: border-color 160ms ease, box-shadow 160ms ease;
    }
    .entry-card:hover { border-color: color-mix(in srgb, var(--md-sys-color-primary) 30%, var(--md-sys-color-outline-variant)); }
    .entry-card.expanded {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant));
        box-shadow: 0 4px 16px color-mix(in srgb, black 6%, transparent);
    }
    .entry-card-head {
        width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px;
        padding: 14px 16px; background: transparent; border: none; color: inherit; text-align: left;
        cursor: pointer; transition: background 120ms ease;
    }
    .entry-card-head:hover { background: color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent); }
    .entry-card-main { min-width: 0; flex: 1; }
    .entry-ref {
        font-size: 0.98rem; font-weight: 750; display: block;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .entry-meta { margin: 5px 0 0; font-size: 0.86rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.45; }
    .entry-total { font-weight: 700; color: var(--md-sys-color-on-surface); }
    .details-toggle {
        flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 700;
        color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
        white-space: nowrap;
    }
    .chev { font-size: 0.95rem; line-height: 1; opacity: 0.9; }
    .entry-card-body {
        padding: 0 16px 16px; padding-top: 14px;
        border-top: 1px dashed color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    }
    .notes { margin: 12px 0 0; font-size: 0.88rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.45; }
    .notes-label { font-weight: 700; color: var(--md-sys-color-on-surface); }
    @media (max-width: 640px) {
        .entry-card-head { flex-direction: column; align-items: flex-start; gap: 10px; }
        .details-toggle { align-self: flex-end; }
    }
</style>
