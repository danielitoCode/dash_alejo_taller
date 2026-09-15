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
    /** URL manual (R2/Appwrite storage aún no; permite pegar https://…) */
    let draftPhotoUrlManual = "";
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
        photoUrl?: string;
    };

    function isHttpUrl(value: string): boolean {
        const t = value.trim();
        if (!t) return true; // vacío ok
        try {
            const u = new URL(t);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    }

    function mergedPhotoUrls(): string[] {
        const fromPicker = draftPhotoUrls.filter((u) => typeof u === "string" && u.trim());
        const manual = draftPhotoUrlManual.trim();
        if (manual && !fromPicker.includes(manual)) return [...fromPicker, manual];
        return fromPicker;
    }

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

        if (!String(draftCategoryId || "").trim()) {
            errors.categoryId = "Selecciona una categoría.";
        }

        if (imagePending) {
            errors.images =
                "Hay imágenes locales pendientes. Súbelas, quítalas, o usa solo una URL https.";
        }

        if (draftPhotoUrlManual.trim() && !isHttpUrl(draftPhotoUrlManual)) {
            errors.photoUrl = "La URL de foto debe ser http(s)://…";
        }

        return errors;
    }

    $: fieldErrors = formTried ? validateForm() : ({} as FieldErrors);
    $: validationNow = validateForm();
    $: hasErrors = Object.keys(validationNow).length > 0;
    $: canSubmit = !hasErrors && !imagePending && !formSaving;
    $: disabledHint = (() => {
        if (formSaving) return "Guardando…";
        if (imagePending) return "Imágenes locales pendientes de subir o quitar.";
        const e = validationNow;
        if (e.name) return e.name;
        if (e.price) return e.price;
        if (e.categoryId) return e.categoryId;
        if (e.photoUrl) return e.photoUrl;
        if (e.images) return e.images;
        return "";
    })();

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
        draftPhotoUrlManual = "";
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
            toastStore.error(disabledHint || "Revisa los campos del formulario.", 4000);
            return;
        }
        const data: Product = {
            id: `p-${Math.random().toString(36).slice(2, 8)}`,
            name: draftName.trim(),
            description: draftDescription.trim(),
            existence: 0,
            reserved: 0,
            price: Number(draftPrice),
            photoUrl: serializeProductImages(mergedPhotoUrls()),
            categoryId: String(draftCategoryId).trim(),
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
        draftName = product.name ?? "";
        draftDescription = product.description || "";
        draftPrice = Number(product.price) > 0 ? Number(product.price) : product.price;
        const parsed = parseProductImages(product.photoUrl ?? "");
        draftPhotoUrls = parsed;
        // Si hay una sola URL, también en campo manual para editar fácil
        draftPhotoUrlManual = parsed.length === 1 ? parsed[0] : "";
        draftCategoryId = String(product.categoryId || "").trim();
        draftStatus = product.status === "inactive" ? "inactive" : "active";
        reservedReadOnly = product.reserved ?? 0;
        editExistenceReadOnly = product.existence;
        draftExistence = 0;
        formTried = false;
        formSaving = false;
        imagePending = false;
        imageKey += 1;
        logger.info(
            `[ProductMgmt] edit id=${product.id} cat=${draftCategoryId} price=${draftPrice} photos=${parsed.length}`,
        );
    }

    async function saveEdit(): Promise<void> {
        if (!editId) return;
        formTried = true;
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            toastStore.error(disabledHint || "Revisa los campos del formulario.", 4000);
            return;
        }
        const old = $productStore.items.find((p) => p.id === editId);
        if (!old) {
            toastStore.error("Producto no encontrado en la lista. Sincroniza e intenta de nuevo.", 4000);
            return;
        }
        const nextExistence = old.existence;
        formSaving = true;
        try {
            toastStore.info("Guardando cambios…", 2500);
            const photoUrl = serializeProductImages(mergedPhotoUrls());
            logger.info(
                `[ProductMgmt] saveEdit id=${editId} descLen=${draftDescription.trim().length} photo=${photoUrl ? "yes" : "no"}`,
            );
            await productStore.updateCatalog({
                ...old,
                name: draftName.trim(),
                description: draftDescription.trim(),
                existence: nextExistence,
                reserved: old.reserved ?? 0,
                price: Number(draftPrice),
                photoUrl,
                categoryId: String(draftCategoryId).trim(),
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
        (category) => category.status === "active" || category.id === draftCategoryId,
    );
    /** Categoría del producto en edición aunque no esté en la lista cargada */
    $: orphanCategory =
        draftCategoryId && !availableCategories.some((c) => c.id === draftCategoryId)
            ? draftCategoryId
            : "";
    $: now = Date.now();
    $: activePromotionProductIds = new Set(
        $promotionStore.items
            .filter((promo) => promo.validFromEpochMillis <= now && promo.validUntilEpochMillis >= now)
            .map((promo) => promo.productId)
            .filter(Boolean) as string[],
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
                    Edita aquí descripción, foto (URL), precio y categoría de productos ya creados.
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
                            {disabledHint || "Corrige los campos señalados para continuar."}
                        </div>
                    {:else if !canSubmit && editId && disabledHint}
                        <div class="form-banner soft" role="status">
                            Guardar deshabilitado: {disabledHint}
                        </div>
                    {/if}

                    <div class="form-grid">
                        <label class="mgmt-field" class:invalid={!!fieldErrors.name}>
                            <span>Nombre <em class="req" aria-hidden="true">*</em></span>
                            <input
                                class="mgmt-input"
                                bind:value={draftName}
                                aria-invalid={fieldErrors.name ? "true" : undefined}
                                maxlength="120"
                                autocomplete="off"
                            />
                            {#if fieldErrors.name}
                                <span class="field-error">{fieldErrors.name}</span>
                            {/if}
                        </label>

                        <label class="mgmt-field">
                            <span>Descripción</span>
                            <textarea
                                class="mgmt-input mgmt-textarea"
                                bind:value={draftDescription}
                                maxlength="2000"
                                rows="3"
                                placeholder="Detalle del producto (editable tras la factura)"
                            ></textarea>
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
                            />
                            {#if fieldErrors.price}
                                <span class="field-error">{fieldErrors.price}</span>
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
                                    El stock no se edita aquí. Usa <strong>Factura de entrada</strong> para sumar existencia.
                                </p>
                            </div>
                        {:else}
                            <p class="mgmt-hint">
                                Alta de catálogo con <strong>existencia 0</strong>. Para stock usa
                                <strong>Factura de entrada</strong>.
                            </p>
                        {/if}

                        <label class="mgmt-field" class:invalid={!!fieldErrors.categoryId}>
                            <span>Categoría <em class="req" aria-hidden="true">*</em></span>
                            <select
                                class="mgmt-select"
                                bind:value={draftCategoryId}
                                aria-invalid={fieldErrors.categoryId ? "true" : undefined}
                            >
                                <option value="">Seleccione…</option>
                                {#if orphanCategory}
                                    <option value={orphanCategory}>Categoría actual ({orphanCategory.slice(0, 8)}…)</option>
                                {/if}
                                {#each availableCategories as category}
                                    <option value={category.id}>{category.name}</option>
                                {/each}
                            </select>
                            {#if fieldErrors.categoryId}
                                <span class="field-error">{fieldErrors.categoryId}</span>
                            {/if}
                        </label>

                        <label class="mgmt-field">
                            <span>Estado</span>
                            <select class="mgmt-select" bind:value={draftStatus}>
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </label>

                        <label class="mgmt-field" class:invalid={!!fieldErrors.photoUrl}>
                            <span>Foto URL (https)</span>
                            <input
                                class="mgmt-input"
                                type="url"
                                bind:value={draftPhotoUrlManual}
                                placeholder="https://… (sin storage Appwrite por ahora)"
                                autocomplete="off"
                            />
                            {#if fieldErrors.photoUrl}
                                <span class="field-error">{fieldErrors.photoUrl}</span>
                            {/if}
                            <span class="mgmt-hint">
                                R2 aún no migrado: pega una URL pública. Subida local usa Appwrite y puede fallar (402).
                            </span>
                        </label>
                    </div>

                    <div class="product-images-field" class:invalid={!!fieldErrors.images}>
                        {#key imageKey}
                            <MultiImagePicker
                                label="Imágenes (opcional / legacy)"
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
                            <button
                                class="mgmt-btn primary"
                                type="submit"
                                disabled={!canSubmit}
                                title={canSubmit ? "Guardar cambios" : disabledHint}
                            >
                                <Icon icon={Save} size={18} ariaLabel="Guardar" />
                                {formSaving ? "Guardando…" : "Guardar"}
                            </button>
                        {:else}
                            <button
                                class="mgmt-btn primary"
                                type="submit"
                                disabled={!canSubmit}
                                title={canSubmit ? "Crear" : disabledHint}
                            >
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
                                    <div class="mgmt-row-meta">
                                        <strong>{product.name}</strong>
                                        <span class="mgmt-muted">
                                            <CategoryName categoryId={product.categoryId} />
                                            · ${product.price}
                                            · disp. {available}
                                            {#if activePromotionProductIds.has(product.id)}
                                                · promo
                                            {/if}
                                        </span>
                                        {#if product.description}
                                            <span class="mgmt-muted desc-preview">{product.description}</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="mgmt-row-actions">
                                    <button
                                        class="mgmt-btn ghost"
                                        type="button"
                                        on:click={() => startEdit(product)}
                                        aria-label="Editar"
                                    >
                                        <Icon icon={Pencil} size={16} ariaLabel="Editar" />
                                    </button>
                                    <button
                                        class="mgmt-btn ghost danger"
                                        type="button"
                                        on:click={() =>
                                            productStore
                                                .removeById(product.id)
                                                .then(() => toastStore.success("Producto eliminado"))
                                                .catch((e) =>
                                                    toastStore.error(
                                                        e instanceof Error ? e.message : "No se pudo eliminar",
                                                    ),
                                                )}
                                        aria-label="Eliminar"
                                    >
                                        <Icon icon={Trash2} size={16} ariaLabel="Eliminar" />
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>
        </div>
    </div>
</section>

<PurchaseInvoiceModal
    bind:open={invoiceOpen}
    products={items}
    categories={$categoryStore.items}
    onClose={() => {
        invoiceOpen = false;
        void productStore.syncAll().catch(() => {});
    }}
/>

<style>
    .mgmt-textarea {
        min-height: 4.5rem;
        resize: vertical;
        padding: 10px 12px;
        line-height: 1.4;
        font: inherit;
    }
    .form-banner.soft {
        background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 55%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-tertiary) 30%, transparent);
    }
    .desc-preview {
        display: block;
        max-width: 36ch;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.82rem;
    }
</style>
