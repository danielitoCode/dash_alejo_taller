<script lang="ts">
    import { onMount } from "svelte"
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte"
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte"
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte"
    import { logger } from "../../../../infrastructure/presentation/util/logger.service"
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store"
    import { promotionStore } from "../viewmodel/promotion.store"
    import { productStore } from "../../../product/presentation/viewmodel/product.store"
    import type { Promotion, PromotionKind } from "../../domain/entity/Promotion"
    import {
        discountPercent as policyDiscountPercent,
        resolvePromotionKind,
        isActiveProductDiscount,
        isActiveBanner,
    } from "../../domain/policy/PromotionPolicy"
    import { BadgePercent, Plus, Search, Trash2, X } from "lucide-svelte"

    onMount(() => {
        promotionStore.syncAll().catch(() => {})
        productStore.syncAll().catch(() => {})
    })

    let query = ""
    let formOpen = false
    let submitting = false

    let formKind: PromotionKind = "product_discount"
    let formTitle = ""
    let formMessage = ""
    let formProductId = ""
    let formOldPrice: number | string = ""
    let formPromoPrice: number | string = ""
    let formValidFrom = ""
    let formValidUntil = ""
    let formImageUrl = ""
    let productSearch = ""

    function toLocalInputValue(epoch: number): string {
        const d = new Date(epoch)
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    function fromLocalInputValue(value: string): number {
        const t = new Date(value).getTime()
        return Number.isFinite(t) ? t : Date.now()
    }

    function openForm(kind: PromotionKind = "product_discount"): void {
        formKind = kind
        formTitle = ""
        formMessage = ""
        formProductId = ""
        formOldPrice = ""
        formPromoPrice = ""
        formImageUrl = ""
        productSearch = ""
        const now = Date.now()
        formValidFrom = toLocalInputValue(now)
        formValidUntil = toLocalInputValue(now + 7 * 24 * 60 * 60 * 1000)
        formOpen = true
    }

    function closeForm(): void {
        if (submitting) return
        formOpen = false
    }

    function selectProduct(productId: string): void {
        formProductId = productId
        const p = $productStore.items.find((x) => x.id === productId)
        if (p) {
            formOldPrice = p.price
            if (formTitle.trim() === "") formTitle = `Promo ${p.name}`
            if (formMessage.trim() === "") formMessage = `Descuento en ${p.name}`
            if (formPromoPrice === "" || formPromoPrice === null) {
                formPromoPrice = Math.round(p.price * 0.9 * 100) / 100
            }
        }
        productSearch = ""
    }

    $: selectedProduct = formProductId
        ? $productStore.items.find((p) => p.id === formProductId) ?? null
        : null

    $: computedDiscount =
        formKind === "product_discount"
            ? Math.round(policyDiscountPercent(Number(formOldPrice), Number(formPromoPrice)))
            : 0

    $: productChoices =
        productSearch.trim().length === 0
            ? $productStore.items.slice(0, 12)
            : $productStore.items
                  .filter((p) => {
                      const q = productSearch.trim().toLowerCase()
                      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
                  })
                  .slice(0, 20)

    $: items = $promotionStore.items
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((p) => {
                  const q = query.trim().toLowerCase()
                  return (
                      (p.title || "").toLowerCase().includes(q) ||
                      (p.message || "").toLowerCase().includes(q) ||
                      (p.id || "").toLowerCase().includes(q) ||
                      (p.productId || "").toLowerCase().includes(q)
                  )
              })

    $: isRefreshing = $promotionStore.loading && items.length > 0
    $: isInitialLoading = $promotionStore.loading && items.length === 0

    function resolveProductName(productId?: string | null): string {
        if (!productId) return "Sin producto (banner)"
        return (
            $productStore.items.find((product) => product.id === productId)?.name ??
            `Producto ${productId.slice(0, 8)}`
        )
    }

    function promoStateLabel(promo: Promotion): string {
        const now = Date.now()
        if (promo.status === "cancelled") return "cancelada"
        if (promo.status === "ended") return "finalizada"
        if (promo.status === "draft") return "borrador"
        if (resolvePromotionKind(promo) === "product_discount") {
            return isActiveProductDiscount(promo, now) ? "activa" : "fuera de ventana"
        }
        return isActiveBanner(promo, now) ? "activa" : "fuera de ventana"
    }

    function kindLabel(promo: Promotion): string {
        return resolvePromotionKind(promo) === "banner" ? "Banner" : "Descuento producto"
    }

    async function submitForm(): Promise<void> {
        if (submitting) return
        submitting = true
        try {
            const kind = formKind
            const promo: Promotion = {
                id: crypto.randomUUID().replace(/-/g, "").slice(0, 20),
                title: formTitle.trim(),
                message: formMessage.trim(),
                imageUrl: formImageUrl.trim() || null,
                productId: kind === "banner" ? null : formProductId.trim() || null,
                oldPrice: kind === "product_discount" ? Number(formOldPrice) : null,
                currentPrice: kind === "product_discount" ? Number(formPromoPrice) : null,
                validFromEpochMillis: fromLocalInputValue(formValidFrom),
                validUntilEpochMillis: fromLocalInputValue(formValidUntil),
                source: "manual",
                kind,
                status: "active",
            }

            toastStore.info("Creando promoción…")
            await promotionStore.create(promo)
            toastStore.success(kind === "banner" ? "Banner creado." : "Descuento de producto creado.")
            formOpen = false
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack)
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear la promoción.")
        } finally {
            submitting = false
        }
    }

    async function removePromotion(id: string): Promise<void> {
        try {
            toastStore.info("Eliminando promoción…")
            await promotionStore.removeById(id)
            toastStore.success("Promoción eliminada.")
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack)
            toastStore.error(e instanceof Error ? e.message : "No se pudo eliminar.")
        }
    }
</script>

<section class="mgmt-page promo-mgmt" aria-label="Promociones">
    <header class="mgmt-header">
        <div class="mgmt-title-row">
            <div class="mgmt-title">
                <span class="mgmt-title-ico" aria-hidden="true">
                    <Icon icon={BadgePercent} size={20} ariaLabel="" />
                </span>
                <div>
                    <h1>Promociones</h1>
                    <p class="mgmt-subtitle">
                        Política B · descuento por producto o banner · una activa por producto
                    </p>
                </div>
            </div>
            <div class="mgmt-actions">
                <button class="mgmt-btn" type="button" on:click={() => openForm("banner")}>
                    <Icon icon={Plus} size={16} ariaLabel="" />
                    Banner
                </button>
                <button class="mgmt-btn primary" type="button" on:click={() => openForm("product_discount")}>
                    <Icon icon={Plus} size={16} ariaLabel="" />
                    Descuento producto
                </button>
            </div>
        </div>

        <div class="search-row">
            <label class="search-field">
                <Icon icon={Search} size={16} ariaLabel="Buscar" />
                <input type="search" bind:value={query} placeholder="Buscar por título, mensaje o producto…" />
            </label>
            {#if isRefreshing}
                <LoadingSpinner size={18} />
            {/if}
        </div>
    </header>

    {#if isInitialLoading}
        <SkeletonList rows={6} />
    {:else if filtered.length === 0}
        <div class="mgmt-card empty">
            <p class="mgmt-muted">No hay promociones{query ? " que coincidan" : ""}.</p>
            <button class="mgmt-btn primary" type="button" on:click={() => openForm("product_discount")}>
                Crear primera promo
            </button>
        </div>
    {:else}
        <div class="promo-list">
            {#each filtered as promo (promo.id)}
                <article class="promo-card">
                    <div class="promo-main">
                        <div class="promo-badges">
                            <span class="badge kind">{kindLabel(promo)}</span>
                            <span class="badge state">{promoStateLabel(promo)}</span>
                        </div>
                        <h2 class="promo-title">{promo.title}</h2>
                        <p class="promo-msg">{promo.message}</p>
                        <p class="promo-meta">
                            {resolveProductName(promo.productId)}
                            {#if promo.oldPrice != null && promo.currentPrice != null}
                                · {promo.oldPrice} → {promo.currentPrice}
                                ({Math.round(policyDiscountPercent(Number(promo.oldPrice), Number(promo.currentPrice)))}%)
                            {/if}
                        </p>
                        <p class="promo-meta muted">
                            {new Date(promo.validFromEpochMillis).toLocaleString()}
                            →
                            {new Date(promo.validUntilEpochMillis).toLocaleString()}
                        </p>
                        <code class="promo-id">{promo.id}</code>
                    </div>
                    <div class="promo-side">
                        <button
                            class="mgmt-btn danger ghost"
                            type="button"
                            title="Eliminar"
                            on:click={() => removePromotion(promo.id)}
                            disabled={$promotionStore.saving}
                        >
                            <Icon icon={Trash2} size={16} ariaLabel="Eliminar" />
                        </button>
                    </div>
                </article>
            {/each}
        </div>
    {/if}
</section>

{#if formOpen}
    <div class="modal-backdrop" role="presentation" on:click={closeForm}>
        <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-form-title"
            on:click|stopPropagation
        >
            <header class="modal-head">
                <h2 id="promo-form-title">
                    {formKind === "banner" ? "Nuevo banner" : "Nuevo descuento de producto"}
                </h2>
                <button class="icon-btn" type="button" on:click={closeForm} disabled={submitting}>
                    <Icon icon={X} size={18} ariaLabel="Cerrar" />
                </button>
            </header>

            <div class="modal-body">
                <div class="kind-switch">
                    <button
                        type="button"
                        class:active={formKind === "product_discount"}
                        on:click={() => (formKind = "product_discount")}
                    >
                        Descuento producto
                    </button>
                    <button
                        type="button"
                        class:active={formKind === "banner"}
                        on:click={() => {
                            formKind = "banner"
                            formProductId = ""
                        }}
                    >
                        Banner
                    </button>
                </div>

                <label class="field">
                    <span>Título</span>
                    <input type="text" bind:value={formTitle} placeholder="Ej. Oferta semana" />
                </label>

                <label class="field">
                    <span>Mensaje</span>
                    <textarea bind:value={formMessage} rows="2" placeholder="Texto visible en tienda"></textarea>
                </label>

                <label class="field">
                    <span>Imagen (URL opcional)</span>
                    <input type="url" bind:value={formImageUrl} placeholder="https://…" />
                </label>

                {#if formKind === "product_discount"}
                    <div class="field">
                        <span>Producto</span>
                        {#if selectedProduct}
                            <div class="selected-product">
                                <strong>{selectedProduct.name}</strong>
                                <span>Lista: {selectedProduct.price}</span>
                                <button type="button" class="linkish" on:click={() => (formProductId = "")}>
                                    Cambiar
                                </button>
                            </div>
                        {:else}
                            <input
                                type="search"
                                bind:value={productSearch}
                                placeholder="Buscar producto por nombre o id…"
                            />
                            <ul class="product-pick">
                                {#each productChoices as p (p.id)}
                                    <li>
                                        <button type="button" on:click={() => selectProduct(p.id)}>
                                            <span class="pn">{p.name}</span>
                                            <span class="pp">{p.price}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>

                    <div class="row-2">
                        <label class="field">
                            <span>Precio lista (antes)</span>
                            <input type="number" min="0" step="0.01" bind:value={formOldPrice} />
                        </label>
                        <label class="field">
                            <span>Precio promo</span>
                            <input type="number" min="0" step="0.01" bind:value={formPromoPrice} />
                        </label>
                    </div>
                    {#if computedDiscount > 0}
                        <p class="discount-hint">Descuento: −{computedDiscount}%</p>
                    {/if}
                {:else}
                    <p class="mgmt-muted banner-hint">
                        El banner no cambia precios ni exige producto. Solo se muestra como aviso.
                    </p>
                {/if}

                <div class="row-2">
                    <label class="field">
                        <span>Válida desde</span>
                        <input type="datetime-local" bind:value={formValidFrom} />
                    </label>
                    <label class="field">
                        <span>Válida hasta</span>
                        <input type="datetime-local" bind:value={formValidUntil} />
                    </label>
                </div>
            </div>

            <footer class="modal-foot">
                <button class="mgmt-btn" type="button" on:click={closeForm} disabled={submitting}>
                    Cancelar
                </button>
                <button class="mgmt-btn primary" type="button" on:click={submitForm} disabled={submitting}>
                    {submitting ? "Guardando…" : "Crear promoción"}
                </button>
            </footer>
        </div>
    </div>
{/if}

<style>
    .promo-mgmt { gap: 14px; }
    .mgmt-title-row {
        display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: flex-start;
    }
    .mgmt-title { display: flex; gap: 12px; align-items: flex-start; }
    .mgmt-title h1 { margin: 0; font-size: 1.25rem; font-weight: 900; }
    .mgmt-subtitle {
        margin: 2px 0 0; font-size: 0.86rem;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 70%, transparent);
    }
    .mgmt-title-ico {
        width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    }
    .mgmt-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .search-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
    .search-field {
        flex: 1; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
    }
    .search-field input { border: none; background: transparent; width: 100%; font: inherit; color: inherit; outline: none; }
    .promo-list { display: grid; gap: 10px; }
    .promo-card {
        display: flex; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
    }
    .promo-title { margin: 6px 0 2px; font-size: 1.05rem; font-weight: 850; }
    .promo-msg { margin: 0; font-size: 0.9rem; color: color-mix(in srgb, var(--md-sys-color-on-background) 80%, transparent); }
    .promo-meta { margin: 6px 0 0; font-size: 0.84rem; }
    .promo-meta.muted { opacity: 0.75; }
    .promo-id { display: block; margin-top: 6px; font-size: 0.72rem; word-break: break-all; opacity: 0.65; }
    .promo-badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge {
        font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
    }
    .badge.kind { background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent); }
    .badge.state { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent); }
    .empty { display: grid; gap: 12px; justify-items: start; padding: 20px; }
    .modal-backdrop {
        position: fixed; inset: 0; z-index: 80; background: color-mix(in srgb, black 45%, transparent);
        display: grid; place-items: center; padding: 16px;
    }
    .modal {
        width: min(560px, 100%); max-height: min(90vh, 720px); overflow: auto; border-radius: 18px;
        border: 1px solid var(--md-sys-color-outline-variant); background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface); display: grid; grid-template-rows: auto 1fr auto;
    }
    .modal-head {
        display: flex; justify-content: space-between; align-items: center; padding: 14px 16px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
    .modal-head h2 { margin: 0; font-size: 1.05rem; font-weight: 850; }
    .modal-body { padding: 14px 16px; display: grid; gap: 12px; }
    .modal-foot {
        display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .kind-switch {
        display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
    }
    .kind-switch button {
        border: none; border-radius: 10px; padding: 8px 10px; font: inherit; font-weight: 700;
        cursor: pointer; background: transparent; color: inherit;
    }
    .kind-switch button.active { background: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent); }
    .field { display: grid; gap: 6px; font-size: 0.88rem; font-weight: 650; }
    .field input, .field textarea {
        font: inherit; font-weight: 500; padding: 10px 12px; border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 96%, transparent); color: inherit;
    }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 560px) { .row-2 { grid-template-columns: 1fr; } }
    .product-pick {
        list-style: none; margin: 6px 0 0; padding: 0; max-height: 160px; overflow: auto;
        border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);
    }
    .product-pick button {
        width: 100%; display: flex; justify-content: space-between; gap: 8px; padding: 10px 12px;
        border: none; background: transparent; color: inherit; font: inherit; cursor: pointer; text-align: left;
    }
    .product-pick button:hover { background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent); }
    .selected-product {
        display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 10px 12px;
        border-radius: 12px; border: 1px solid var(--md-sys-color-outline-variant);
    }
    .linkish {
        border: none; background: none; color: var(--md-sys-color-primary); font: inherit;
        font-weight: 700; cursor: pointer; text-decoration: underline;
    }
    .discount-hint { margin: 0; font-weight: 800; color: color-mix(in srgb, var(--md-sys-color-primary) 90%, white); }
    .banner-hint { margin: 0; font-size: 0.88rem; }
    .icon-btn { border: none; background: transparent; color: inherit; cursor: pointer; padding: 6px; border-radius: 10px; }
    .mgmt-btn.danger.ghost {
        border: 1px solid color-mix(in srgb, #ef4444 35%, var(--md-sys-color-outline-variant));
        background: transparent; color: #fca5a5; border-radius: 12px; padding: 8px 10px; cursor: pointer;
    }
</style>
