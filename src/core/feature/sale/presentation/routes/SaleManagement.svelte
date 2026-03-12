<script lang="ts">
    import {onMount} from "svelte";
    import {saleStore} from "../viewmodel/sale.store";
    import type {Sale} from "../../domain/entity/Sale";
    import {BuyState, DeliveryType} from "../../domain/entity/enums";

    onMount(() => { saleStore.syncAll().catch(() => {}); });

    let salesListTest: Sale[] = [
        {
            id:"A",
            amount:100,
            date:"now",
            verified: BuyState.UNVERIFIED,
            userId:"userA",
            deliveryType: DeliveryType.DELIVERY,
            products: [
                {price:32, quantity:3, productId:"p1"},
                {price:32, quantity:1, productId:"p2"},
                {price:36, quantity:4, productId:"p3"},
            ]
        },
        {
            id:"B",
            amount:100,
            date:"now +1'",
            verified: BuyState.VERIFIED,
            userId:"userA",
            deliveryType: DeliveryType.DELIVERY,
            products: [
                {price:32, quantity:2, productId:"p2"},
                {price:32, quantity:1, productId:"p4"},
                {price:36, quantity:1, productId:"p3"},
            ]
        }
    ];
</script>
<section class="card"><h2>Gestión de ventas</h2>
    {#if $saleStore.items.length===0}
        <p>No hay ventas registradas.</p>
    {/if}
    <!--{#each salesListTest as sale}-->
    {#each $saleStore.items as sale}
        <article class="form-card">
            <div>
                <h3><strong>Venta #{sale.id.slice(0,8)}</strong></h3>
                <small>Monto: ${sale.amount.toFixed(2)}</small>
                <small>Estado: {sale.verified}</small>
            </div>
            {#each sale.products as product}
                <div class="div-table">
                    <small>PRODUCTO: {product.productId}</small>
                    <small>CANTIDAD: {product.quantity}</small>
                    <small>PRECIO UNITARIO: {product.price}</small>
                    <small>PRECIO DE COMPRA: {product.price * product.quantity}</small>
                </div>
            {/each}
        </article>
    {/each}
</section>
<style>
    .card{
        display:grid;
        gap:8px
    }

    article{
        border:1px solid var(--md-sys-color-outline-variant);
        padding:10px;
        border-radius:12px
    }

    .form-card {
        width: 100%;
        justify-self: center;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 20px;
        padding: 20px;
        display: grid;
        gap: 10px;
        box-shadow: 0 10px 24px color-mix(in srgb, var(--md-sys-color-outline) 20%, transparent);
    }

    .div-table {
        display:grid;
        grid-template-columns:auto auto auto auto;
    }

    small{
        display:block
    }
</style>