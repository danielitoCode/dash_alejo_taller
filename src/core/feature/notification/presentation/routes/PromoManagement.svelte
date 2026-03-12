<script lang="ts">
    import { onMount } from "svelte";
    import { promotionStore } from "../viewmodel/promotion.store";
    import type {Promotion} from "../../domain/entity/Promotion";
    import {productStore} from "../../../product/presentation/viewmodel/product.store";
    onMount(() => { promotionStore.syncAll().catch(() => {}); });

    let listPromoTest: Promotion[] = [
        {id: "test1", title:"PromoTest1", message:"Mensaje de prueba 1", validFromEpochMillis:43, validUntilEpochMillis:443},
        {id: "test2", title:"PromoTest2", message:"Mensaje de prueba 2", validFromEpochMillis:43, validUntilEpochMillis:443},
        {id: "test3", title:"PromoTest3", message:"Mensaje de prueba 3", validFromEpochMillis:43, validUntilEpochMillis:443}
    ];
</script>
<section class="card">
    <h4>Gestión de promociones</h4>
    {#if $promotionStore.items.length===0}<p>No hay promociones creadas.</p>{/if}
    <!--{#each listPromoTest as promo}-->
    {#each $promotionStore.items as promo}
        <article>
            <div>
                <strong>{promo.title}</strong>
                <small>Descuento: {promo.oldPrice && promo.currentPrice ? Math.round(((promo.oldPrice-promo.currentPrice)/promo.oldPrice)*100) : 0}% · ${promo.oldPrice ?? 0} → ${promo.currentPrice ?? 0}</small>
            </div>
            <button
                    class="btn btn-elevated"
                    on:click={()=>productStore.removeById(promo.id)}
            >Eliminar</button>
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
        gap:8px
    }

    article{
        display:grid;
        grid-template-columns:1fr auto;
        gap:8px;
        align-items:center;
        border:1px solid var(--md-sys-color-outline-variant);
        padding:8px;
        border-radius:12px
    }

    small{
        display:block
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

    .btn-elevated {
        min-width: 90px;
        color: var(--md-sys-color-on-surface);
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 6px 14px color-mix(in srgb, var(--md-sys-color-outline) 24%, transparent);
    }
</style>