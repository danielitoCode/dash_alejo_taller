<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { promotionStore } from "../viewmodel/promotion.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { BadgePercent, Search, Trash2 } from "lucide-svelte";

    onMount(() => {
        promotionStore.syncAll().catch(() => {});
        productStore.syncAll().catch(() => {});
    });

    let query = "";

    function discountPercent(oldPrice?: number | null, currentPrice?: number | null): number {
        if (!oldPrice || !currentPrice || oldPrice <= 0) return 0;
        return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
    }

    $: items = $promotionStore.items;
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((p) => {
                  const q = query.trim().toLowerCase();
                  return (
                      (p.title || "").toLowerCase().includes(q) ||
                      (p.message || "").toLowerCase().includes(q) ||
                      (p.id || "").toLowerCase().includes(q)
                  );
              });

    $: isRefreshing = $promotionStore.loading && items.length > 0;
    $: isInitialLoading = $promotionStore.loading && items.length === 0;

    function resolveProductName(productId?: string | null): string {
        if (!productId) return "Sin producto asociado";
        return $productStore.items.find((product) => product.id === productId)?.name ?? `Producto ${productId.slice(0, 8)}`;
    }

    function promoState(validUntilEpochMillis: number): string {
        return validUntilEpochMillis >= Date.now() ? "activa" : "expirada";
    }

    async function removePromotion(id: string): Promise<void> {
        try {
            toastStore.info("Eliminando promoción...");
            await promotionStore.removeById(id);
            toastStore.success("Promoción eliminada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo eliminar la promoción.");
        }
    }
</script>

<section class="mgmt-page" aria-label="Gestión de promociones">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Promociones</h1>
                <p class="mgmt-subtitle">
                    Revisa promociones generadas por cambios de precio. El panel muestra el descuento calculado.
                </p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={BadgePercent} size={18} ariaLabel="Total" />
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
                        placeholder="Buscar promociones..."
                        aria-label="Buscar promociones"
                        bind:value={query}
                    />
                </div>
            </label>
        </div>

        <div class="mgmt-list">
            {#if isInitialLoading}
                <SkeletonList rows={8} showAvatar={false} />
            {:else if items.length === 0}
                <div class="mgmt-muted">No hay promociones creadas.</div>
            {/if}

            {#if filtered.length === 0 && items.length > 0}
                <div class="mgmt-muted">No hay resultados.</div>
            {/if}

            {#each filtered as promo (promo.id)}
                <article class="mgmt-row" aria-label={promo.title}>
                    <div class="mgmt-row-main">
                        <div class="mgmt-row-title">{promo.title}</div>
                        <p class="mgmt-row-sub">
                            {resolveProductName(promo.productId)} · {promo.message || "Sin mensaje"} · Descuento: {discountPercent(promo.oldPrice, promo.currentPrice)}%
                            · ${promo.oldPrice ?? 0} → ${promo.currentPrice ?? 0}
                        </p>
                        <p class="mgmt-row-sub">
                            Estado: {promoState(promo.validUntilEpochMillis)} · Origen: {promo.source ?? "automatic"}
                        </p>
                    </div>

                    <div class="mgmt-row-actions">
                        <button class="mgmt-btn danger" on:click={() => removePromotion(promo.id)}>
                            <Icon icon={Trash2} size={18} ariaLabel="Eliminar" />
                            Eliminar
                        </button>
                    </div>
                </article>
            {/each}
        </div>
    </section>
</section>


