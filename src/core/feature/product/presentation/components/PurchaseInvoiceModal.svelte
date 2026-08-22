<script lang="ts">
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import type { Product } from "../../domain/entity/Product";
    import { purchaseStore } from "../../../purchase/presentation/viewmodel/purchase.store";
    import type { PurchaseLineConcept } from "../../../purchase/domain/entity/enums";
    import { productStore } from "../viewmodel/product.store";
    import { FilePlus2, Plus, Trash2, X } from "lucide-svelte";

    export let open = false;
    export let products: Product[] = [];
    export let onClose: () => void = () => {};

    let invoiceSubmitting = false;
    let invoiceSupplierName = "";
    let invoiceReference = "";
    let invoiceNotes = "";
    type InvoiceLineDraft = {
        productId: string;
        quantity: number | string;
        unitCost: number | string;
        concept: PurchaseLineConcept;
    };
    let invoiceLines: InvoiceLineDraft[] = [
        { productId: "", quantity: 1, unitCost: 0, concept: "purchase" },
    ];

    $: if (open) {
        invoiceSupplierName = "";
        invoiceReference = "";
        invoiceNotes = "";
        invoiceLines = [{ productId: "", quantity: 1, unitCost: 0, concept: "purchase" }];
        invoiceSubmitting = false;
    }

    function addInvoiceLine(): void {
        invoiceLines = [
            ...invoiceLines,
            { productId: "", quantity: 1, unitCost: 0, concept: "purchase" },
        ];
    }

    function removeInvoiceLine(idx: number): void {
        if (invoiceLines.length <= 1) return;
        invoiceLines = invoiceLines.filter((_, i) => i !== idx);
    }

    async function confirmInvoice(): Promise<void> {
        const lines = invoiceLines
            .map((l) => ({
                productId: String(l.productId || "").trim(),
                quantity: Math.floor(Number(l.quantity) || 0),
                unitCost: Number(l.unitCost),
                concept: l.concept,
            }))
            .filter((l) => l.productId && l.quantity > 0);
        if (lines.length === 0) {
            toastStore.error("Añade al menos una línea con producto y cantidad > 0.", 4500);
            return;
        }
        invoiceSubmitting = true;
        toastStore.info(`Registrando factura (${lines.length} línea(s))…`, 3500);
        try {
            const entry = await purchaseStore.registerPurchaseEntry({
                supplierName: invoiceSupplierName.trim() || undefined,
                reference: invoiceReference.trim() || undefined,
                notes: invoiceNotes.trim() || undefined,
                lines,
            });
            await productStore.syncAll().catch(() => {});
            invoiceSubmitting = false;
            onClose();
            toastStore.success(
                `Factura registrada: ${entry.lineCount} línea(s), total ${entry.totalCost}. Stock actualizado.`,
                6000
            );
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(
                e instanceof Error ? e.message : "No se pudo registrar la factura de entrada.",
                6000
            );
            invoiceSubmitting = false;
        }
    }
</script>

{#if open}
    <div class="entry-overlay" role="presentation" on:click|self={() => !invoiceSubmitting && onClose()}>
        <div class="entry-dialog invoice-dialog" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
            <header class="entry-head">
                <div>
                    <h2 id="invoice-title">Factura de entrada</h2>
                    <p class="entry-name">Multi-línea · stock + movements + costos</p>
                </div>
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={invoiceSubmitting} aria-label="Cerrar">
                    <Icon icon={X} size={18} ariaLabel="Cerrar" />
                </button>
            </header>
            <div class="entry-body">
                <div class="invoice-grid">
                    <label class="mgmt-field">
                        <span>Proveedor (nombre, opcional)</span>
                        <input class="mgmt-input" bind:value={invoiceSupplierName} placeholder="Ej. Distribuidora Norte" disabled={invoiceSubmitting} />
                    </label>
                    <label class="mgmt-field">
                        <span>Referencia factura</span>
                        <input class="mgmt-input" bind:value={invoiceReference} placeholder="Ej. F-2026-001" disabled={invoiceSubmitting} />
                    </label>
                    <label class="mgmt-field" style="grid-column:1/-1">
                        <span>Notas</span>
                        <input class="mgmt-input" bind:value={invoiceNotes} placeholder="Opcional" disabled={invoiceSubmitting} />
                    </label>
                </div>
                <div class="invoice-lines">
                    <div class="invoice-lines-head">
                        <strong>Líneas</strong>
                        <button class="mgmt-btn ghost" type="button" on:click={addInvoiceLine} disabled={invoiceSubmitting}>
                            <Icon icon={Plus} size={16} ariaLabel="Añadir línea" />
                            Línea
                        </button>
                    </div>
                    {#each invoiceLines as line, idx}
                        <div class="invoice-line">
                            <label class="mgmt-field">
                                <span>Producto</span>
                                <select class="mgmt-input" bind:value={line.productId} disabled={invoiceSubmitting}>
                                    <option value="">— elegir —</option>
                                    {#each products as p}
                                        <option value={p.id}>{p.name} ({p.id})</option>
                                    {/each}
                                </select>
                            </label>
                            <label class="mgmt-field">
                                <span>Cant. comprada</span>
                                <input class="mgmt-input" type="number" min="1" step="1" bind:value={line.quantity} disabled={invoiceSubmitting} title="Cantidad comprada de este producto" aria-label="Cantidad comprada" />
                            </label>
                            <label class="mgmt-field">
                                <span>Costo unitario</span>
                                <input class="mgmt-input" type="number" min="0" step="0.01" bind:value={line.unitCost} disabled={invoiceSubmitting} title="Costo por unidad" aria-label="Costo unitario" />
                            </label>
                            <label class="mgmt-field">
                                <span>Concepto</span>
                                <select class="mgmt-input" bind:value={line.concept} disabled={invoiceSubmitting}>
                                    <option value="purchase">Compra</option>
                                    <option value="royalty">Regalía</option>
                                    <option value="other">Otro</option>
                                </select>
                            </label>
                            <button class="mgmt-btn ghost" type="button" on:click={() => removeInvoiceLine(idx)} disabled={invoiceSubmitting || invoiceLines.length <= 1} aria-label="Quitar línea">
                                <Icon icon={Trash2} size={16} ariaLabel="Quitar" />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
            <footer class="entry-actions">
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={invoiceSubmitting}>Cancelar</button>
                <button class="mgmt-btn primary" type="button" on:click={confirmInvoice} disabled={invoiceSubmitting}>
                    <Icon icon={FilePlus2} size={18} ariaLabel="Registrar" />
                    {invoiceSubmitting ? "Registrando…" : "Registrar factura"}
                </button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .entry-overlay {
        position: fixed;
        inset: 0;
        z-index: 80;
        background: color-mix(in srgb, black 45%, transparent);
        display: grid;
        place-items: center;
        padding: 16px;
    }
    .entry-dialog {
        width: min(420px, 100%);
        border-radius: 20px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        box-shadow: 0 24px 48px color-mix(in srgb, black 40%, transparent);
        overflow: hidden;
    }
    .invoice-dialog {
        max-width: min(920px, 96vw);
        width: min(920px, 96vw);
        max-height: 90vh;
        overflow: auto;
    }
    .entry-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 18px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .entry-head h2 { margin: 0; font-size: 1.15rem; font-weight: 900; }
    .entry-name { margin: 4px 0 0; font-weight: 700; font-size: 0.95rem; }
    .entry-body { padding: 16px 18px; display: grid; gap: 14px; }
    .entry-actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 18px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .invoice-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 8px;
    }
    .invoice-lines-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .invoice-line {
        display: grid;
        grid-template-columns: 2fr 0.7fr 0.9fr 1fr auto;
        gap: 8px;
        align-items: end;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant, #ccc);
    }
    @media (max-width: 720px) {
        .invoice-grid { grid-template-columns: 1fr; }
        .invoice-line { grid-template-columns: 1fr 1fr; }
    }
</style>
