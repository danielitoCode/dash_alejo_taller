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
    import { normalizeBusinessRole, type BusinessRole } from "../../../feature/auth/domain/entity/BusinessRole";
    import {
        canAccessRoute,
        getFirstAllowedRoute,
    } from "../../../feature/auth/domain/config/RoleConfig";
    import CategoryManagement from "../../../feature/category/presentation/routes/CategoryManagement.svelte";
    import ProductManagement from "../../../feature/product/presentation/routes/ProductManagement.svelte";
    import { categoryStore } from "../../../feature/category/presentation/viewmodel/category.store";
    import { productStore } from "../../../feature/product/presentation/viewmodel/product.store";
    import { promotionStore } from "../../../feature/notification/presentation/viewmodel/promotion.store";
    import PromoManagement from "../../../feature/notification/presentation/routes/PromoManagement.svelte";
    import SaleManagement from "../../../feature/sale/presentation/routes/SaleManagement.svelte";
    import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store";
    import UserManagement from "../../../feature/auth/presentation/routes/UserManagement.svelte";
    import Icon from "../components/Icon.svelte";
    import DashboardHome from "../routes/DashboardHome.svelte";
    import SettingsManagement from "../routes/SettingsManagement.svelte";
    import ReservationManagement from "../routes/ReservationManagement.svelte";
    import InventoryTrace from "../../../feature/inventory/presentation/routes/InventoryTrace.svelte";
    import { toastStore } from "../viewmodel/toast.store";
    import { logger } from "../util/logger.service";
    import RealtimeDock from "../components/RealtimeDock.svelte";
    import SupportInbox from "../../../feature/support/presentation/routes/SupportInbox.svelte";
    import { supportInboxStore } from "../../../feature/support/presentation/viewmodel/support-inbox.store";
    import { category, dashboard, inventory, product, promo, reservation, sales, settings, support, users } from "./nested.router";
    import { subscribePulseChannelAll } from "../../data/alset-pulse/pulse.realtime";
    import { pulseRefreshTargets } from "../../data/alset-pulse/pulse.refresh-targets";
    import {
        parseStockChangedPayload,
        subscribeStockChanged,
    } from "../../data/alset-pulse/stock-pulse";
    import { client } from "../../di/appwrite.config";
    import { ENV } from "../../env";
    import SupportDetail from "../../../feature/support/presentation/routes/SupportDetail.svelte";
    import SaleDetail from "../../../feature/sale/presentation/routes/SaleDetail.svelte";
    import { supportDetail, salesDetail } from "./nested.router";
    import { get } from "svelte/store";
    import { BuyState } from "../../../feature/sale/domain/entity/enums";
    import {
        BadgeDollarSign,
        CalendarCheck2,
        ClipboardList,
        Home,
        LogOut,
        Menu,
        MessageSquareText,
        Megaphone,
        Package,
        Settings,
        Tags,
        Users
    } from "lucide-svelte";

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
        { label: "Ventas", path: sales.path, icon: BadgeDollarSign },
        { label: "Promos", path: promo.path, icon: Megaphone },
        { label: "Reservas", path: reservation.path, icon: CalendarCheck2 },
        { label: "Ajustes", path: settings.path, icon: Settings }
    ];

    function canAccess(path: string): boolean {
        return canAccessRoute(currentRole, path);
    }

    function firstAllowedPath(role: BusinessRole): string {
        return getFirstAllowedRoute(role);
    }

    const internalStackStore = internalNavController._getStackStore();
    $: internalStack = $internalStackStore;
    $: currentPath = internalStack.at(-1)?.route ?? dashboard.path;
    $: visibleItems = items.filter((item) => canAccessRoute(currentRole, item.path));
    $: if (currentRole && currentPath && !canAccessRoute(currentRole, currentPath)) {
        const allowedPath = firstAllowedPath(currentRole);
        if (allowedPath !== currentPath) {
            logger.info(`[NestedNav] 3.1 ruta bloqueada path=${currentPath} role=${currentRole} → ${allowedPath}`);
            toastStore.error("Tu rol no tiene acceso a esta sección.");
            internalNavController.navigate(allowedPath);
        }
    }

    let sidebarOpen = false;
    let stopPulseRefresh: (() => void) | null = null;
    let stopStockFanout: (() => void) | null = null;
    let stopAppwriteProductRt: (() => void) | null = null;
    let supportSyncTimer: number | null = null;
    let salesSyncTimer: number | null = null;
    let stockSyncTimer: number | null = null;
    let pendingStockIds: string[] = [];
    let syncingSupport = false;
    let syncingSales = false;
    let syncingStock = false;
    let queuedSupport = false;
    let queuedSales = false;

    function go(path: string) {
        if (!canAccessRoute(currentRole, path)) {
            toastStore.error("Tu rol no tiene acceso a esta sección.");
            sidebarOpen = false;
            return;
        }
        if (currentPath !== path) internalNavController.navigate(path);
        sidebarOpen = false;
    }

    async function refreshUserRole() {
        try {
            logger.info("[NestedNav] Refrescando rol del usuario...");
            const u = await authContainer.useCases.accounts.getCurrentUser();
            const newRole = normalizeBusinessRole(u.role);
            const oldRole = currentRole;

            if (newRole !== oldRole) {
                logger.info(`[NestedNav] Rol actualizado: ${oldRole} → ${newRole}`);
                currentRole = newRole;
                toastStore.success(`✅ Rol actualizado a: ${newRole}`);

                const allowedPath = firstAllowedPath(currentRole);
                if (!canAccessRoute(currentRole, currentPath)) {
                    internalNavController.navigate(allowedPath);
                }
            } else {
                logger.info(`[NestedNav] El rol sigue siendo: ${currentRole}`);
                toastStore.info(`El rol es: ${currentRole}`);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            logger.error(`[NestedNav] Error refrescando rol: ${msg}`, stack);
            toastStore.error("Error al refrescar rol");
        }
    }

    async function logout() {
        try {
            await authContainer.useCases.sessions.closeSession.execute();
        } finally {
            navController.navigate("welcome");
        }
    }

    function scheduleStockRefresh(productIds: string[]) {
        for (const id of productIds) {
            if (id && !pendingStockIds.includes(id)) pendingStockIds.push(id);
        }
        if (stockSyncTimer) window.clearTimeout(stockSyncTimer);
        stockSyncTimer = window.setTimeout(() => {
            stockSyncTimer = null;
            void flushStockRefresh();
        }, 180);
    }

    async function flushStockRefresh() {
        if (syncingStock) {
            if (stockSyncTimer) window.clearTimeout(stockSyncTimer);
            stockSyncTimer = window.setTimeout(() => {
                stockSyncTimer = null;
                void flushStockRefresh();
            }, 220);
            return;
        }
        const ids = pendingStockIds.splice(0, pendingStockIds.length);
        syncingStock = true;
        try {
            if (ids.length > 0) {
                await productStore.handleStockChanged(ids);
            } else {
                await productStore.syncAll();
            }
        } catch (e: any) {
            logger.error(`[stock-rt] refresh failed: ${e?.message ?? e}`, e?.stack);
        } finally {
            syncingStock = false;
        }
    }
