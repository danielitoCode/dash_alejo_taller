<script lang="ts">
    import { onMount } from "svelte";
    import { categoryStore } from "../viewmodel/category.store";
    import type {Category} from "../../domain/entity/Category";

    let name = "";
    let description = "";
    let photoUrl = "";
    let editId: string | null = null;

    onMount(() => {
        categoryStore.syncAll().catch(() => {});
    });

    function resetForm(): void {
        editId = null;
        name = "";
        description = "";
        photoUrl = "";
    }

    async function createCategory() {
        if (!name.trim()) return;

        await categoryStore.create({
            id: `c-${Math.random().toString(36).slice(2, 8)}`,
            name: name.trim(),
            description: description.trim(),
            photoUrl: photoUrl.trim() || null,
            status: true
        });

        resetForm();
    }

    function startEdit(category: Category): void {
        editId = category.id;
        name = category.name;
        description = category.description;
        photoUrl = category.photoUrl ?? "";
    }

    async function saveCategory(): Promise<void> {
        if (!editId || !name.trim()) return;

        const current = $categoryStore.items.find((item) => item.id === editId);
        if (!current) return;

        await categoryStore.updateById(editId, {
            ...current,
            name: name.trim(),
            description: description.trim(),
            photoUrl: photoUrl.trim() || null
        });

        resetForm();
    }
</script>

<section class="card">
    <h4 class="media-title">Gestión de categorías</h4>
    <div class="form">
        <input bind:value={name} placeholder="Nombre de categoría" />
        <input bind:value={description} placeholder="Descripción" />
        <input bind:value={photoUrl} placeholder="URL de imagen (opcional)" />

        {#if editId}
            <button class="btn btn-primary" on:click={saveCategory}>Guardar</button>
            <button class="btn btn-elevated" on:click={resetForm}>Cancelar</button>
        {:else}
            <button class="btn btn-primary" on:click={createCategory}>Agregar</button>
        {/if}
    </div>
    <!--{#each listCategoriasTest as category}-->
    {#each $categoryStore.items as category}
        <article>
            <div class="details">
                <strong>{category.name}</strong>
                <p>{category.description || "Sin descripción"}</p>
            </div>

            <button class="btn btn-elevated" on:click={() => startEdit(category)}>Editar</button>
            <button class="btn btn-elevated" on:click={() => categoryStore.removeById(category.id)}>Eliminar</button>
        </article>
    {/each}
</section>
<style>
    h4 {
        margin: 0;
        font-size: clamp(2rem, 3.6vw, 2.4rem);
        line-height: 1.12;
    }

    .card{
        display:grid;
        gap:10px
    }

    input {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }

    .btn {
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

    .form,article{
        display:flex;
        gap:8px;
        flex-wrap:wrap
    }

    article{
        display:grid;
        grid-template-columns:1fr 90px 90px;
        border:1px solid var(--md-sys-color-outline-variant);
        padding:8px;
        border-radius:12px
    }
</style>