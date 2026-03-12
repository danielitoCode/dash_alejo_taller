<script lang="ts">
    import type { NavController } from "../../../../lib/navigation/NavController";
    import type { NavBackStackEntry } from "../../../../lib/navigation/NavBackStackEntry";
    import { rememberNavController } from "../../../../lib/navigation/rememberNavController";
    import { composable } from "../../../../lib/navigation/composable";
    import NavHost from "../../../../lib/navigation/NavHost.svelte";
    import { authContainer } from "../../../feature/auth/di/auth.container";
    import { users, product, category, sales, promo, settings, reservation } from "./nested.router";
    import UserManagement from "../../../feature/auth/presentation/routes/UserManagement.svelte";
    import ProductManagement from "../../../feature/product/presentation/routes/ProductManagement.svelte";
    import CategoryManagement from "../../../feature/category/presentation/routes/CategoryManagement.svelte";
    import SaleManagement from "../../../feature/sale/presentation/routes/SaleManagement.svelte";
    import PromoManagement from "../../../feature/notification/presentation/routes/PromoManagement.svelte";
    import SettingsManagement from "../routes/SettingsManagement.svelte";
    import ReservationManagement from "../routes/ReservationManagement.svelte";
    import {productStore} from "../../../feature/product/presentation/viewmodel/product.store";
    import {categoryStore} from "../../../feature/category/presentation/viewmodel/category.store";
    import {promotionStore} from "../../../feature/notification/presentation/viewmodel/promotion.store";
    import {onMount} from "svelte";
    import {toastStore} from "../viewmodel/toast.store";
    import {sessionStore} from "../../../feature/auth/presentation/viewmodel/session.store";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const internalNavController = rememberNavController(product.path);
    const userId = navBackStackEntry?.args?.id ?? "usuario";

    const currentUser = sessionStore.getCurrentUser();

    const items = [
        { label: "Usuarios", path: users.path },
        { label: "Productos", path: product.path },
        { label: "Categorías", path: category.path },
        { label: "Ventas", path: sales.path },
        { label: "Promos", path: promo.path },
        { label: "Reservas", path: reservation.path },
        { label: "Ajustes", path: settings.path }
    ];

    const internalStackStore = internalNavController._getStackStore();
    $: internalStack = $internalStackStore;
    $: currentPath = internalStack.at(-1)?.route ?? product.path;

    let sidebarOpen = false;

    function go(path: string) {
        if (currentPath !== path) internalNavController.navigate(path);
        sidebarOpen = false;
    }

    async function logout() {
        try {
            await authContainer.useCases.sessions.closeSession.execute();
        } finally {
            navController.navigate("welcome");
        }
    }

    onMount(() => {
        authContainer.useCases.accounts
            .getCurrentUser()
            .then((u) => {
                if (u.role !== "admin") {
                    navController.navigate("unauthorized", {
                        message: "Tu cuenta no está autorizada para usar el panel de gestión."
                    });
                }
            })
            .catch(() => {
                navController.navigate("login");
            });

        productStore.syncAll().catch(() => { toastStore.error("Error al sincronizar datos"); });
        categoryStore.syncAll().catch(() => { toastStore.error("Error al sincronizar datos"); });
        promotionStore.syncAll().catch(() => { toastStore.error("Error al sincronizar datos"); });
    });
</script>

<section class="nested-shell">
    <aside class="sidebar {sidebarOpen ? 'open' : ''}">
        <header>
            <h2>Business Dashboard</h2>
            {#await currentUser}
                <p>Loading user</p>
            {:then user}
                <p>{user.name}</p>
            {:catch error}
                <p>{error.message}</p>
            {/await}
            <small>{currentUser}</small>
        </header>

        <nav>
            {#each items as item}
                <button class:selected={currentPath === item.path} on:click={() => go(item.path)}>{item.label}</button>
            {/each}
        </nav>

        <button class="logout" on:click={logout}>Cerrar sesión</button>
    </aside>

    <main class="content">
        <div class="top-mobile">
            <button class="menu-toggle" on:click={() => (sidebarOpen = !sidebarOpen)}>☰</button>
            <strong>Panel de gestión</strong>
        </div>

        <NavHost
                navController={internalNavController}
                routes={[
                composable(users, () => UserManagement),
                composable(product, () => ProductManagement),
                composable(category, () => CategoryManagement),
                composable(sales, () => SaleManagement),
                composable(promo, () => PromoManagement),
                composable(settings, () => SettingsManagement),
                composable(reservation, () => ReservationManagement)
            ]}
        />
    </main>

    {#if sidebarOpen}
        <button class="scrim" aria-label="Cerrar menú" on:click={() => (sidebarOpen = false)}></button>
    {/if}
</section>

<style>
    .nested-shell { min-height: 100dvh; display: grid; grid-template-columns: 280px 1fr; background: var(--md-sys-color-background); }
    .sidebar { border-right: 1px solid var(--md-sys-color-outline-variant); background: var(--md-sys-color-surface); padding: 14px; display: grid; grid-template-rows: auto 1fr auto; gap: 12px; }
    header h2 { margin: 0; font-size: 1.05rem; } header small { color: var(--md-sys-color-on-surface-variant); }
    nav { display: grid; gap: 8px; align-content: start; }
    nav button,.logout { text-align: left; border: 1px solid var(--md-sys-color-outline-variant); background: transparent; color: var(--md-sys-color-on-surface); border-radius: 10px; padding: 10px; }
    nav button.selected { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-color: var(--md-sys-color-primary); }
    .content { padding: 16px; }
    .top-mobile { display:none; }
    .scrim { display:none; }

    @media (max-width: 860px) {
        .nested-shell { grid-template-columns: 1fr; }
        .sidebar {
            position: fixed; top:0; left:0; bottom:0; width: min(84vw, 320px); z-index: 40;
            transform: translateX(-105%); transition: transform 180ms ease;
            box-shadow: 0 20px 35px rgba(0,0,0,.25);
        }
        .sidebar.open { transform: translateX(0); }
        .content { padding: 12px; }
        .top-mobile { display:flex; gap:10px; align-items:center; margin-bottom:12px; }
        .menu-toggle { width:40px; height:40px; border-radius:10px; border:1px solid var(--md-sys-color-outline-variant); background: var(--md-sys-color-surface); }
        .scrim { display:block; position: fixed; inset: 0; background: color-mix(in srgb, black 30%, transparent); z-index: 20; border:0; }
    }
</style>
