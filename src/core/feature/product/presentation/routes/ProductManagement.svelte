<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import MultiImagePicker from "../components/MultiImagePicker.svelte";
    import { getPrimaryProductImage } from "../../domain/entity/Product";
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
    import { BadgeDollarSign, Pencil, Plus, Save, Search, Trash2, X } from "lucide-svelte";

    let draftName = "";
    let draftDescription = "";
    let draftPrice: number | string = 0;
    let draftPhotoUrls: string[] = [];
    let draftCategoryId = "";
    let draftStatus: ProductStatus = "active";
    let editId: string | null = null;
    let query = "";
    let imagePending = false;
    let imageKey = 0;

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
        imageKey += 1;
    }

    function getProductImageUrl(product: Product): string | undefined {
        return parseProductImages(product.photoUrl)[0];
    }

    async function create() {
        if (!draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;

        const data: Product = {
            id: `p-${Math.random().toString(36).slice(2, 8)}`,
            name: draftName.trim(),
            description: draftDescription.trim(),
            price: Number(draftPrice),
            photoUrl: serializeProductImages(draftPhotoUrls),
            categoryId: draftCategoryId,
            status: draftStatus
        };

        try {
            toastStore.info("Creando producto...");
            await productStore.create(data);
            toastStore.success("Producto creado.");
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el producto.");
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
    }

    async function save() {
        if (!editId || !draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;

        const old = $productStore.items.find((p) => p.id === editId);
        if (!old) return;

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
            toastStore.info("Guardando cambios...");
            await productStore.updatePrice(
                {
                    ...old,
                    name: draftName.trim(),
                    description: draftDescription.trim(),
                    photoUrl: serializeProductImages(draftPhotoUrls),
                    categoryId: draftCategoryId,
                    status: draftStatus
                },
                Number(draftPrice)
            );
            toastStore.success("Producto actualizado.");
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar el producto.");
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
</script>

<section class="mgmt-page" aria-label="Gestión de productos">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Productos</h1>
                <p class="mgmt-subtitle">
                    Si un precio baja, el sistema crea una promoción automática con el porcentaje de descuento.
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

                    <input
                            class="mgmt-input"
                            bind:value={draftName}
                            placeholder="Ej. Batería AGM 12V 9Ah"
                    />
                </label>
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Descripción</span>

                    <textarea
                            class="mgmt-input mgmt-area"
                            bind:value={draftDescription}
                            placeholder="Descripción del producto"/>
                    <label class="mgmt-field">
                        <span>Precio</span>

                        <input
                                class="mgmt-input"
                                type="number"
                                min="0"
                                step="0.01"
                                bind:value={draftPrice}
                        />
                    </label>
                    <label class="mgmt-field">
                        <span>Categoría</span>

                        <select
                                class="mgmt-select"
                                bind:value={draftCategoryId}
                        >
                            <option value="">Seleccione...</option>

                            {#each availableCategories as category}
                                <option value={category.id}>
                                    {category.name}
                                </option>
                            {/each}
                        </select>
                    </label>
                    <label class="mgmt-field">
                        <span>Estado</span>

                        <select
                                class="mgmt-select"
                                bind:value={draftStatus}
                        >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                        </select>
                    </label>
                </label>
            </div>
            <div class="product-images-field" style="grid-column:1/-1; margin-top: 10px;">
                {#key imageKey}
                    <MultiImagePicker
                            label="Imágenes del producto"
                            bind:values={draftPhotoUrls}
                            bind:pending={imagePending}
                    />
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
                    <span class="mgmt-muted" style="display:none">Buscar</span>
                    <div style="display:flex; gap:10px; align-items:center">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input
                            class="mgmt-input"
                            type="search"
                            placeholder="Buscar productos..."
                            aria-label="Buscar productos"
                            bind:value={query}
                        />
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
                                {#if activePromotionProductIds.has(product.id)}
                                    <p class="mgmt-row-sub">Promoción activa</p>
                                {/if}
                            </div>
                        </div>

                        <div class="mgmt-row-actions">
                            <button class="mgmt-btn ghost" on:click={() => startEdit(product)}>
                                <Icon icon={Pencil} size={18} ariaLabel="Editar" />
                                Editar
                            </button>
                            <button class="mgmt-btn danger" on:click={() => productStore.removeById(product.id)}>
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
                <span class="mgmt-pagination-info">
                    Página {$productStore.page} de {Math.max(1, Math.ceil($productStore.total / $productStore.pageSize))} ({$productStore.total} productos)
                </span>
                <button
                    class="mgmt-btn ghost"
                    disabled={$productStore.page * $productStore.pageSize >= $productStore.total || $productStore.loading}
                    on:click={() => productStore.nextPage()}
                >
                    Siguiente
                </button>
            </div>
        </section>
    </div>
</section>

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
</style>





