<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import ImagePicker from "../../../../infrastructure/presentation/components/ImagePicker.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import type { Product } from "../../domain/entity/Product";
    import CategoryName from "../../../category/presentation/component/CategoryName.svelte";
    import { categoryStore } from "../../../category/presentation/viewmodel/category.store";
    import { promotionStore } from "../../../notification/presentation/viewmodel/promotion.store";
    import { productStore } from "../viewmodel/product.store";
    import { BadgeDollarSign, Pencil, Plus, Save, Search, Trash2, X } from "lucide-svelte";

    let draftName = "";
    let draftDescription = "";
    let draftPrice: number | string = 0;
    let draftPhotoUrl = "";
    let draftCategoryId = "";
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
        draftPhotoUrl = "";
        draftCategoryId = "";
        imageKey += 1;
    }

    async function create() {
        if (!draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;

        const data: Product = {
            id: `p-${Math.random().toString(36).slice(2, 8)}`,
            name: draftName.trim(),
            description: draftDescription.trim(),
            price: Number(draftPrice),
            photoUrl: draftPhotoUrl.trim() || "https://picsum.photos/600",
            categoryId: draftCategoryId
        };

        try {
            toastStore.info("Creando producto…");
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
        draftPhotoUrl = product.photoUrl;
        draftCategoryId = product.categoryId;
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
                    title: `Promo por baja de precio: ${old.name}`,
                    message: `Descuento del ${discountPercent}%`,
                    imageUrl: old.photoUrl,
                    oldPrice: old.price,
                    currentPrice: Number(draftPrice),
                    validFromEpochMillis: now,
                    validUntilEpochMillis: now + 1000 * 60 * 60 * 24 * 30
                });
            } catch (e: any) {
                logger.warn(`No se pudo crear la promoción automática: ${e?.message ?? "desconocido"}`);
            }
        }

        try {
            toastStore.info("Guardando cambios…");
            await productStore.updatePrice(
                {
                    ...old,
                    name: draftName.trim(),
                    description: draftDescription.trim(),
                    photoUrl: draftPhotoUrl.trim() || old.photoUrl,
                    categoryId: draftCategoryId
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
            </div>
        </div>
    </header>

    <div class="mgmt-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Formulario">
            <h2 class="mgmt-card-title">{editId ? "Editar producto" : "Nuevo producto"}</h2>

            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Nombre</span>
                    <input class="mgmt-input" placeholder="Ej. EcoFlow Delta…" bind:value={draftName} />
                </label>

                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Descripción</span>
                    <textarea class="mgmt-input mgmt-area" placeholder="Opcional" bind:value={draftDescription}></textarea>
                </label>

                <label class="mgmt-field">
                    <span>Precio</span>
                    <input class="mgmt-input" type="number" bind:value={draftPrice} min="0" step="0.01" />
                </label>

                <label class="mgmt-field">
                    <span>Categoría</span>
                    <select class="mgmt-select" bind:value={draftCategoryId}>
                        <option value="" disabled>Selecciona…</option>
                        {#each $categoryStore.items as category (category.id)}
                            <option value={category.id}>{category.name}</option>
                        {/each}
                    </select>
                </label>

                <div style="grid-column:1/-1">
                    {#key imageKey}
                        <ImagePicker
                            label="Imagen del producto"
                            bind:value={draftPhotoUrl}
                            bind:pending={imagePending}
                        />
                    {/key}
                </div>

                <div class="mgmt-actions" style="grid-column:1/-1">
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
                {#if filtered.length === 0}
                    <div class="mgmt-muted">No hay resultados.</div>
                {/if}

                {#each filtered as product (product.id)}
                    <article class="mgmt-row" aria-label={product.name}>
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            <img class="mgmt-avatar" src={product.photoUrl} alt="" aria-hidden="true" />

                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">{product.name}</div>
                                <p class="mgmt-row-sub">
                                    <CategoryName categoryId={product.categoryId} /> · ${product.price.toFixed(2)}
                                </p>
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
        </section>
    </div>
</section>
