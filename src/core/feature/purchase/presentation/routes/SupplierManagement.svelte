<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import type { Supplier } from "../../domain/entity/Supplier";
    import { supplierStore } from "../viewmodel/supplier.store";
    import { Check, Pencil, Plus, Save, Search, X } from "lucide-svelte";

    let name = "";
    let contact = "";
    let notes = "";
    let editId: string | null = null;
    let query = "";

    onMount(() => {
        supplierStore.syncAll().catch(() => {});
    });

    function resetForm(): void {
        editId = null;
        name = "";
        contact = "";
        notes = "";
    }

    function startEdit(s: Supplier): void {
        editId = s.id;
        name = s.name;
        contact = s.contact ?? "";
        notes = s.notes ?? "";
    }

    async function createSupplier(): Promise<void> {
        if (!name.trim()) return;
        try {
            toastStore.info("Creando proveedor…");
            await supplierStore.create({
                name: name.trim(),
                contact: contact.trim(),
                notes: notes.trim() || undefined,
            });
            toastStore.success("Proveedor creado.");
            resetForm();
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el proveedor.");
        }
    }

    async function saveSupplier(): Promise<void> {
        if (!editId || !name.trim()) return;
        try {
            toastStore.info("Guardando cambios…");
            await supplierStore.updateById(editId, {
                name: name.trim(),
                contact: contact.trim(),
                notes: notes.trim(),
            });
            toastStore.success("Proveedor actualizado.");
            resetForm();
        } catch (e: unknown) {
            const err = e as { message?: string; stack?: string };
            logger.error(err?.message ?? e, err?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo guardar el proveedor.");
        }
    }

    $: items = $supplierStore.items;
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((s) => {
                  const q = query.trim().toLowerCase();
                  return (
                      s.name.toLowerCase().includes(q) ||
                      (s.contact || "").toLowerCase().includes(q) ||
                      (s.notes || "").toLowerCase().includes(q) ||
                      (s.id || "").toLowerCase().includes(q)
                  );
              });
    $: canSubmit = name.trim().length > 0 && !$supplierStore.saving;
    $: isRefreshing = $supplierStore.loading && items.length > 0;
    $: isInitialLoading = $supplierStore.loading && items.length === 0;
</script>

<section class="mgmt-page" aria-label="Gestión de proveedores">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Proveedores</h1>
                <p class="mgmt-subtitle">
                    Catálogo y edición de proveedores. La vía habitual de <strong>alta</strong> es al registrar una
                    factura de entrada; aquí completas contacto/notas o corriges datos.
                </p>
            </div>
            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Check} size={18} ariaLabel="Total" />
                    {filtered.length} / {items.length}
                </span>
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando…
                    </span>
                {/if}
            </div>
        </div>
    </header>

    <div class="mgmt-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Formulario">
            <h2 class="mgmt-card-title">{editId ? "Editar proveedor" : "Alta manual (opcional)"}</h2>
            {#if !editId}
                <p class="mgmt-muted" style="margin:0 0 12px; font-size:0.85rem; line-height:1.4">
                    Preferible crear el proveedor desde la factura si llega con la mercancía. Usa este formulario si
                    quieres dar de alta el catálogo por adelantado.
                </p>
            {/if}

            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Nombre *</span>
                    <input class="mgmt-input" bind:value={name} placeholder="Ej. Distribuidora Norte" />
                </label>

                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Contacto</span>
                    <input
                        class="mgmt-input"
                        bind:value={contact}
                        placeholder="Teléfono, email o persona de contacto"
                    />
                </label>

                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Notas</span>
                    <textarea class="mgmt-input mgmt-area" bind:value={notes} placeholder="Opcional"></textarea>
                </label>

                <div class="mgmt-actions" style="grid-column:1/-1">
                    {#if editId}
                        <button class="mgmt-btn primary" type="button" on:click={saveSupplier} disabled={!canSubmit}>
                            <Icon icon={Save} size={18} ariaLabel="Guardar" />
                            Guardar
                        </button>
                        <button class="mgmt-btn ghost" type="button" on:click={resetForm}>
                            <Icon icon={X} size={18} ariaLabel="Cancelar" />
                            Cancelar
                        </button>
                    {:else}
                        <button class="mgmt-btn primary" type="button" on:click={createSupplier} disabled={!canSubmit}>
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
                            placeholder="Buscar proveedores…"
                            aria-label="Buscar proveedores"
                            bind:value={query}
                        />
                    </div>
                </label>
            </div>

            <div class="mgmt-list">
                {#if isInitialLoading}
                    <SkeletonList rows={6} />
                {:else if filtered.length === 0}
                    <div class="mgmt-muted">
                        Aún no hay proveedores. Créalos al registrar una factura de entrada, o usa el alta manual de la
                        izquierda.
                    </div>
                {/if}

                {#each filtered as s (s.id)}
                    <article class="mgmt-row" aria-label={s.name}>
                        <div class="mgmt-row-main">
                            <div class="mgmt-row-title">{s.name}</div>
                            <p class="mgmt-row-sub">
                                {s.contact && String(s.contact).trim() !== ""
                                    ? s.contact
                                    : "Sin contacto"}
                            </p>
                            {#if s.notes && String(s.notes).trim() !== ""}
                                <p class="mgmt-row-sub">{s.notes}</p>
                            {/if}
                        </div>
                        <div class="mgmt-row-actions">
                            <button class="mgmt-btn ghost" type="button" on:click={() => startEdit(s)}>
                                <Icon icon={Pencil} size={18} ariaLabel="Editar" />
                                Editar
                            </button>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    </div>
</section>
