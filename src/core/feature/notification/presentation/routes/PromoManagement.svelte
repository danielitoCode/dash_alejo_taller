<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { promotionStore } from "../viewmodel/promotion.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { BadgePercent, Search, Trash2 } from "lucide-svelte";

    onMount(() => {
        promotionStore.syncAll().catch(() => {});
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
            {#if items.length === 0}
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
                            {promo.message || "Sin mensaje"} · Descuento: {discountPercent(promo.oldPrice, promo.currentPrice)}%
                            · ${promo.oldPrice ?? 0} → ${promo.currentPrice ?? 0}
                        </p>
                    </div>

                    <div class="mgmt-row-actions">
                        <button class="mgmt-btn danger" on:click={() => productStore.removeById(promo.id)}>
                            <Icon icon={Trash2} size={18} ariaLabel="Eliminar" />
                            Eliminar
                        </button>
                    </div>
                </article>
            {/each}
        </div>
    </section>
</section>
