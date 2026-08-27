<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import type { Product } from "../../domain/entity/Product";
    import { purchaseStore } from "../../../purchase/presentation/viewmodel/purchase.store";
    import { supplierStore } from "../../../purchase/presentation/viewmodel/supplier.store";
    import type { PurchaseLineConcept } from "../../../purchase/domain/entity/enums";
    import { productStore } from "../viewmodel/product.store";
    import type { Category } from "../../../category/domain/entity/Category";
    import { FilePlus2, Plus, Trash2, X } from "lucide-svelte";

    export let open = false;
    export let products: Product[] = [];
    export let categories: Category[] = [];
    export let onClose: () => void = () => {};

    let invoiceSubmitting = false;
    /** "" = sin proveedor; "__new__" = crear por nombre; id = proveedor existente */
    let supplierMode: string = "";
    let invoiceSupplierName = "";
    let invoiceSupplierContact = "";
    let invoiceReference = "";
    let invoiceNotes = "";

    type InvoiceLineDraft = {
        mode: "existing" | "new";
        productId: string;
        newName: string;
        newCategoryId: string;
        newSalePrice: number | string;
        quantity: number | string;
        unitCost: number | string;
        concept: PurchaseLineConcept;
    };

    function emptyLine(): InvoiceLineDraft {
        return {
            mode: "existing",
            productId: "",
            newName: "",
            newCategoryId: "",
            newSalePrice: 0,
            quantity: 1,
            unitCost: 0,
            concept: "purchase",
        };
    }

    let invoiceLines: InvoiceLineDraft[] = [emptyLine()];

    onMount(() => {
        supplierStore.syncAll().catch(() => {});
    });

    $: if (open) {
        supplierMode = "";
        invoiceSupplierName = "";
        invoiceSupplierContact = "";
        invoiceReference = "";
        invoiceNotes = "";
        invoiceLines = [emptyLine()];
        invoiceSubmitting = false;
        void supplierStore.syncAll().catch(() => {});
    }

    $: activeCategories = categories.filter((c) => c.status === "active");
    $: supplierOptions = $supplierStore.items;

    function addInvoiceLine(): void {
        invoiceLines = [...invoiceLines, emptyLine()];
    }

    function removeInvoiceLine(idx: number): void {
        if (invoiceLines.length <= 1) return;
        invoiceLines = invoiceLines.filter((_, i) => i !== idx);
    }

    function setLineMode(idx: number, mode: "existing" | "new"): void {
        invoiceLines = invoiceLines.map((l, i) =>
            i === idx
                ? {
                      ...l,
                      mode,
                      productId: mode === "existing" ? l.productId : "",
                      newName: mode === "new" ? l.newName : "",
                      newCategoryId: mode === "new" ? l.newCategoryId : "",
                      newSalePrice: mode === "new" ? l.newSalePrice : 0,
                  }
                : l
        );
    }

    async function confirmInvoice(): Promise<void> {
        for (let i = 0; i < invoiceLines.length; i++) {
            const l = invoiceLines[i];
            const qty = Math.floor(Number(l.quantity) || 0);
            const cost = Number(l.unitCost);
            if (qty <= 0) {
                toastStore.error(`Línea ${i + 1}: la cantidad comprada debe ser > 0.`, 4500);
                return;
            }
            if (!Number.isFinite(cost) || cost < 0) {
                toastStore.error(`Línea ${i + 1}: el costo unitario no es válido.`, 4500);
                return;
            }
            if (l.mode === "existing") {
                if (!String(l.productId || "").trim()) {
                    toastStore.error(`Línea ${i + 1}: selecciona un producto del catálogo.`, 4500);
                    return;
                }
            } else {
                if (!l.newName.trim()) {
                    toastStore.error(`Línea ${i + 1}: indica el nombre del producto nuevo.`, 4500);
                    return;
                }
                if (!l.newCategoryId) {
                    toastStore.error(`Línea ${i + 1}: elige categoría para el producto nuevo.`, 4500);
                    return;
                }
                if (!(Number(l.newSalePrice) > 0)) {
                    toastStore.error(`Línea ${i + 1}: el precio de venta del producto nuevo debe ser > 0.`, 4500);
                    return;
                }
            }
        }

        if (supplierMode === "__new__" && !invoiceSupplierName.trim()) {
            toastStore.error("Indica el nombre del proveedor nuevo o elige uno del listado.", 4500);
            return;
        }

        invoiceSubmitting = true;
        toastStore.info("Preparando factura de entrada…", 3000);

        try {
            const resolved: {
                productId: string;
                quantity: number;
                unitCost: number;
                concept: PurchaseLineConcept;
            }[] = [];

            for (const l of invoiceLines) {
                const quantity = Math.floor(Number(l.quantity) || 0);
                const unitCost = Number(l.unitCost);
                let productId = String(l.productId || "").trim();

                if (l.mode === "new") {
                    const newId = `p-${Math.random().toString(36).slice(2, 10)}`;
                    const data: Product = {
                        id: newId,
                        name: l.newName.trim(),
                        description: "",
                        existence: 0,
                        reserved: 0,
                        price: Number(l.newSalePrice),
                        photoUrl: "",
                        categoryId: l.newCategoryId,
                        status: "active",
                    };
                    await productStore.create(data);
                    productId = newId;
                    logger.info(`[PurchaseInvoice] producto nuevo creado id=${productId} name=${data.name}`);
                }

                resolved.push({
                    productId,
                    quantity,
                    unitCost,
                    concept: l.concept,
                });
            }

            toastStore.info(`Registrando factura (${resolved.length} línea(s))…`, 3500);

            const supplierId =
                supplierMode && supplierMode !== "__new__" && supplierMode !== ""
                    ? supplierMode
                    : undefined;
            const supplierName =
                supplierMode === "__new__"
                    ? invoiceSupplierName.trim() || undefined
                    : undefined;
            const supplierContact =
                supplierMode === "__new__"
                    ? invoiceSupplierContact.trim() || undefined
                    : undefined;

            const entry = await purchaseStore.registerPurchaseEntry({
                supplierId,
                supplierName,
                supplierContact,
                reference: invoiceReference.trim() || undefined,
                notes: invoiceNotes.trim() || undefined,
                lines: resolved,
            });

            await productStore.syncAll().catch(() => {});
            await supplierStore.syncAll().catch(() => {});
            invoiceSubmitting = false;
            onClose();
            toastStore.success(
                `Factura registrada: ${entry.lineCount} línea(s), total ${entry.totalCost}. Stock y costos actualizados.`,
                6000
            );
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
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
                    <p class="entry-name">
                        Alta de stock · movements + costos. Puedes elegir un proveedor del catálogo o crear uno aquí al
                        vuelo (vía principal de alta).
                    </p>
                </div>
                <button
                    class="mgmt-btn ghost"
                    type="button"
                    on:click={() => onClose()}
                    disabled={invoiceSubmitting}
                    aria-label="Cerrar"
                >
                    <Icon icon={X} size={18} ariaLabel="Cerrar" />
                </button>
            </header>

            <div class="entry-body">
                <div class="invoice-grid">
                    <label class="mgmt-field">
                        <span>Proveedor</span>
                        <select class="mgmt-select" bind:value={supplierMode} disabled={invoiceSubmitting}>
                            <option value="">Sin proveedor</option>
                            <option value="__new__">+ Nuevo proveedor…</option>
                            {#each supplierOptions as s}
                                <option value={s.id}>{s.name}</option>
                            {/each}
                        </select>
                    </label>
                    <label class="mgmt-field">
                        <span>Referencia factura</span>
                        <input
                            class="mgmt-input"
                            bind:value={invoiceReference}
                            placeholder="Ej. F-2026-001"
                            disabled={invoiceSubmitting}
                        />
                    </label>
                    {#if supplierMode === "__new__"}
                        <label class="mgmt-field">
                            <span>Nombre del proveedor *</span>
                            <input
                                class="mgmt-input"
                                bind:value={invoiceSupplierName}
                                placeholder="Ej. Distribuidora Norte"
                                disabled={invoiceSubmitting}
                            />
                        </label>
                        <label class="mgmt-field">
                            <span>Contacto (opcional)</span>
                            <input
                                class="mgmt-input"
                                bind:value={invoiceSupplierContact}
                                placeholder="Teléfono, email…"
                                disabled={invoiceSubmitting}
                            />
                        </label>
                    {/if}
                    <label class="mgmt-field" style="grid-column:1/-1">
                        <span>Notas</span>
                        <input
                            class="mgmt-input"
                            bind:value={invoiceNotes}
                            placeholder="Opcional"
                            disabled={invoiceSubmitting}
                        />
                    </label>
                </div>

                <div class="invoice-lines">
                    <div class="invoice-lines-head">
                        <strong>Líneas de compra</strong>
                        <button
                            class="mgmt-btn ghost"
                            type="button"
                            on:click={addInvoiceLine}
                            disabled={invoiceSubmitting}
                        >
                            <Icon icon={Plus} size={16} ariaLabel="Añadir línea" />
                            Añadir línea
                        </button>
                    </div>

                    {#each invoiceLines as line, idx}
                        <div class="invoice-line">
                            <div class="line-mode">
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={line.mode === "existing"}
                                    disabled={invoiceSubmitting}
                                    on:click={() => setLineMode(idx, "existing")}
                                >
                                    Catálogo
                                </button>
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={line.mode === "new"}
                                    disabled={invoiceSubmitting}
                                    on:click={() => setLineMode(idx, "new")}
                                >
                                    Producto nuevo
                                </button>
                            </div>

                            {#if line.mode === "existing"}
                                <label class="mgmt-field">
                                    <span>Producto</span>
                                    <select class="mgmt-select" bind:value={line.productId} disabled={invoiceSubmitting}>
                                        <option value="">Seleccione…</option>
                                        {#each products as p}
                                            <option value={p.id}>{p.name}</option>
                                        {/each}
                                    </select>
                                </label>
                            {:else}
                                <div class="new-product-grid">
                                    <label class="mgmt-field">
                                        <span>Nombre del producto</span>
                                        <input
                                            class="mgmt-input"
                                            bind:value={line.newName}
                                            placeholder="Ej. Pastilla freno delantera"
                                            disabled={invoiceSubmitting}
                                        />
                                    </label>
                                    <label class="mgmt-field">
                                        <span>Categoría</span>
                                        <select
                                            class="mgmt-select"
                                            bind:value={line.newCategoryId}
                                            disabled={invoiceSubmitting}
                                        >
                                            <option value="">Seleccione…</option>
                                            {#each activeCategories as c}
                                                <option value={c.id}>{c.name}</option>
                                            {/each}
                                        </select>
                                    </label>
                                    <label class="mgmt-field">
                                        <span>Precio de venta</span>
                                        <input
                                            class="mgmt-input"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            bind:value={line.newSalePrice}
                                            disabled={invoiceSubmitting}
                                        />
                                    </label>
                                </div>
                            {/if}

                            <div class="line-qty-cost">
                                <label class="mgmt-field">
                                    <span>Cant. comprada</span>
                                    <input
                                        class="mgmt-input"
                                        type="number"
                                        min="1"
                                        step="1"
                                        bind:value={line.quantity}
                                        disabled={invoiceSubmitting}
                                    />
                                </label>
                                <label class="mgmt-field">
                                    <span>Costo unitario</span>
                                    <input
                                        class="mgmt-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        bind:value={line.unitCost}
                                        disabled={invoiceSubmitting}
                                    />
                                </label>
                                <label class="mgmt-field">
                                    <span>Concepto</span>
                                    <select class="mgmt-select" bind:value={line.concept} disabled={invoiceSubmitting}>
                                        <option value="purchase">Compra</option>
                                        <option value="royalty">Royalty</option>
                                        <option value="other">Otro</option>
                                    </select>
                                </label>
                                <button
                                    class="mgmt-btn ghost line-remove"
                                    type="button"
                                    title="Quitar línea"
                                    disabled={invoiceSubmitting || invoiceLines.length <= 1}
                                    on:click={() => removeInvoiceLine(idx)}
                                >
                                    <Icon icon={Trash2} size={16} ariaLabel="Quitar" />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <footer class="entry-actions">
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={invoiceSubmitting}>
                    Cancelar
                </button>
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
        width: min(720px, 100%);
        max-height: min(92dvh, 900px);
        overflow: auto;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        box-shadow: 0 20px 50px color-mix(in srgb, black 25%, transparent);
    }
    .invoice-dialog {
        width: min(820px, 100%);
    }
    .entry-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 18px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .entry-head h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 900;
    }
    .entry-name {
        margin: 4px 0 0;
        font-size: 0.82rem;
        color: var(--md-sys-color-on-surface-variant);
        max-width: 56ch;
        line-height: 1.35;
    }
    .entry-body {
        padding: 16px 18px;
        display: grid;
        gap: 16px;
    }
    .invoice-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    .invoice-lines {
        display: grid;
        gap: 12px;
    }
    .invoice-lines-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }
    .invoice-line {
        display: grid;
        gap: 10px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 10%, transparent);
    }
    .line-mode {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .mode-btn {
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 650;
        padding: 5px 10px;
        border-radius: 8px;
        cursor: pointer;
    }
    .mode-btn.active {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        color: var(--md-sys-color-primary);
        font-weight: 750;
    }
    .new-product-grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr 0.8fr;
        gap: 10px;
    }
    .line-qty-cost {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 10px;
        align-items: end;
    }
    .line-remove {
        height: 40px;
        width: 40px;
        padding: 0;
        display: grid;
        place-items: center;
    }
    .entry-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 18px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    @media (max-width: 720px) {
        .invoice-grid,
        .new-product-grid,
        .line-qty-cost {
            grid-template-columns: 1fr;
        }
        .entry-overlay {
            place-items: end center;
            padding: 0;
        }
        .entry-dialog {
            width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 92dvh;
        }
        .entry-actions {
            flex-direction: column-reverse;
        }
        .entry-actions .mgmt-btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>
