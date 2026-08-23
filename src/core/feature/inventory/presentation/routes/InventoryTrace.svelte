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
        try { return new Date(iso).toLocaleString(); } catch { return iso; }
    }

    onMount(() => {
        mounted = true;
        void refresh();
    });

    $: if (mounted && tab) {
        void refresh();
    }
</script>

<section class="mgmt-page" aria-label="Inventario — trazas">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Inventario</h1>
                <p class="mgmt-subtitle">Movimientos de stock y facturas de entrada (Core 2).</p>
            </div>
            <div class="mgmt-meta">
                <button class="mgmt-btn ghost" type="button" on:click={() => refresh()} disabled={loading}>
                    <Icon icon={RefreshCw} size={18} ariaLabel="Actualizar" />
                    Actualizar
                </button>
            </div>
        </div>
        <div class="tab-row" role="tablist">
            <button class="tab-btn" class:active={tab === "movements"} type="button" role="tab" aria-selected={tab === "movements"} on:click={() => (tab = "movements")}>
                <Icon icon={ClipboardList} size={16} ariaLabel="Movimientos" />
                Movimientos
            </button>
            <button class="tab-btn" class:active={tab === "invoices"} type="button" role="tab" aria-selected={tab === "invoices"} on:click={() => (tab = "invoices")}>
                <Icon icon={FileText} size={16} ariaLabel="Facturas" />
                Facturas de entrada
            </button>
        </div>
    </header>

    <div class="mgmt-card">
        {#if loading}
            <div class="loading-wrap"><LoadingSpinner size={28} label="Cargando" /></div>
        {:else if tab === "movements"}
            {#if movements.length === 0}
                <p class="mgmt-muted">No hay movimientos registrados.</p>
            {:else}
                <div class="table-wrap">
                    <table class="trace-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Balance</th>
                                <th>Motivo</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each movements as m (m.id)}
                                <tr>
                                    <td>{fmtDate(m.createdAtIso)}</td>
                                    <td><span class="type-pill type-{m.type}">{typeLabel(m.type)}</span></td>
                                    <td class="mono">{m.productId}</td>
                                    <td>{m.quantity}</td>
                                    <td>{m.balanceAfter}</td>
                                    <td class="reason">{m.reason}</td>
                                    <td class="mono">{m.userId}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {:else}
            {#if entries.length === 0}
                <p class="mgmt-muted">No hay facturas de entrada.</p>
            {:else}
                <div class="entry-list">
                    {#each entries as e (e.id)}
                        <article class="entry-card">
                            <button class="entry-card-head" type="button" on:click={() => toggleEntry(e.id)}>
                                <div>
                                    <strong>{e.reference || e.id}</strong>
                                    <p class="mgmt-muted">
                                        {fmtDate(e.entryDateIso)} · {e.lineCount} línea(s) · total {e.totalCost} {e.currency}
                                        {#if e.supplierId} · proveedor {e.supplierId}{/if}
                                    </p>
                                </div>
                                <span class="chev">{expandedEntryId === e.id ? "▾" : "▸"}</span>
                            </button>
                            {#if expandedEntryId === e.id}
                                <div class="entry-card-body">
                                    {#if (entryLines[e.id] ?? []).length === 0}
                                        <p class="mgmt-muted">Sin líneas cargadas.</p>
                                    {:else}
                                        <table class="trace-table compact">
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cant.</th>
                                                    <th>Costo unit.</th>
                                                    <th>Línea</th>
                                                    <th>Concepto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each entryLines[e.id] as line (line.id)}
                                                    <tr>
                                                        <td class="mono">{line.productId}</td>
                                                        <td>{line.quantity}</td>
                                                        <td>{line.unitCost}</td>
                                                        <td>{line.lineCost}</td>
                                                        <td>{line.concept}</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    {/if}
                                    {#if e.notes}
                                        <p class="notes">Notas: {e.notes}</p>
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
    .tab-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .tab-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent; color: var(--md-sys-color-on-surface);
        font-weight: 650; cursor: pointer;
    }
    .tab-btn.active {
        background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant));
    }
    .loading-wrap { display: grid; place-items: center; padding: 40px; }
    .table-wrap { overflow: auto; }
    .trace-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .trace-table th, .trace-table td {
        text-align: left; padding: 10px 12px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant); vertical-align: top;
    }
    .trace-table th {
        font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.03em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .trace-table.compact th, .trace-table.compact td { padding: 6px 8px; }
    .mono { font-family: ui-monospace, monospace; font-size: 0.82rem; }
    .reason { max-width: 280px; word-break: break-word; }
    .type-pill {
        display: inline-block; padding: 2px 8px; border-radius: 999px;
        font-size: 0.78rem; font-weight: 700;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }
    .type-entrada { background: color-mix(in srgb, #22c55e 22%, transparent); }
    .type-ajuste { background: color-mix(in srgb, #f59e0b 22%, transparent); }
    .type-salida_venta { background: color-mix(in srgb, #3b82f6 22%, transparent); }
    .entry-list { display: grid; gap: 10px; }
    .entry-card {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 14px; overflow: hidden;
    }
    .entry-card-head {
        width: 100%; display: flex; justify-content: space-between; align-items: center;
        gap: 12px; padding: 12px 14px; background: transparent; border: none;
        color: inherit; text-align: left; cursor: pointer;
    }
    .entry-card-head p { margin: 4px 0 0; }
    .entry-card-body { padding: 0 14px 14px; }
    .notes { margin: 10px 0 0; font-size: 0.88rem; color: var(--md-sys-color-on-surface-variant); }
    .chev { font-size: 1.1rem; opacity: 0.7; }
</style>
