<script lang="ts">
    import { onMount } from "svelte";
    import { productStore } from "../viewmodel/product.store";
    import type { Product } from "../../domain/entity/Product";
    import { categoryStore } from "../../../category/presentation/viewmodel/category.store";
    import { promotionStore } from "../../../notification/presentation/viewmodel/promotion.store";
    import {getCategoryNameById} from "../../../category/presentation/component/category.query";
    import CategoryName from "../../../category/presentation/component/CategoryName.svelte";

    let draftName = "";
    let draftDescription = "";
    let draftPrice = 0;
    let draftPhotoUrl = "";
    let draftCategoryId = "";
    let editId: string | null = null;

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

        await productStore.create(data);

        resetForm();
    }

    function startEdit(product: Product): void {
        editId = product.id;
        draftName = product.name;
        draftDescription = product.description;
        draftPrice = product.price;
        draftPhotoUrl = product.photoUrl;
        draftCategoryId = product.categoryId;
    }

    async function save(){
        if (!editId || !draftName.trim() || !draftCategoryId || Number(draftPrice) <= 0) return;

        const old = $productStore.items.find((p) => p.id === editId);

        if (!old) return;

        if (Number(draftPrice) < old.price) {
            const discountPercent = Math.round(((old.price - Number(draftPrice)) / old.price) * 100);
            const now = Date.now();
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
        }

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

        resetForm();
    }
</script>
<section class="card">
    <h4 class="media-title">Gestión de productos</h4>
    <p class="media-title">Si el precio baja, se crea promoción automáticamente con % de descuento.</p>
    <section class="form-card">
        <div class="grid">
            <input placeholder="Nombre" bind:value={draftName} />
            <input placeholder="Descripción" bind:value={draftDescription} />
            <input type="number" bind:value={draftPrice} min="0" step="0.01" />
            <input placeholder="URL de foto" bind:value={draftPhotoUrl} />
            <select bind:value={draftCategoryId}>
                <option value="" disabled>Categoría</option>
                {#each $categoryStore.items as category}
                    <option value={category.id}>{category.name}</option>
                {/each}
            </select>
            {#if editId}
                <button class="btn btn-primary" on:click={save}>Guardar cambios</button>
                <button class="btn btn-elevated" on:click={resetForm}>Cancelar</button>
            {:else}
                <button class="btn btn-primary" on:click={create}>Crear producto</button>
            {/if}
        </div>
    </section>

    <div class="list">
        {#each $productStore.items as product}
            <article>
                <img src={product.photoUrl} alt={product.name}/>
                <div>
                    <small><CategoryName categoryId={product.categoryId} /></small>
                    <strong>{product.name}</strong>
                    <p class="media-title">${product.price.toFixed(2)}</p>
                </div>
                <button
                        class="btn btn-elevated"
                        on:click={()=>startEdit(product)}
                >Editar</button>
                <button
                        class="btn btn-elevated"
                        on:click={()=>productStore.removeById(product.id)}
                >Eliminar</button>
            </article>
        {/each}
        </div>
    </section>
    <style>
        h4 {
            margin: 0;
            font-size: clamp(2rem, 3.6vw, 2.4rem);
            line-height: 1.12;
        }

        strong {
            margin: 0;
            font-size: clamp(2rem, 3.6vw, 2.4rem);
            line-height: 1.12;
        }

        p {
            margin: 0;
            color: color-mix(in srgb, var(--md-sys-color-on-background) 90%, transparent);
            font-size: clamp(1rem, 2vw, 1.1rem);
        }

        .form-card {
            width: 100%;
            max-width: 520px;
            justify-self: center;
            background: var(--md-sys-color-surface);
            border: 1px solid var(--md-sys-color-outline-variant);
            border-radius: 20px;
            padding: 20px;
            display: grid;
            gap: 10px;
            box-shadow: 0 10px 24px color-mix(in srgb, var(--md-sys-color-outline) 20%, transparent);
        }

        select {
            width: 100%;
            border: 1px solid var(--md-sys-color-outline-variant);
            border-radius: 12px;
            padding: 0 12px;
            font: inherit;
            color: var(--md-sys-color-on-surface);
            background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
        }

        input {
            width: 100%;
            border: 1px solid var(--md-sys-color-outline-variant);
            border-radius: 12px;
            padding: 0 12px;
            font: inherit;
            color: var(--md-sys-color-on-surface);
            background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
        }

        .card{
            display:grid;
            gap:10px
        }

        .grid{
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
            gap:8px
        }

        .list{
            display:grid;
            gap:8px}

        article{
            display:grid;
            grid-template-columns:64px 1fr auto auto;
            gap:8px;
            align-items:center;
            border:1px solid var(--md-sys-color-outline-variant);
            padding:8px;
            border-radius:12px
        }

        img{
            width:64px;
            height:64px;
            object-fit:cover;
            border-radius:8px
        }

        small{
            display:block
        }

        .btn {
            width: 100%;
            height: 35px;
            border-radius: 16px;
            border: 0;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 120ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .btn:active { transform: translateY(1px); }

        .btn-primary {
            color: var(--md-sys-color-on-primary);
            background: var(--md-sys-color-primary);
            box-shadow: 0 8px 16px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
        }

        .btn-elevated {
            min-width: 90px;
            color: var(--md-sys-color-on-surface);
            background: var(--md-sys-color-surface);
            border: 1px solid var(--md-sys-color-outline-variant);
            box-shadow: 0 6px 14px color-mix(in srgb, var(--md-sys-color-outline) 24%, transparent);
        }

        .btn:hover {
            filter: brightness(1.04);
        }

        @media (min-width: 900px), (orientation: landscape) and (max-height: 650px) {
            .form-card {
                max-width: none;
                align-self: stretch;
                align-content: center;
            }
        }
    </style>