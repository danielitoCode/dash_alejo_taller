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
    import { exchangeStore } from "../../../exchange/presentation/viewmodel/exchange.store";
    import { cupToUsd } from "../../../exchange/domain/entity/CupExchange";

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
    /** Moneda de la factura. USD = principal del negocio. CUP solo si se pagó en pesos. */
    let invoiceCurrency: "USD" | "CUP" = "USD";
    /** Tasa CUP por 1 USD: por defecto la de sesión (API); el staff puede particularizar. */
    let useCustomRate = false;
    let customRate: number | string = "";
    let rateHint = "";

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
        invoiceCurrency = "USD";
        useCustomRate = false;
        customRate = "";
        rateHint = "";
        invoiceLines = [emptyLine()];
        invoiceSubmitting = false;
        void supplierStore.syncAll().catch(() => {});
        void exchangeStore.loadCached();
        if (!$exchangeStore.exchange) {
            void exchangeStore.refreshOnSession();
        }
    }

    $: activeCategories = categories.filter((c) => c.status === "active");
    $: supplierOptions = $supplierStore.items;
    $: apiRate = $exchangeStore.exchange?.usdReference ?? null;
    $: effectiveRate = (() => {
        if (invoiceCurrency !== "CUP") return null;
        if (useCustomRate) {
            const n = Number(customRate);
            return Number.isFinite(n) && n > 0 ? n : null;
        }
        return apiRate != null && apiRate > 0 ? apiRate : null;
    })();
    $: rateSource = useCustomRate ? "manual" : "DIRECTORIO_CUBANO";

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

        if (invoiceCurrency === "CUP") {
            if (effectiveRate == null || effectiveRate <= 0) {
                toastStore.error(
                    "Compra en CUP requiere tasa (CUP por 1 USD). Espera la carga de la API o indica una tasa manual.",
                    5500
                );
                return;
            }
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
                currency: invoiceCurrency,
                lines: resolved,
                ...(invoiceCurrency === "CUP" && effectiveRate
                    ? {
                          exchangeRate: effectiveRate,
                          exchangeRateAt:
                              useCustomRate
                                  ? new Date().toISOString()
                                  : $exchangeStore.exchange?.updatedAt ?? new Date().toISOString(),
                          exchangeRateSource: rateSource as "DIRECTORIO_CUBANO" | "manual",
                      }
                    : {}),
            });

            await productStore.syncAll().catch(() => {});
            await supplierStore.syncAll().catch(() => {});
            invoiceSubmitting = false;
            onClose();
            toastStore.success(
                `Factura registrada (${entry.currency}): ${entry.lineCount} línea(s), total ${entry.totalCost}. Stock y costos actualizados.`,
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
                        Alta de stock · movements + costos. Moneda principal: <strong>USD</strong>. Usa CUP solo si
                        pagaste en pesos (el cambio se aplica al momento).
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
                        <span>Moneda *</span>
                        <select class="mgmt-select" bind:value={invoiceCurrency} disabled={invoiceSubmitting}>
                            <option value="USD">USD (principal)</option>
                            <option value="CUP">CUP (pesos)</option>
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

                {#if invoiceCurrency === "CUP"}
                    <div class="rate-box">
                        <p class="currency-hint">
                            Costos en <strong>CUP</strong>. <code>last_unit_cost</code> se guarda en <strong>USD</strong>
                            usando la tasa del momento (API al login, o la que particularices aquí).
                        </p>
                        {#if $exchangeStore.loading}
                            <p class="rate-meta">Actualizando tasa de mercado…</p>
                        {:else if apiRate}
                            <p class="rate-meta">
                                Tasa de sesión (API): <strong>1 USD = {apiRate} CUP</strong>
                                {#if $exchangeStore.exchange?.updatedAt}
                                    · {$exchangeStore.exchange.updatedAt.slice(0, 16).replace("T", " ")}
                                {/if}
                            </p>
                        {:else}
                            <p class="rate-meta warn">
                                No hay tasa de API en caché. Activa tasa manual o reintenta tras recargar sesión.
                            </p>
                        {/if}
                        <label class="rate-toggle">
                            <input type="checkbox" bind:checked={useCustomRate} disabled={invoiceSubmitting} />
                            Particularizar tasa de esta compra
                        </label>
                        {#if useCustomRate}
                            <label class="mgmt-field">
                                <span>Tasa manual (CUP por 1 USD) *</span>
                                <input
                                    class="mgmt-input"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    bind:value={customRate}
                                    placeholder="Ej. 350"
                                    disabled={invoiceSubmitting}
                                />
                            </label>
                        {/if}
                        {#if effectiveRate}
                            <p class="rate-meta ok">
                                Tasa que se aplicará: <strong>1 USD = {effectiveRate} CUP</strong>
                                ({rateSource === "manual" ? "manual" : "API"})
                            </p>
                        {/if}
                    </div>
                {/if}

                <div class="invoice-lines">
                    <div class="invoice-lines-head">
                        <strong>Líneas de compra ({invoiceCurrency})</strong>
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
                                    on:click={() => setLineMode(idx, "existing")}
                                    disabled={invoiceSubmitting}
                                >
                                    Del catálogo
                                </button>
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={line.mode === "new"}
                                    on:click={() => setLineMode(idx, "new")}
                                    disabled={invoiceSubmitting}
                                >
                                    Producto nuevo
                                </button>
                            </div>

                            {#if line.mode === "existing"}
                                <label class="mgmt-field">
                                    <span>Producto *</span>
                                    <select
                                        class="mgmt-select"
                                        bind:value={line.productId}
                                        disabled={invoiceSubmitting}
                                    >
                                        <option value="">Seleccionar…</option>
                                        {#each products as p}
                                            <option value={p.id}>{p.name}</option>
                                        {/each}
                                    </select>
                                </label>
                            {:else}
                                <div class="new-product-grid">
                                    <label class="mgmt-field">
                                        <span>Nombre *</span>
                                        <input
                                            class="mgmt-input"
                                            bind:value={line.newName}
                                            placeholder="Nombre del producto"
                                            disabled={invoiceSubmitting}
                                        />
                                    </label>
                                    <label class="mgmt-field">
                                        <span>Categoría *</span>
                                        <select
                                            class="mgmt-select"
                                            bind:value={line.newCategoryId}
                                            disabled={invoiceSubmitting}
                                        >
                                            <option value="">Seleccionar…</option>
                                            {#each activeCategories as c}
                                                <option value={c.id}>{c.name}</option>
                                            {/each}
                                        </select>
                                    </label>
                                    <label class="mgmt-field">
                                        <span>P. venta (USD) *</span>
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
                                    <span>Cantidad *</span>
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
                                    <span>Costo unit. ({invoiceCurrency}) *</span>
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
                                    <select
                                        class="mgmt-select"
                                        bind:value={line.concept}
                                        disabled={invoiceSubmitting}
                                    >
                                        <option value="purchase">Compra</option>
                                        <option value="adjustment">Ajuste</option>
                                        <option value="return">Devolución</option>
                                    </select>
                                </label>
                                <button
                                    class="mgmt-btn ghost line-remove"
                                    type="button"
                                    on:click={() => removeInvoiceLine(idx)}
                                    disabled={invoiceSubmitting || invoiceLines.length <= 1}
                                    aria-label="Quitar línea"
                                >
                                    <Icon icon={Trash2} size={16} ariaLabel="Quitar" />
                                </button>
                            </div>

                            {#if invoiceCurrency === "CUP" && effectiveRate && Number(line.unitCost) > 0}
                                <p class="rate-meta ok" style="margin:0">
                                    ≈ {(Number(line.unitCost) / effectiveRate).toFixed(4)} USD/u
                                    (last_unit_cost)
                                </p>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <footer class="entry-actions">
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={invoiceSubmitting}>
                    Cancelar
                </button>
                <button class="mgmt-btn primary" type="button" on:click={confirmInvoice} disabled={invoiceSubmitting}>
                    <Icon icon={FilePlus2} size={16} ariaLabel="Registrar" />
                    {#if invoiceSubmitting}Registrando…{:else}Registrar factura{/if}
                </button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .entry-overlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        display: grid;
        place-items: center;
        padding: 16px;
        background: color-mix(in srgb, black 50%, transparent);
    }
    .entry-dialog {
        width: min(720px, 100%);
        max-height: 90dvh;
        overflow: auto;
        border-radius: 20px;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 24px 48px color-mix(in srgb, black 30%, transparent);
        display: grid;
        grid-template-rows: auto 1fr auto;
        color: var(--md-sys-color-on-surface);
    }
    .invoice-dialog {
        width: min(860px, 100%);
    }
    .entry-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 12px;
        padding: 16px 18px 12px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .entry-head h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 800;
    }
    .entry-name {
        margin: 4px 0 0;
        font-size: 0.85rem;
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.4;
    }
    .entry-body {
        padding: 14px 18px;
        display: grid;
        gap: 16px;
        overflow: auto;
    }
    .invoice-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
    }
    .mgmt-field {
        display: grid;
        gap: 5px;
    }
    .mgmt-field span {
        font-size: 0.82rem;
        color: var(--md-sys-color-on-surface-variant);
        font-weight: 600;
    }
    .mgmt-input,
    .mgmt-select {
        width: 100%;
        height: 40px;
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        padding: 0 10px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, var(--md-sys-color-surface-variant));
        box-sizing: border-box;
    }
    .mgmt-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 40px;
        padding: 0 14px;
        border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
    }
    .mgmt-btn.primary {
        border: 0;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
    }
    .mgmt-btn.ghost {
        background: transparent;
    }
    .mgmt-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
    .rate-box {
        display: grid;
        gap: 8px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 25%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent);
    }
    .currency-hint {
        margin: 0;
        font-size: 0.86rem;
        line-height: 1.4;
        color: var(--md-sys-color-on-surface-variant);
    }
    .rate-meta {
        margin: 0;
        font-size: 0.84rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .rate-meta.warn {
        color: var(--md-sys-color-error);
    }
    .rate-meta.ok {
        color: var(--md-sys-color-primary);
        font-weight: 650;
    }
    .rate-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.88rem;
        font-weight: 650;
        cursor: pointer;
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
