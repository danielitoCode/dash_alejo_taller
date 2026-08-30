<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { fade } from "svelte/transition";
    import type { NavBackStackEntry } from "../../../../lib/navigation/NavBackStackEntry";
    import type { NavController } from "../../../../lib/navigation/NavController";
    import NavHost from "../../../../lib/navigation/NavHost.svelte";
    import { composable } from "../../../../lib/navigation/composable";
    import { rememberNavController } from "../../../../lib/navigation/rememberNavController";
    import { authContainer } from "../../../feature/auth/di/auth.container";
    import { sessionStore } from "../../../feature/auth/presentation/viewmodel/session.store";
    import { type BusinessRole } from "../../../feature/auth/domain/entity/BusinessRole";
    import {
        canAccessRoute,
        getFirstAllowedRoute,
    } from "../../../feature/auth/domain/config/RoleConfig";
    import CategoryManagement from "../../../feature/category/presentation/routes/CategoryManagement.svelte";
    import ProductManagement from "../../../feature/product/presentation/routes/ProductManagement.svelte";
    import PromoManagement from "../../../feature/notification/presentation/routes/PromoManagement.svelte";
    import SaleManagement from "../../../feature/sale/presentation/routes/SaleManagement.svelte";
    import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store";
    import { reservationStore } from "../../../feature/reservation/presentation/viewmodel/reservation.store";
    import UserManagement from "../../../feature/auth/presentation/routes/UserManagement.svelte";
    import SupplierManagement from "../../../feature/purchase/presentation/routes/SupplierManagement.svelte";
    import PurchaseHistory from "../../../feature/purchase/presentation/routes/PurchaseHistory.svelte";
    import Icon from "../components/Icon.svelte";
    import DashboardHome from "../routes/DashboardHome.svelte";
    import SettingsManagement from "../routes/SettingsManagement.svelte";
    import ReservationManagement from "../routes/ReservationManagement.svelte";
    import InventoryTrace from "../../../feature/inventory/presentation/routes/InventoryTrace.svelte";
    import { toastStore } from "../viewmodel/toast.store";
    import { logger } from "../util/logger.service";
    import SupportInbox from "../../../feature/support/presentation/routes/SupportInbox.svelte";
    import { supportInboxStore } from "../../../feature/support/presentation/viewmodel/support-inbox.store";
    import {
        category,
        dashboard,
        inventory,
        product,
        promo,
        purchases,
        reservation,
        sales,
        settings,
        support,
        suppliers,
        users,
    } from "./nested.router";
    import SupportDetail from "../../../feature/support/presentation/routes/SupportDetail.svelte";
    import SaleDetail from "../../../feature/sale/presentation/routes/SaleDetail.svelte";
    import { supportDetail, salesDetail } from "./nested.router";
    import { BuyState } from "../../../feature/sale/domain/entity/enums";
    import {
        BadgeDollarSign,
        CalendarCheck2,
        FileStack,
        Home,
        LogOut,
        Menu,
        MessageSquareText,
        Megaphone,
        Package,
        ClipboardList,
        Settings,
        Tags,
        Truck,
        Users,
    } from "lucide-svelte";
    import { createNestedNavRuntime } from "./nested-nav-runtime";
    import "./nested-shell.css";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const internalNavController = rememberNavController(dashboard.path);
    const userId = navBackStackEntry?.args?.id ?? "usuario";

    const currentUser = sessionStore.getCurrentUser();
    let currentRole: BusinessRole = "viewer";

    const items = [
        { label: "Principal", path: dashboard.path, icon: Home },
        { label: "Mensajes", path: support.path, icon: MessageSquareText },
        { label: "Usuarios", path: users.path, icon: Users },
        { label: "Productos", path: product.path, icon: Package },
        { label: "Inventario", path: inventory.path, icon: ClipboardList },
        { label: "Categorías", path: category.path, icon: Tags },
        { label: "Proveedores", path: suppliers.path, icon: Truck },
        { label: "Compras", path: purchases.path, icon: FileStack },
        { label: "Ventas", path: sales.path, icon: BadgeDollarSign },
        { label: "Promos", path: promo.path, icon: Megaphone },
        { label: "Reservas", path: reservation.path, icon: CalendarCheck2 },
        { label: "Ajustes", path: settings.path, icon: Settings },
    ];

    function firstAllowedPath(role: BusinessRole): string {
        return getFirstAllowedRoute(role);
    }

    const internalStackStore = internalNavController._getStackStore();
    $: internalStack = $internalStackStore;
    $: currentPath = internalStack.at(-1)?.route ?? dashboard.path;
    $: visibleItems = items.filter((item) => canAccessRoute(currentRole, item.path));

    // Badges: ventas + reservas + mensajes
    $: pendingSalesCount = ($saleStore.items ?? []).filter(
        (s) => s.verified === BuyState.UNVERIFIED
    ).length;
    $: pendingReservationsCount = ($reservationStore.items ?? []).filter(
        (r) => r.status === "requested"
    ).length;
    $: supportPendingNuevo = ($supportInboxStore.items ?? []).filter(
        (m) => m.status === "nuevo"
    ).length;

    function navBadge(path: string): number {
        if (path === sales.path) return pendingSalesCount;
        if (path === reservation.path) return pendingReservationsCount;
        if (path === support.path) return supportPendingNuevo;
        return 0;
    }

    $: if (currentRole && currentPath && !canAccessRoute(currentRole, currentPath)) {
        const allowedPath = firstAllowedPath(currentRole);
        if (allowedPath !== currentPath) {
            logger.info(
                `[NestedNav] 3.1 ruta bloqueada path=${currentPath} role=${currentRole} → ${allowedPath}`
            );
            toastStore.error("Tu rol no tiene acceso a esta sección.");
            internalNavController.navigate(allowedPath);
        }
    }

    let sidebarOpen = false;
    let stopSupportRt: (() => void) | null = null;

    function go(path: string) {
        if (!canAccessRoute(currentRole, path)) {
            toastStore.error("Tu rol no tiene acceso a esta sección.");
            sidebarOpen = false;
            return;
        }
        if (currentPath !== path) internalNavController.navigate(path);
        sidebarOpen = false;
    }

    // RT + sync de stores: nested-nav-runtime (no duplicar onMount de master)
    const runtime = createNestedNavRuntime({
        getRole: () => currentRole,
        setRole: (r) => {
            currentRole = r;
        },
        getPath: () => currentPath,
        firstAllowedPath,
        internalNavigate: (p) => internalNavController.navigate(p),
        outerNavigate: navController,
    });

    async function refreshUserRole() {
        await runtime.refreshUserRole();
    }

    async function logout() {
        try {
            await authContainer.useCases.sessions.closeSession.execute();
        } finally {
            navController.navigate("welcome");
        }
    }

    onMount(() => {
        runtime.mount();
        void reservationStore.load("all").catch(() => {});
        supportInboxStore.syncAll().catch(() => {});
        stopSupportRt = supportInboxStore.startRealtime();
    });

    onDestroy(() => {
        runtime.destroy();
        stopSupportRt?.();
        stopSupportRt = null;
        supportInboxStore.stopRealtime();
    });
</script>

<section class="nested-shell">
    <aside class="sidebar {sidebarOpen ? 'open' : ''}">
        <header class="sidebar-head">
            <div class="brand">
                <img src="/alejoicon_clean.svg" alt="Logo" class="brand-logo" />
                <div class="brand-meta">
                    <h2>Business Dashboard</h2>
                    {#await currentUser}
                        <p>Loading user...</p>
                    {:then user}
                        <p>{user.name} · {currentRole}</p>
                    {:catch error}
                        <p>{error.message}</p>
                    {/await}
                </div>
            </div>
        </header>

        <nav class="sidebar-nav" aria-label="Menú">
            {#each visibleItems as item}
                {@const badge = navBadge(item.path)}
                <button
                        class:selected={currentPath === item.path ||
                        (item.path === support.path && currentPath === supportDetail.path)}
                        on:click={() => go(item.path)}
                        aria-current={currentPath === item.path ? "page" : undefined}
                        title={badge > 0 ? `${item.label} (${badge} pendientes)` : item.label}
                >
                    <span class="nav-ico-wrap">
                        <Icon icon={item.icon} size={18} className="nav-ico" ariaLabel={item.label} />
                        {#if badge > 0}
                            <span class="nav-badge" aria-label="{badge} pendientes">
                                {badge > 99 ? "99+" : badge}
                            </span>
                        {/if}
                    </span>
                    <span class="nav-label">{item.label}</span>
                </button>
            {/each}
        </nav>

        <button class="logout" on:click={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon icon={LogOut} size={18} className="nav-ico" ariaLabel="Cerrar sesión" />
            <span class="logout-label">Cerrar sesión</span>
        </button>
    </aside>

    <main class="content">
        <div class="top-mobile">
            <button
                    class="menu-toggle"
                    type="button"
                    aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                    on:click={() => (sidebarOpen = !sidebarOpen)}
            >
                <Icon icon={Menu} size={20} className="menu-ico" ariaLabel="Menú" />
            </button>
            <strong>Panel de gestión</strong>
            <button
                    class="refresh-role-btn"
                    title="Refrescar rol (si lo cambiaste en AppWrite)"
                    on:click={refreshUserRole}
                    aria-label="Refrescar rol"
            >
                🔄
            </button>
            <span class="ghost" aria-hidden="true">{userId}</span>
        </div>

        {#key currentPath}
            <div class="route-stage" in:fade={{ duration: 120 }}>
                <NavHost
                        navController={internalNavController}
                        routes={[
                        composable(dashboard, () => DashboardHome),
                        composable(support, () => SupportInbox),
                        composable(supportDetail, () => SupportDetail),
                        composable(users, () => UserManagement),
                        composable(product, () => ProductManagement),
                        composable(inventory, () => InventoryTrace),
                        composable(category, () => CategoryManagement),
                        composable(suppliers, () => SupplierManagement),
                        composable(purchases, () => PurchaseHistory),
                        composable(sales, () => SaleManagement),
                        composable(salesDetail, () => SaleDetail),
                        composable(promo, () => PromoManagement),
                        composable(settings, () => SettingsManagement),
                        composable(reservation, () => ReservationManagement),
                    ]}
                />
            </div>
        {/key}
    </main>

    {#if sidebarOpen}
        <button class="scrim" aria-label="Cerrar menú" on:click={() => (sidebarOpen = false)}></button>
    {/if}
</section>
