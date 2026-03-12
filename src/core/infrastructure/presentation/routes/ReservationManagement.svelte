<script lang="ts">
    import { onMount } from "svelte";
    import {saleStore} from "../../../feature/sale/presentation/viewmodel/sale.store";
    onMount(() => { saleStore.syncAll().catch(() => {}); });
</script>
<section class="card"><h2>Gestión de reservas</h2>
    {#each $saleStore.items.filter((s)=>s.verified === 'UNVERIFIED') as sale}
        <article><strong>Reserva #{sale.id.slice(0,8)}</strong><small>Usuario: {sale.userId} · Total: ${sale.amount.toFixed(2)}</small></article>
    {/each}
    {#if $saleStore.items.filter((s)=>s.verified === 'UNVERIFIED').length===0}<p>No hay reservas pendientes.</p>{/if}
</section>
<style>.card{display:grid;gap:8px}article{border:1px solid var(--md-sys-color-outline-variant);padding:10px;border-radius:12px}small{display:block}</style>