<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../components/Icon.svelte";
    import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store";
    import { userManagementStore } from "../../../feature/auth/presentation/viewmodel/user-management.store";
    import { BuyState } from "../../../feature/sale/domain/entity/enums";
    import { salesDetail } from "../navigation/nested.router";
    import { CalendarCheck2, ChevronRight, Inbox, Search } from "lucide-svelte";

    export let navController: NavController;
    let query = "";

    onMount(() => {
        saleStore.syncAll().catch(() => {});
        userManagementStore.syncAll().catch(() => {});
    });

    function openDetail(id: string) {
        navController.navigate(salesDetail.path, { id });
    }

    function resolveUserName(userId: string): string {
        return $userManagementStore.items.find((user) => user.id === userId)?.name ?? "Usuario desconocido";
    }

    $: pendingReservations = $saleStore.items
        .filter((sale) => sale.verified === BuyState.UNVERIFIED)
        .filter((sale) => {
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return (
                sale.id.toLowerCase().includes(q) ||
                sale.userId.toLowerCase().includes(q) ||
                resolveUserName(sale.userId).toLowerCase().includes(q)
            );
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
</script>

<section class="mgmt-screen">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Reservas</h1>
                <p class="mgmt-muted">Cola administrativa de pedidos pendientes de validación operativa</p>
            </div>
            <div class="mgmt-chip-row">
                <span class="mgmt-chip">
                    <Icon icon={Inbox} size={18} ariaLabel="Pendientes" />
                    {pendingReservations.length} pendientes
                </span>
                <span class="mgmt-chip">
                    <Icon icon={CalendarCheck2} size={18} ariaLabel="Seguimiento" />
                    Supervisión solamente
                </span>
            </div>
        </header>

        <section class="mgmt-card">
            <label class="search-field">
                <Icon icon={Search} size={18} ariaLabel="Buscar" />
                <input type="search" placeholder="Buscar por reserva o cliente..." bind:value={query} />
            </label>

            <div class="reservation-list">
                {#if pendingReservations.length === 0}
                    <p class="mgmt-muted">No hay reservas pendientes.</p>
                {:else}
                    {#each pendingReservations as sale (sale.id)}
                        <button class="reservation-card" type="button" on:click={() => openDetail(sale.id)}>
                            <div class="reservation-main">
                                <strong>Reserva #{sale.id.slice(0, 8)}</strong>
                                <small>Cliente: {resolveUserName(sale.userId)} · Total: ${sale.amount.toFixed(2)}</small>
                                <small>Fecha: {new Date(sale.date).toLocaleString()} · {sale.products.length} items</small>
                            </div>
                            <Icon icon={ChevronRight} size={16} ariaLabel="Abrir" />
                        </button>
                    {/each}
                {/if}
            </div>
        </section>
    </div>
</section>

<style>
    .search-field {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 14px;
        padding: 0 12px;
        margin-bottom: 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
    }

    .search-field input {
        width: 100%;
        height: 44px;
        border: 0;
        outline: 0;
        background: transparent;
        color: inherit;
        font: inherit;
    }

    .reservation-list {
        display: grid;
        gap: 10px;
    }

    .reservation-card {
        width: 100%;
        text-align: left;
        border: 1px solid var(--md-sys-color-outline-variant);
        padding: 12px;
        border-radius: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface) 94%, transparent);
    }

    .reservation-card:hover {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface) 92%);
    }

    .reservation-main {
        display: grid;
        gap: 4px;
        min-width: 0;
    }

    .reservation-main small {
        display: block;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 72%, transparent);
    }
</style>
