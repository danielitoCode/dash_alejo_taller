<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import ImagePicker from "../../../../infrastructure/presentation/components/ImagePicker.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import type { Category } from "../../domain/entity/Category";
    import { categoryStore } from "../viewmodel/category.store";
    import { Check, Pencil, Plus, Save, Search, Trash2, X } from "lucide-svelte";

    let name = "";
    let description = "";
    let photoUrl = "";
    let status: "active" | "inactive" = "active";
    let editId: string | null = null;
    let query = "";
    let imagePending = false;
    let imageKey = 0;

    onMount(() => {
        categoryStore.syncAll().catch(() => {});
    });

    function resetForm(): void {
        editId = null;
        name = "";
        description = "";
        photoUrl = "";
        status = "active";
        imageKey += 1;
    }

    async function createCategory() {
        if (!name.trim()) return;

        try {
            toastStore.info("Creando categoría…");
            await categoryStore.create({
                id: `c-${Math.random().toString(36).slice(2, 8)}`,
                name: name.trim(),
                description: description.trim(),
                photoUrl: photoUrl.trim() || null,
                status
            });
            toastStore.success("Categoría creada.");
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear la categoría.");
        }
    }

    function startEdit(category: Category): void {
        imageKey += 1;
        editId = category.id;
        name = category.name;
        description = category.description;
        photoUrl = category.photoUrl ?? "";
        status = category.status;
    }

    async function saveCategory(): Promise<void> {
        if (!editId || !name.trim()) return;

        const current = $categoryStore.items.find((item) => item.id === editId);
        if (!current) return;

        try {
            toastStore.info("Guardando cambios…");
            await categoryStore.updateById(editId, {
                ...current,
                name: name.trim(),
                description: description.trim(),
                photoUrl: photoUrl.trim() || null,
                status
            });
            toastStore.success("Categoría actualizada.");
            resetForm();
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar la categoría.");
        }
    }

    $: items = $categoryStore.items;
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((c) => {
                  const q = query.trim().toLowerCase();
                  return (
                      c.name.toLowerCase().includes(q) ||
                      (c.description || "").toLowerCase().includes(q) ||
                      (c.id || "").toLowerCase().includes(q)
                  );
              });

    $: canSubmit = name.trim().length > 0 && !imagePending;
</script>

<section class="mgmt-page" aria-label="Gestión de categorías">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Categorías</h1>
                <p class="mgmt-subtitle">Organiza tu catálogo. Crea, edita y elimina categorías en segundos.</p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Check} size={18} ariaLabel="Total" />
                    {filtered.length} / {items.length}
                </span>
            </div>
        </div>
    </header>

    <div class="mgmt-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Formulario">
            <h2 class="mgmt-card-title">{editId ? "Editar categoría" : "Nueva categoría"}</h2>

            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Nombre</span>
                    <input class="mgmt-input" bind:value={name} placeholder="Ej. Baterías, Solar, Herramientas…" />
                </label>

                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Descripción</span>
                    <textarea class="mgmt-input mgmt-area" bind:value={description} placeholder="Opcional"></textarea>
                </label>

                <label class="mgmt-field">
                    <span>Estado</span>
                    <select class="mgmt-select" bind:value={status}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                    </select>
                </label>

                <div style="grid-column:1/-1">
                    {#key imageKey}
                        <ImagePicker
                            label="Imagen de la categoría"
                            bind:value={photoUrl}
                            bind:pending={imagePending}
                        />
                    {/key}
                </div>

                <div class="mgmt-actions" style="grid-column:1/-1">
                    {#if editId}
                        <button class="mgmt-btn primary" on:click={saveCategory} disabled={!canSubmit}>
                            <Icon icon={Save} size={18} ariaLabel="Guardar" />
                            Guardar
                        </button>
                        <button class="mgmt-btn ghost" on:click={resetForm}>
                            <Icon icon={X} size={18} ariaLabel="Cancelar" />
                            Cancelar
                        </button>
                    {:else}
                        <button class="mgmt-btn primary" on:click={createCategory} disabled={!canSubmit}>
                            <Icon icon={Plus} size={18} ariaLabel="Agregar" />
                            Agregar
                        </button>
                    {/if}
                </div>
            </div>
        </section>

        <section class="mgmt-card" aria-label="Listado">
            <div class="mgmt-toolbar" style="margin-bottom:12px">
                <h2 class="mgmt-card-title" style="margin:0">Listado</h2>

                <label class="mgmt-field" style="min-width:min(360px,100%); margin:0">
                    <span class="mgmt-muted" style="display:none">Buscar</span>
                    <div style="display:flex; gap:10px; align-items:center">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input
                            class="mgmt-input"
                            type="search"
                            placeholder="Buscar categorías..."
                            aria-label="Buscar categorías"
                            bind:value={query}
                        />
                    </div>
                </label>
            </div>

            <div class="mgmt-list">
                {#if filtered.length === 0}
                    <div class="mgmt-muted">No hay resultados.</div>
                {/if}

                {#each filtered as category (category.id)}
                    <article class="mgmt-row" aria-label={category.name}>
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            {#if category.photoUrl}
                                <img class="mgmt-avatar" src={category.photoUrl} alt="" aria-hidden="true" />
                            {:else}
                                <div class="mgmt-avatar" aria-hidden="true"></div>
                            {/if}

                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">{category.name} <span class="mgmt-muted">· {category.status}</span></div>
                                <p class="mgmt-row-sub">{category.description || "Sin descripción"}</p>
                            </div>
                        </div>

                        <div class="mgmt-row-actions">
                            <button class="mgmt-btn ghost" on:click={() => startEdit(category)}>
                                <Icon icon={Pencil} size={18} ariaLabel="Editar" />
                                Editar
                            </button>
                            <button class="mgmt-btn danger" on:click={() => categoryStore.removeById(category.id)}>
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
