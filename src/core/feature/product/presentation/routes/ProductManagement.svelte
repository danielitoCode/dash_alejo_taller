<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import MultiImagePicker from "../components/MultiImagePicker.svelte";
    import { availableStock, getPrimaryProductImage } from "../../domain/entity/Product";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import type { Product } from "../../domain/entity/Product";
    import type { ProductStatus } from "../../domain/entity/Product";
    import CategoryName from "../../../category/presentation/component/CategoryName.svelte";
    import { categoryStore } from "../../../category/presentation/viewmodel/category.store";
    import { promotionStore } from "../../../notification/presentation/viewmodel/promotion.store";
    import { productStore } from "../viewmodel/product.store";
    import { subscribeStockChanged } from "../../../../infrastructure/data/alset-pulse/stock-pulse";
    import { parseProductImages, serializeProductImages } from "../util/product.image";
    import { BadgeDollarSign, FilePlus2, Pencil, Plus, Save, Search, Trash2 } from "lucide-svelte";
    import PurchaseInvoiceModal from "../components/PurchaseInvoiceModal.svelte";

    let draftName = "";
    let draftDescription = "";
    let draftPrice: number | string = 0;
    let draftPhotoUrls: string[] = [];
    let draftCategoryId = "";
    let draftStatus: ProductStatus = "active";
    let draftExistence: number | string = 0;
    let reservedReadOnly = 0;
    let editId: string | null = null;
    let query = "";
    let imagePending = false;
    let imageKey = 0;
    let editExistenceReadOnly = 0;
    let formTried = false;
    let formSaving = false;

    let invoiceOpen = false;

    let stopStockSub: (() => void) | null = null;

    type FieldErrors = {
        name?: string;
        price?: string;
        categoryId?: string;
        images?: string;
    };

    function validateForm(): FieldErrors {
        const errors: FieldErrors = {};
        const name = draftName.trim();
        if (!name) {
            errors.name = "El nombre es obligatorio.";
        } else if (name.length < 2) {
            errors.name = "Usa al menos 2 caracteres.";
        } else if (name.length > 120) {
            errors.name = "Máximo 120 caracteres.";
        }

        const price = Number(draftPrice);
        if (draftPrice === "" || draftPrice === null || draftPrice === undefined) {
            errors.price = "Indica el precio de venta.";
        } else if (!Number.isFinite(price)) {
            errors.price = "El precio debe ser un número válido.";
        } else if (price <= 0) {
            errors.price = "El precio debe ser mayor que 0.";
        } else if (price > 1_000_000_000) {
            errors.price = "El precio es demasiado alto.";
        }

        if (!draftCategoryId) {
            errors.categoryId = "Selecciona una categoría.";
        }

        if (imagePending) {
            errors.images = "Espera a que terminen de cargar las imágenes.";
        }

        return errors;
    }

    $: fieldErrors = formTried ? validateForm() : ({} as FieldErrors);
    $: hasErrors = Object.keys(validateForm()).length > 0;
    $: canSubmit = !hasErrors && !imagePending && !formSaving;

    onMount(() => {
        productStore.syncAll().catch(() => {});
        categoryStore.syncAll().catch(() => {});
        promotionStore.syncAll().catch(() => {});
        stopStockSub = subscribeStockChanged((body) => {
            if (body.productIds?.length) {
                void productStore.handleStockChanged(body.productIds);
            }
        });
    });

    onDestroy(() => {
        stopStockSub?.();
        stopStockSub = null;
    });

    function resetForm(): void {
        editId = null;
        draftName = "";
        draftDescription = "";
        draftPrice = 0;
        draftPhotoUrls = [];
        draftCategoryId = "";
        draftStatus = "active";
        draftExistence = 0;
        reservedReadOnly = 0;
        editExistenceReadOnly = 0;
        formTried = false;
        formSaving = false;
        imageKey += 1;
    }

    async function create() {
        formTried = true;
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            toastStore.error("Revisa los campos marcados del formulario.", 4000);
            return;
        }
        const data: Product = {
            id: `p-${Math.random().toString(36).slice(2, 8)}`,
            name: draftName.trim(),
            description: draftDescription.trim(),
            existence: 0,
            reserved: 0,
            price: Number(draftPrice),
            photoUrl: serializeProductImages(draftPhotoUrls),
            categoryId: draftCategoryId,
            status: draftStatus,
        };
        formSaving = true;
        try {
            toastStore.info("Creando producto…", 3000);
            await productStore.create(data);
            toastStore.success("Producto creado (stock 0). Usa Factura de entrada para mercancía.", 5000);
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el producto.", 5000);
            formSaving = false;
        }
    }

    function startEdit(product: Product): void {
        editId = product.id;
        draftName = product.name;
        draftDescription = product.description || "";
        draftPrice = product.price;
        draftPhotoUrls = parseProductImages(product.photoUrl);
        draftCategoryId = product.categoryId;
        draftStatus = product.status;
        reservedReadOnly = product.reserved ?? 0;
        editExistenceReadOnly = product.existence;
        draftExistence = 0;
        formTried = false;
        formSaving = false;
        imageKey += 1;
    }

    async function saveEdit(): Promise<void> {
        if (!editId) return;
        formTried = true;
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            toastStore.error("Revisa los campos marcados del formulario.", 4000);
            return;
        }
        const old = $productStore.items.find((p) => p.id === editId);
        if (!old) return;
        const nextExistence = old.existence;
        formSaving = true;
        try {
            toastStore.info("Guardando cambios…", 2500);
            await productStore.updateCatalog({
                ...old,
                name: draftName.trim(),
                description: draftDescription.trim(),
                existence: nextExistence,
                reserved: old.reserved ?? 0,
                price: Number(draftPrice),
                photoUrl: serializeProductImages(draftPhotoUrls),
                categoryId: draftCategoryId,
                status: draftStatus,
            });
            toastStore.success("Producto actualizado.", 4000);
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar el producto.", 5000);
            formSaving = false;
        }
    }

    $: items = $productStore.items;
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((p) => {
                  const q = query.trim().toLowerCase();
                  return (
                      p.name.toLowerCase().includes(q) ||
                      (p.description || "").toLowerCase().includes(q) ||
                      (p.id || "").toLowerCase().includes(q)
                  );
              });
    $: availableCategories = $categoryStore.items.filter(
        (category) => category.status === "active" || category.id === draftCategoryId
    );
    $: now = Date.now();
    $: activePromotionProductIds = new Set(
        $promotionStore.items
            .filter((promo) => promo.validFromEpochMillis <= now && promo.validUntilEpochMillis >= now)
            .map((promo) => promo.productId)
            .filter(Boolean) as string[]
    );
    $: isRefreshing = $productStore.loading && items.length > 0;
    $: isInitialLoading = $productStore.loading && items.length === 0;
    $: editAvailablePreview = Math.max(0, editExistenceReadOnly - reservedReadOnly);
</script>

<section class="mgmt-screen">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Productos</h1>
                <p class="mgmt-muted">
                    Stock: available = existence − reserved. Las altas de stock solo vía factura de entrada (Core 2).
                </p>
            </div>
            <div class="mgmt-chip-row">
                <button class="mgmt-btn primary" type="button" on:click={() => (invoiceOpen = true)}>
                    <Icon icon={FilePlus2} size={18} ariaLabel="Factura" />
                    Factura de entrada
                </button>
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando…
                    </span>
                {/if}
            </div>
        </header>

        <div class="products-workspace">
            <aside class="product-form-panel" aria-label="Formulario de catálogo">
                <form
                    class="product-form"
                    novalidate
                    on:submit|preventDefault={() => (editId ? saveEdit() : create())}
                >
                    <h2 class="form-title">{editId ? "Editar producto" : "Nuevo producto (catálogo)"}</h2>

                    {#if formTried && hasErrors}
                        <div class="form-banner" role="alert">
                            Corrige los campos señalados para continuar.
                        </div>
                    {/if}

                    <div class="form-grid">
                        <label class="mgmt-field" class:invalid={!!fieldErrors.name}>
                            <span>Nombre <em class="req" aria-hidden="true">*</em></span>
                            <input
                                class="mgmt-input"
                                bind:value={draftName}
                                aria-invalid={fieldErrors.name ? "true" : undefined}
                                aria-describedby={fieldErrors.name ? "err-name" : undefined}
                                maxlength="120"
                                autocomplete="off"
                            />
                            {#if fieldErrors.name}
                                <span id="err-name" class="field-error">{fieldErrors.name}</span>
                            {/if}
                        </label>

                        <label class="mgmt-field">
                            <span>Descripción</span>
                            <input class="mgmt-input" bind:value={draftDescription} maxlength="500" />
                        </label>

                        <label class="mgmt-field" class:invalid={!!fieldErrors.price}>
                            <span>Precio de venta <em class="req" aria-hidden="true">*</em></span>
                            <input
                                class="mgmt-input"
                                type="number"
                                min="0.01"
                                step="0.01"
                                bind:value={draftPrice}
                                aria-invalid={fieldErrors.price ? "true" : undefined}
                                aria-describedby={fieldErrors.price ? "err-price" : undefined}
                            />
                            {#if fieldErrors.price}
                                <span id="err-price" class="field-error">{fieldErrors.price}</span>
                            {/if}
                        </label>

                        {#if editId}
                            <div class="stock-readonly">
                                <div class="stock-readonly-title">Stock actual (solo lectura)</div>
                                <div class="stock-chips">
                                    <span class="stock-chip">Existencia <strong>{editExistenceReadOnly}</strong></span>
                                    <span class="stock-chip">Reservado <strong>{reservedReadOnly}</strong></span>
                                    <span class="stock-chip accent">Disponible <strong>{editAvailablePreview}</strong></span>
                                </div>
                                <p class="mgmt-hint">
                                    El stock no se edita aquí. Usa <strong>Factura de entrada</strong> para sumar existencia
                                    (movimientos + costo alineados a Core 2).
                                </p>
                            </div>
                        {:else}
                            <p class="mgmt-hint">
                                Alta de catálogo con <strong>existencia 0</strong>. Para meter stock (y costo), registra una
                                <strong>Factura de entrada</strong>. Si el producto es nuevo, puedes crearlo dentro de esa factura.
                            </p>
                        {/if}

                        <label class="mgmt-field" class:invalid={!!fieldErrors.categoryId}>
                            <span>Categoría <em class="req" aria-hidden="true">*</em></span>
                            <select
                                class="mgmt-select"
                                bind:value={draftCategoryId}
                                aria-invalid={fieldErrors.categoryId ? "true" : undefined}
                                aria-describedby={fieldErrors.categoryId ? "err-cat" : undefined}
                            >
                                <option value="">Seleccione…</option>
                                {#each availableCategories as category}
                                    <option value={category.id}>{category.name}</option>
                                {/each}
                            </select>
                            {#if fieldErrors.categoryId}
                                <span id="err-cat" class="field-error">{fieldErrors.categoryId}</span>
                            {/if}
                        </label>

                        <label class="mgmt-field">
                            <span>Estado</span>
                            <select class="mgmt-select" bind:value={draftStatus}>
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </label>
                    </div>

                    <div class="product-images-field" class:invalid={!!fieldErrors.images}>
                        {#key imageKey}
                            <MultiImagePicker
                                label="Imágenes del producto"
                                bind:values={draftPhotoUrls}
                                bind:pending={imagePending}
                            />
                        {/key}
                        {#if fieldErrors.images}
                            <span class="field-error">{fieldErrors.images}</span>
                        {/if}
                    </div>

                    <div class="form-actions">
                        {#if editId}
                            <button class="mgmt-btn ghost" type="button" on:click={resetForm} disabled={formSaving}>
                                Cancelar
                            </button>
                            <button class="mgmt-btn primary" type="submit" disabled={!canSubmit}>
                                <Icon icon={Save} size={18} ariaLabel="Guardar" />
                                {formSaving ? "Guardando…" : "Guardar"}
                            </button>
                        {:else}
                            <button class="mgmt-btn primary" type="submit" disabled={!canSubmit}>
                                <Icon icon={Plus} size={18} ariaLabel="Crear" />
                                {formSaving ? "Creando…" : "Crear en catálogo"}
                            </button>
                        {/if}
                    </div>
                </form>
            </aside>

            <section class="product-list-panel mgmt-card" aria-label="Listado de productos">
                <div class="list-panel-head">
                    <h2 class="list-title">Productos en catálogo</h2>
                    <label class="filter-field search">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input type="search" placeholder="Buscar producto…" bind:value={query} />
                    </label>
                </div>

                {#if isInitialLoading}
                    <SkeletonList rows={6} />
                {:else if filtered.length === 0}
                    <p class="mgmt-muted">No hay productos.</p>
                {:else}
                    <div class="mgmt-list">
                        {#each filtered as product (product.id)}
                            {@const available = availableStock(product)}
                            <article class="mgmt-row">
                                <div class="mgmt-row-left">
                                    {#if getPrimaryProductImage(product.photoUrl ?? "")}
                                        <img
                                            class="thumb"
                                            src={getPrimaryProductImage(product.photoUrl ?? "")}
                                            alt=""
                                        />
                                    {:else}
                                        <div class="thumb placeholder" aria-hidden="true">
                                            <Icon icon={BadgeDollarSign} size={18} ariaLabel="" />
                                        </div>
                                    {/if}
                                    <div class="mgmt-row-main">
                                        <div class="mgmt-row-title">{product.name}</div>
                                        <p class="mgmt-row-sub">
                                            <CategoryName categoryId={product.categoryId} /> · ${product.price.toFixed(2)} ·
                                            {product.status}
                                        </p>
                                        <p class="mgmt-row-sub">
                                            Stock: {available} disp. (exist. {product.existence} · res. {product.reserved ?? 0})
                                        </p>
                                        {#if activePromotionProductIds.has(product.id)}
                                            <p class="mgmt-row-sub">Promoción activa</p>
                                        {/if}
                                    </div>
                                </div>
                                <div class="mgmt-row-actions">
                                    <button class="mgmt-btn ghost" type="button" on:click={() => startEdit(product)}>
                                        <Icon icon={Pencil} size={18} ariaLabel="Editar" />
                                        Editar
                                    </button>
                                    <button
                                        class="mgmt-btn danger"
                                        type="button"
                                        on:click={() => productStore.removeById(product.id)}
                                    >
                                        <Icon icon={Trash2} size={18} ariaLabel="Eliminar" />
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                    <div class="mgmt-pagination">
                        <button
                            class="mgmt-btn ghost"
                            disabled={$productStore.page <= 1 || $productStore.loading}
                            on:click={() => productStore.prevPage()}
                        >
                            Anterior
                        </button>
                        <span class="mgmt-pagination-info">Pág. {$productStore.page}</span>
                        <button
                            class="mgmt-btn ghost"
                            disabled={$productStore.page * $productStore.pageSize >= $productStore.total ||
                                $productStore.loading}
                            on:click={() => productStore.nextPage()}
                        >
                            Siguiente
                        </button>
                    </div>
                {/if}
            </section>
        </div>
    </div>
</section>

<PurchaseInvoiceModal
    open={invoiceOpen}
    products={items}
    categories={availableCategories}
    onClose={() => (invoiceOpen = false)}
/>

<style>
    .products-workspace {
        display: grid;
        grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
        gap: 16px;
        align-items: start;
    }

    .product-form-panel {
        position: sticky;
        top: 12px;
        max-height: calc(100dvh - 96px);
        overflow: auto;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 14px;
        background: var(--md-sys-color-surface);
        padding: 14px 16px 16px;
    }

    .product-list-panel {
        min-width: 0;
    }

    .list-panel-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
    }

    .list-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 750;
    }

    .form-title {
        margin: 0 0 10px;
        font-size: 0.95rem;
        font-weight: 750;
    }

    .form-banner {
        margin: 0 0 12px;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 0.82rem;
        font-weight: 650;
        color: #fecaca;
        background: color-mix(in srgb, #ef4444 14%, transparent);
        border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .form-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    .product-form {
        margin: 0;
        padding: 0;
        border: 0;
    }

    .product-images-field {
        margin-top: 10px;
    }

    .product-images-field.invalid {
        outline: 1px solid color-mix(in srgb, #ef4444 50%, transparent);
        border-radius: 10px;
        padding: 6px;
    }

    .mgmt-field.invalid .mgmt-input,
    .mgmt-field.invalid .mgmt-select {
        border-color: color-mix(in srgb, #ef4444 55%, var(--md-sys-color-outline-variant));
        box-shadow: 0 0 0 1px color-mix(in srgb, #ef4444 25%, transparent);
    }

    .field-error {
        display: block;
        margin-top: 4px;
        font-size: 0.75rem;
        font-weight: 650;
        color: #fca5a5;
    }

    .req {
        color: #f87171;
        font-style: normal;
        font-weight: 800;
    }

    .filter-field.search {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 10px;
        padding: 0 12px;
        flex: 1 1 200px;
        max-width: 320px;
        margin-left: auto;
    }

    .filter-field.search input {
        width: 100%;
        height: 40px;
        border: 0;
        outline: 0;
        background: transparent;
        color: inherit;
        font: inherit;
    }

    .stock-readonly-title {
        font-size: 0.78rem;
        font-weight: 700;
        margin-bottom: 6px;
        color: var(--md-sys-color-on-surface-variant);
    }

    .stock-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .stock-chip {
        font-size: 0.78rem;
        padding: 4px 8px;
        border-radius: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 20%, transparent);
    }

    .stock-chip.accent {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        color: var(--md-sys-color-primary);
    }

    .thumb {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        object-fit: cover;
        flex-shrink: 0;
    }

    .thumb.placeholder {
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent);
        color: var(--md-sys-color-on-surface-variant);
    }

    .mgmt-row-left {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        min-width: 0;
    }

    @media (max-width: 960px) {
        .products-workspace {
            grid-template-columns: 1fr;
        }

        .product-form-panel {
            position: static;
            max-height: none;
        }

        .filter-field.search {
            max-width: none;
            margin-left: 0;
            width: 100%;
        }

        .list-panel-head {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>
