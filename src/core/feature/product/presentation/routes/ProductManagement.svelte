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
    let formEpoch = 0;

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
        if (!t) return true;
        try {
            const u = new URL(t);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch {
            return false;
        }
    }

    function mergedPhotoUrls(): string[] {
        const fromPicker = draftPhotoUrls.filter((u) => typeof u === "string" && u.trim());
        const manual = String(draftPhotoUrlManual ?? "").trim();
        if (manual && !fromPicker.includes(manual)) return [...fromPicker, manual];
        return fromPicker;
    }

    function validateForm(): FieldErrors {
        const errors: FieldErrors = {};
        const name = String(draftName ?? "").trim();
        if (!name) errors.name = "El nombre es obligatorio.";
        else if (name.length < 2) errors.name = "Usa al menos 2 caracteres.";
        else if (name.length > 120) errors.name = "Máximo 120 caracteres.";

        const priceRaw = draftPrice;
        const price = Number(priceRaw);
        if (priceRaw === "" || priceRaw === null || priceRaw === undefined) errors.price = "Indica el precio de venta.";
        else if (!Number.isFinite(price)) errors.price = "El precio debe ser un número válido.";
        else if (price <= 0) errors.price = "El precio debe ser mayor que 0.";
        else if (price > 1_000_000_000) errors.price = "El precio es demasiado alto.";

        if (!String(draftCategoryId ?? "").trim()) errors.categoryId = "Selecciona una categoría.";
        if (imagePending) errors.images = "Hay imágenes locales pendientes. Súbelas, quítalas, o usa solo una URL https.";
        if (String(draftPhotoUrlManual ?? "").trim() && !isHttpUrl(String(draftPhotoUrlManual))) {
            errors.photoUrl = "La URL de foto debe ser http(s)://…";
        }
        return errors;
    }

    $: _deps = [draftName, draftDescription, draftPrice, draftCategoryId, draftStatus, draftPhotoUrlManual, imagePending, formSaving, editId, formEpoch];
    $: fieldErrors = formTried ? validateForm() : ({} as FieldErrors);
    $: validationNow = (_deps, validateForm());
    $: hasErrors = Object.keys(validationNow).length > 0;
    $: canSubmit = !hasErrors && !imagePending && !formSaving;
    $: disabledHint = (() => {
        if (formSaving) return "Guardando…";
        if (imagePending) return "Imágenes locales pendientes de subir o quitar.";
        const e = validationNow;
        if (e.name) {
            const raw = String(draftName ?? "");
            return raw.trim() ? e.name : `El nombre es obligatorio (interno vacío). Escribe o re-abre con el lápiz.`;
        }
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
            if (body.productIds?.length) void productStore.handleStockChanged(body.productIds);
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
        imagePending = false;
        imageKey += 1;
        formEpoch += 1;
    }

    async function create() {
        formTried = true;
        if (Object.keys(validateForm()).length > 0) {
            toastStore.error(disabledHint || "Revisa el formulario.", 4000);
            return;
        }
        formSaving = true;
        try {
            await productStore.create({
                id: `p-${Math.random().toString(36).slice(2, 8)}`,
                name: String(draftName).trim(),
                description: String(draftDescription).trim(),
                existence: 0,
                reserved: 0,
                price: Number(draftPrice),
                photoUrl: serializeProductImages(mergedPhotoUrls()),
                categoryId: String(draftCategoryId).trim(),
                status: draftStatus,
            });
            toastStore.success("Producto creado (stock 0). Usa Factura de entrada para mercancía.", 5000);
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear.", 5000);
            formSaving = false;
        }
    }

    function startEdit(product: Product): void {
        const name = String(product?.name ?? "").trim();
        const desc = String(product?.description ?? "");
        const cat = String(product?.categoryId ?? "").trim();
        const priceNum = Number(product?.price);
        const price = Number.isFinite(priceNum) ? priceNum : 0;
        const parsed = parseProductImages(String(product?.photoUrl ?? ""));

        formEpoch += 1;
        editId = String(product.id);
        draftName = name;
        draftDescription = desc;
        draftPrice = price;
        draftPhotoUrls = parsed;
        draftPhotoUrlManual = parsed.length === 1 ? parsed[0] : "";
        draftCategoryId = cat;
        draftStatus = product.status === "inactive" ? "inactive" : "active";
        reservedReadOnly = Number(product.reserved) || 0;
        editExistenceReadOnly = Number(product.existence) || 0;
        draftExistence = 0;
        formTried = false;
        formSaving = false;
        imagePending = false;
        imageKey += 1;

        logger.info(`[ProductMgmt] edit id=${editId} name="${name}" cat=${cat} price=${price} epoch=${formEpoch}`);

        void Promise.resolve().then(() => {
            if (editId !== String(product.id)) return;
            if (!String(draftName ?? "").trim() && name) {
                draftName = name;
                logger.warn(`[ProductMgmt] re-applied name: "${name}"`);
            }
            if (!String(draftCategoryId ?? "").trim() && cat) draftCategoryId = cat;
            if (!(Number(draftPrice) > 0) && price > 0) draftPrice = price;
        });
    }

    async function saveEdit(): Promise<void> {
        if (!editId) return;
        formTried = true;
        if (Object.keys(validateForm()).length > 0) {
            toastStore.error(disabledHint || "Revisa el formulario.", 4000);
            return;
        }
        const old = $productStore.items.find((p) => p.id === editId);
        if (!old) {
            toastStore.error("Producto no encontrado. Sincroniza e intenta de nuevo.", 4000);
            return;
        }
        formSaving = true;
        try {
            const photoUrl = serializeProductImages(mergedPhotoUrls());
            await productStore.updateCatalog({
                ...old,
                name: String(draftName).trim(),
                description: String(draftDescription).trim(),
                existence: old.existence,
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
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar.", 5000);
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
                      (p.name || "").toLowerCase().includes(q) ||
                      (p.description || "").toLowerCase().includes(q) ||
                      (p.id || "").toLowerCase().includes(q)
                  );
              });
    $: availableCategories = $categoryStore.items.filter(
        (c) => c.status === "active" || c.id === draftCategoryId,
    );
    $: orphanCategory =
        draftCategoryId && !availableCategories.some((c) => c.id === draftCategoryId) ? draftCategoryId : "";
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
                    Stock solo vía factura. Aquí editas descripción, foto URL, precio y categoría.
                </p>
            </div>
            <div class="mgmt-chip-row">
                <button class="mgmt-btn primary" type="button" on:click={() => (invoiceOpen = true)}>
                    <Icon icon={FilePlus2} size={18} ariaLabel="Factura" />
                    Factura de entrada
                </button>
                {#if isRefreshing}
                    <span class="mgmt-chip">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando…
                    </span>
                {/if}
            </div>
        </header>

        <div class="products-workspace">
            <aside class="product-form-panel">
                <form class="product-form" novalidate on:submit|preventDefault={() => (editId ? saveEdit() : create())}>
                    <h2 class="form-title">{editId ? "Editar producto" : "Nuevo producto (catálogo)"}</h2>

                    {#if formTried && hasErrors}
                        <div class="form-banner" role="alert">{disabledHint || "Corrige los campos."}</div>
                    {:else if !canSubmit && editId && disabledHint}
                        <div class="form-banner soft" role="status">Guardar deshabilitado: {disabledHint}</div>
                    {/if}

                    {#key formEpoch}
                    <div class="form-grid">
                        <label class="mgmt-field" class:invalid={!!fieldErrors.name}>
                            <span>Nombre <em class="req">*</em></span>
                            <input class="mgmt-input" bind:value={draftName} maxlength="120" autocomplete="off" />
                            {#if fieldErrors.name}<span class="field-error">{fieldErrors.name}</span>{/if}
                        </label>

                        <label class="mgmt-field">
                            <span>Descripción</span>
                            <textarea class="mgmt-input mgmt-textarea" bind:value={draftDescription} maxlength="2000" rows="3" placeholder="Detalle (editable tras factura)"></textarea>
                        </label>

                        <label class="mgmt-field" class:invalid={!!fieldErrors.price}>
                            <span>Precio de venta <em class="req">*</em></span>
                            <input class="mgmt-input" type="number" min="0.01" step="0.01" bind:value={draftPrice} />
                            {#if fieldErrors.price}<span class="field-error">{fieldErrors.price}</span>{/if}
                        </label>

                        {#if editId}
                            <div class="stock-readonly">
                                <div class="stock-readonly-title">Stock actual (solo lectura)</div>
                                <div class="stock-chips">
                                    <span class="stock-chip">Existencia <strong>{editExistenceReadOnly}</strong></span>
                                    <span class="stock-chip">Reservado <strong>{reservedReadOnly}</strong></span>
                                    <span class="stock-chip accent">Disponible <strong>{editAvailablePreview}</strong></span>
                                </div>
                                <p class="mgmt-hint">Stock solo con <strong>Factura de entrada</strong>.</p>
                            </div>
                        {:else}
                            <p class="mgmt-hint">Alta con existencia 0. Stock con <strong>Factura de entrada</strong>.</p>
                        {/if}

                        <label class="mgmt-field" class:invalid={!!fieldErrors.categoryId}>
                            <span>Categoría <em class="req">*</em></span>
                            <select class="mgmt-select" bind:value={draftCategoryId}>
                                <option value="">Seleccione…</option>
                                {#if orphanCategory}
                                    <option value={orphanCategory}>Categoría actual ({orphanCategory.slice(0, 8)}…)</option>
                                {/if}
                                {#each availableCategories as category}
                                    <option value={category.id}>{category.name}</option>
                                {/each}
                            </select>
                            {#if fieldErrors.categoryId}<span class="field-error">{fieldErrors.categoryId}</span>{/if}
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
                            <input class="mgmt-input" type="url" bind:value={draftPhotoUrlManual} placeholder="https://…" autocomplete="off" />
                            {#if fieldErrors.photoUrl}<span class="field-error">{fieldErrors.photoUrl}</span>{/if}
                            <span class="mgmt-hint">R2 pendiente: pega URL pública. Subida local puede fallar (Appwrite 402).</span>
                        </label>
                    </div>
                    {/key}

                    <div class="product-images-field" class:invalid={!!fieldErrors.images}>
                        {#key imageKey}
                            <MultiImagePicker label="Imágenes (opcional)" bind:values={draftPhotoUrls} bind:pending={imagePending} />
                        {/key}
                        {#if fieldErrors.images}<span class="field-error">{fieldErrors.images}</span>{/if}
                    </div>

                    <div class="form-actions">
                        {#if editId}
                            <button class="mgmt-btn ghost" type="button" on:click={resetForm} disabled={formSaving}>Cancelar</button>
                            <button class="mgmt-btn primary" type="submit" disabled={!canSubmit} title={canSubmit ? "Guardar" : disabledHint}>
                                <Icon icon={Save} size={18} ariaLabel="Guardar" />
                                {formSaving ? "Guardando…" : "Guardar"}
                            </button>
                        {:else}
                            <button class="mgmt-btn primary" type="submit" disabled={!canSubmit} title={canSubmit ? "Crear" : disabledHint}>
                                <Icon icon={Plus} size={18} ariaLabel="Crear" />
                                {formSaving ? "Creando…" : "Crear en catálogo"}
                            </button>
                        {/if}
                    </div>
                </form>
            </aside>

            <section class="product-list-panel mgmt-card">
                <div class="list-panel-head">
                    <h2 class="list-title">Productos en catálogo</h2>
                    <label class="filter-field search">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input type="search" placeholder="Buscar…" bind:value={query} />
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
                                        <img class="thumb" src={getPrimaryProductImage(product.photoUrl ?? "")} alt="" />
                                    {:else}
                                        <div class="thumb placeholder" aria-hidden="true">
                                            <Icon icon={BadgeDollarSign} size={18} ariaLabel="" />
                                        </div>
                                    {/if}
                                    <div class="mgmt-row-meta">
                                        <strong>{product.name}</strong>
                                        <span class="mgmt-muted">
                                            <CategoryName categoryId={product.categoryId} />
                                            · ${product.price} · disp. {available}
                                            {#if activePromotionProductIds.has(product.id)} · promo{/if}
                                        </span>
                                        {#if product.description}
                                            <span class="mgmt-muted desc-preview">{product.description}</span>
                                        {/if}
                                    </div>
                                </div>
                                <div class="mgmt-row-actions">
                                    <button class="mgmt-btn ghost" type="button" on:click={() => startEdit(product)} aria-label="Editar">
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
                                                    toastStore.error(e instanceof Error ? e.message : "No se pudo eliminar"),
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
    .product-list-panel { min-width: 0; }
    .list-panel-head {
        display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
        gap: 10px; margin-bottom: 12px;
    }
    .list-title, .form-title { margin: 0; font-size: 0.95rem; font-weight: 750; }
    .form-title { margin-bottom: 10px; }
    .form-banner {
        margin: 0 0 12px; padding: 8px 10px; border-radius: 8px; font-size: 0.82rem; font-weight: 650;
        color: #fecaca; background: color-mix(in srgb, #ef4444 14%, transparent);
        border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
    }
    .form-banner.soft {
        background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 55%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-tertiary) 30%, transparent);
        color: var(--md-sys-color-on-surface);
    }
    .form-grid { display: grid; gap: 10px; }
    .form-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .product-form { margin: 0; padding: 0; border: 0; }
    .product-images-field { margin-top: 10px; }
    .field-error { display: block; margin-top: 4px; font-size: 0.75rem; font-weight: 650; color: #fca5a5; }
    .req { color: #f87171; font-style: normal; font-weight: 800; }
    .filter-field.search {
        display: flex; align-items: center; gap: 8px;
        border: 1px solid var(--md-sys-color-outline-variant); border-radius: 10px;
        padding: 0 12px; flex: 1 1 200px; max-width: 320px; margin-left: auto;
    }
    .filter-field.search input {
        width: 100%; height: 40px; border: 0; outline: 0; background: transparent; color: inherit; font: inherit;
    }
    .stock-readonly-title { font-size: 0.78rem; font-weight: 700; margin-bottom: 6px; color: var(--md-sys-color-on-surface-variant); }
    .stock-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .stock-chip {
        font-size: 0.78rem; padding: 4px 8px; border-radius: 8px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 20%, transparent);
    }
    .stock-chip.accent {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        color: var(--md-sys-color-primary);
    }
    .thumb { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
    .thumb.placeholder {
        display: grid; place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent);
        color: var(--md-sys-color-on-surface-variant);
    }
    .mgmt-row-left { display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
    .mgmt-row-meta { display: grid; gap: 2px; min-width: 0; }
    .desc-preview {
        display: block; max-width: 36ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem;
    }
    .mgmt-textarea {
        min-height: 4.5rem; resize: vertical; padding: 10px 12px; line-height: 1.4; font: inherit;
        width: 100%; box-sizing: border-box; border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px; color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }
    @media (max-width: 960px) {
        .products-workspace { grid-template-columns: 1fr; }
        .product-form-panel { position: static; max-height: none; }
        .filter-field.search { max-width: none; margin-left: 0; width: 100%; }
        .list-panel-head { flex-direction: column; align-items: stretch; }
    }
</style>
