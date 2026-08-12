<script lang="ts">
    import { onMount } from "svelte";
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
    import { parseProductImages, serializeProductImages } from "../util/product.image";
    import { BadgeDollarSign, PackagePlus, Pencil, Plus, Save, Search, Trash2, X } from "lucide-svelte";

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

    let entryOpen = false;
    let entryProduct: Product | null = null;
    let entryQty: number | string = "";
    let entrySubmitting = false;

    onMount(() => {
        productStore.syncAll().catch(() => {});
        categoryStore.syncAll().catch(() => {});
        promotionStore.syncAll().catch(() => {});
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
        imageKey += 1;
    }

    function openEntry(product: Product): void {
        entryProduct = product;
        entryQty = "";
        entryOpen = true;
    }

    function closeEntry(force = false): void {
        if (entrySubmitting && !force) return;
        entryOpen = false;
        entryProduct = null;
        entryQty = "";
        entrySubmitting = false;
    }

    async function confirmEntry(): Promise<void> {
        if (!entryProduct) return;
        const qty = Math.floor(Number(entryQty) || 0);
        if (qty <= 0) {
            toastStore.error("Indica una cantidad mayor que 0.", 4000);
            return;
        }
        const productName = entryProduct.name || entryProduct.id;
        const before = entryProduct.existence;
        entrySubmitting = true;
        toastStore.info(`Registrando entrada de +${qty} en «${productName}»…`, 3500);
        try {
            const updated = await productStore.registerStockEntry(entryProduct.id, qty);
            const after = updated?.existence ?? before + qty;
            const avail =
                typeof availableStock === "function" && updated
                    ? availableStock(updated)
                    : Math.max(0, after - (updated?.reserved ?? 0));
            if (editId === updated.id) {
                editExistenceReadOnly = updated.existence;
                reservedReadOnly = updated.reserved ?? 0;
            }
            closeEntry(true);
            toastStore.success(
                `Entrada registrada: +${qty} en «${productName}». Existencia ${before} → ${after} (disp. ${avail}).`,
                5500
            );
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(
                e instanceof Error ? e.message : "No se pudo registrar la entrada de stock.",
                6000
            );
            entrySubmitting = false;
        }
    }

    async function create() {
        if (!draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;
        const data: Product = {
            id: `p-${Math.random().toString(36).slice(2, 8)}`,
            name: draftName.trim(),
            description: draftDescription.trim(),
            existence: Math.max(0, Math.floor(Number(draftExistence) || 0)),
            reserved: 0,
            price: Number(draftPrice),
            photoUrl: serializeProductImages(draftPhotoUrls),
            categoryId: draftCategoryId,
            status: draftStatus
        };
        try {
            toastStore.info("Creando producto...", 3000);
            await productStore.create(data);
            toastStore.success("Producto creado correctamente.", 4500);
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el producto.", 5000);
        }
    }

    function startEdit(product: Product): void {
        imageKey += 1;
        editId = product.id;
        draftName = product.name;
        draftDescription = product.description;
        draftPrice = product.price;
        draftPhotoUrls = parseProductImages(product.photoUrl);
        draftCategoryId = product.categoryId;
        draftStatus = product.status;
        editExistenceReadOnly = product.existence;
        reservedReadOnly = product.reserved ?? 0;
        draftExistence = 0;
    }

    async function save() {
        if (!editId || !draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;
        const old = $productStore.items.find((p) => p.id === editId);
        if (!old) return;
        const nextExistence = old.existence;
        if (Number(draftPrice) < old.price) {
            const discountPercent = Math.round(((old.price - Number(draftPrice)) / old.price) * 100);
            const now = Date.now();
            try {
                await promotionStore.create({
                    id: "",
                    productId: old.id,
                    title: `Promo por baja de precio: ${old.name}`,
                    message: `Descuento del ${discountPercent}%`,
                    imageUrl: getPrimaryProductImage(old.photoUrl),
                    oldPrice: old.price,
                    currentPrice: Number(draftPrice),
                    validFromEpochMillis: now,
                    validUntilEpochMillis: now + 1000 * 60 * 60 * 24 * 30,
                    source: "automatic"
                });
            } catch (e: any) {
                logger.warn(`No se pudo crear la promoción automática: ${e?.message ?? "desconocido"}`);
            }
        }
        try {
            toastStore.info("Guardando cambios...", 2500);
            await productStore.updateCatalog({
                ...old,
                name: draftName.trim(),
                description: draftDescription.trim(),
                existence: nextExistence,
                reserved: old.reserved ?? 0,
                price: Number(draftPrice),
                photoUrl: serializeProductImages(draftPhotoUrls),
                categoryId: draftCategoryId,
                status: draftStatus
            });
            toastStore.success("Producto actualizado.", 4000);
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar el producto.", 5000);
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
    $: canSubmit =
        draftName.trim().length > 0 && draftCategoryId.length > 0 && Number(draftPrice) > 0 && !imagePending;
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
    $: entryQtyNum = Math.floor(Number(entryQty) || 0);
    $: canAddEntry = entryQtyNum > 0 && !entrySubmitting;
</script>

<section class="mgmt-page" aria-label="Gestión de productos">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Productos</h1>
                <p class="mgmt-subtitle">
                    Stock: available = existence − reserved. Entradas con «Dar entrada» (delta).
                </p>
            </div>
            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={BadgeDollarSign} size={18} ariaLabel="Total" />
                    {filtered.length} / {items.length}
                </span>
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando...
                    </span>
                {/if}
            </div>
        </div>
    </header>

    <div class="mgmt-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Formulario">
            <h2 class="mgmt-card-title">{editId ? "Editar producto" : "Nuevo producto"}</h2>
            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Nombre</span>
                    <input class="mgmt-input" bind:value={draftName} placeholder="Ej. Batería AGM 12V 9Ah" />
                </label>
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Descripción</span>
                    <textarea class="mgmt-input mgmt-area" bind:value={draftDescription} placeholder="Descripción del producto"></textarea>
                </label>
                <label class="mgmt-field">
                    <span>Precio</span>
                    <input class="mgmt-input" type="number" min="0" step="0.01" bind:value={draftPrice} />
                </label>
                {#if editId}
                    <div class="stock-readonly" style="grid-column:1/-1">
                        <div class="stock-readonly-title">Stock actual (solo lectura)</div>
                        <div class="stock-chips">
                            <span class="stock-chip">Existencia <strong>{editExistenceReadOnly}</strong></span>
                            <span class="stock-chip">Reservado <strong>{reservedReadOnly}</strong></span>
                            <span class="stock-chip accent">Disponible <strong>{editAvailablePreview}</strong></span>
                        </div>
                        <p class="mgmt-hint">Usa «Dar entrada» en el listado para sumar stock.</p>
                    </div>
                {:else}
                    <label class="mgmt-field">
                        <span>Stock inicial (existencia)</span>
                        <input class="mgmt-input" type="number" min="0" step="1" bind:value={draftExistence} />
                    </label>
                    <p class="mgmt-hint" style="grid-column:1/-1">Al crear, reserved = 0. Luego usa «Dar entrada».</p>
                {/if}
                <label class="mgmt-field">
                    <span>Categoría</span>
                    <select class="mgmt-select" bind:value={draftCategoryId}>
                        <option value="">Seleccione...</option>
                        {#each availableCategories as category}
                            <option value={category.id}>{category.name}</option>
                        {/each}
                    </select>
                </label>
                <label class="mgmt-field">
                    <span>Estado</span>
                    <select class="mgmt-select" bind:value={draftStatus}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                    </select>
                </label>
            </div>
            <div class="product-images-field" style="grid-column:1/-1; margin-top: 10px;">
                {#key imageKey}
                    <MultiImagePicker label="Imágenes del producto" bind:values={draftPhotoUrls} bind:pending={imagePending} />
                {/key}
                <div class="mgmt-actions" style="grid-column:1/-1; margin-top: 15px;">
                    {#if editId}
                        <button class="mgmt-btn primary" on:click={save} disabled={!canSubmit}>
                            <Icon icon={Save} size={18} ariaLabel="Guardar cambios" />
                            Guardar
                        </button>
                        <button class="mgmt-btn ghost" on:click={resetForm}>
                            <Icon icon={X} size={18} ariaLabel="Cancelar" />
                            Cancelar
                        </button>
                    {:else}
                        <button class="mgmt-btn primary" on:click={create} disabled={!canSubmit}>
                            <Icon icon={Plus} size={18} ariaLabel="Crear producto" />
                            Crear
                        </button>
                    {/if}
                </div>
            </div>
        </section>

        <section class="mgmt-card" aria-label="Listado">
            <div class="mgmt-toolbar" style="margin-bottom:12px">
                <h2 class="mgmt-card-title" style="margin:0">Listado</h2>
                <label class="mgmt-field" style="min-width:min(420px,100%); margin:0">
                    <div style="display:flex; gap:10px; align-items:center">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input class="mgmt-input" type="search" placeholder="Buscar productos..." aria-label="Buscar productos" bind:value={query} />
                    </div>
                </label>
            </div>

            <div class="mgmt-list">
                {#if isInitialLoading}
                    <SkeletonList rows={7} />
                {:else if filtered.length === 0}
                    <div class="mgmt-muted">No hay resultados.</div>
                {/if}

                {#each filtered as product (product.id)}
                    {@const primaryImage = getPrimaryProductImage(product.photoUrl)}
                    {@const available = availableStock(product)}
                    <article class="mgmt-row" aria-label={product.name}>
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            {#if primaryImage}
                                <img class="mgmt-avatar" src={primaryImage} alt="" aria-hidden="true" />
                            {:else}
                                <div class="mgmt-avatar" aria-hidden="true"></div>
                            {/if}
                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">{product.name}</div>
                                <p class="mgmt-row-sub">
                                    <CategoryName categoryId={product.categoryId} /> · ${product.price.toFixed(2)} · {product.status}
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
                            <button class="mgmt-btn primary" type="button" on:click={() => openEntry(product)}>
                                <Icon icon={PackagePlus} size={18} ariaLabel="Dar entrada" />
                                Dar entrada
                            </button>
                            <button class="mgmt-btn ghost" type="button" on:click={() => startEdit(product)}>
                                <Icon icon={Pencil} size={18} ariaLabel="Editar" />
                                Editar
                            </button>
                            <button class="mgmt-btn danger" type="button" on:click={() => productStore.removeById(product.id)}>
                                <Icon icon={Trash2} size={18} ariaLabel="Eliminar" />
                                Eliminar
                            </button>
                        </div>
                    </article>
                {/each}
            </div>

            <div class="mgmt-pagination">
                <button class="mgmt-btn ghost" disabled={$productStore.page <= 1 || $productStore.loading} on:click={() => productStore.prevPage()}>
                    Anterior
                </button>
                <span class="mgmt-pagination-info">
                    Página {$productStore.page} de {Math.max(1, Math.ceil($productStore.total / $productStore.pageSize))} ({$productStore.total} productos)
                </span>
                <button class="mgmt-btn ghost" disabled={$productStore.page * $productStore.pageSize >= $productStore.total || $productStore.loading} on:click={() => productStore.nextPage()}>
                    Siguiente
                </button>
            </div>
        </section>
    </div>
</section>

{#if entryOpen && entryProduct}
    <div class="entry-overlay" role="presentation" on:click|self={() => closeEntry()}>
        <div class="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="entry-title">
            <header class="entry-head">
                <div>
                    <h2 id="entry-title">Dar entrada</h2>
                    <p class="entry-name">{entryProduct.name}</p>
                </div>
                <button class="mgmt-btn ghost" type="button" on:click={() => closeEntry()} disabled={entrySubmitting} aria-label="Cerrar">
                    <Icon icon={X} size={18} ariaLabel="Cerrar" />
                </button>
            </header>
            <div class="entry-body">
                <p class="entry-stock-line">
                    Stock actual: <strong>{entryProduct.existence}</strong> existencia ·
                    <strong>{entryProduct.reserved ?? 0}</strong> reservado ·
                    <strong>{availableStock(entryProduct)}</strong> disponible
                </p>
                <label class="mgmt-field">
                    <span>Cantidad de productos que se agregarán al stock</span>
                    <input class="mgmt-input" type="number" min="1" step="1" inputmode="numeric" placeholder="Ej. 10" bind:value={entryQty} disabled={entrySubmitting} />
                </label>
                {#if canAddEntry}
                    <p class="entry-preview">
                        Resultado: existence {entryProduct.existence} → {entryProduct.existence + entryQtyNum}
                        (disponible → {Math.max(0, entryProduct.existence + entryQtyNum - (entryProduct.reserved ?? 0))})
                    </p>
                {/if}
            </div>
            <footer class="entry-actions">
                <button class="mgmt-btn ghost" type="button" on:click={() => closeEntry()} disabled={entrySubmitting}>Cancelar</button>
                <button class="mgmt-btn primary" type="button" on:click={confirmEntry} disabled={!canAddEntry}>
                    <Icon icon={PackagePlus} size={18} ariaLabel="Añadir" />
                    {entrySubmitting ? "Añadiendo…" : "Añadir"}
                </button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .mgmt-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
        gap: 10px;
        flex-wrap: wrap;
    }
    .mgmt-pagination-info {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--md-sys-color-on-surface-variant);
    }
    .mgmt-hint {
        margin: 6px 0 0;
        font-size: 0.85rem;
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.4;
    }
    .stock-readonly {
        display: grid;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 22%, transparent);
    }
    .stock-readonly-title {
        font-size: 0.8rem;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--md-sys-color-on-surface-variant);
    }
    .stock-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .stock-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 11px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        font-size: 0.84rem;
        color: var(--md-sys-color-on-surface);
    }
    .stock-chip.accent {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    }
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
    .entry-stock-line { margin: 0; font-size: 0.88rem; color: var(--md-sys-color-on-surface-variant); }
    .entry-preview {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        padding: 10px 12px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--md-sys-color-outline-variant));
    }
    .entry-actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 18px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    @media (max-width: 520px) {
        .entry-overlay { place-items: end center; padding: 0; }
        .entry-dialog { width: 100%; border-radius: 20px 20px 0 0; }
        .entry-actions { flex-direction: column-reverse; }
        .entry-actions .mgmt-btn { width: 100%; justify-content: center; }
    }
</style>
