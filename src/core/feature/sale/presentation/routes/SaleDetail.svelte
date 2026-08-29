<script lang="ts">
    import { onMount } from "svelte";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { saleStore } from "../viewmodel/sale.store";
    import { BuyState, DeliveryType } from "../../domain/entity/enums";
    import { saleLineTotal } from "../../domain/entity/Sale";
    import { saleStateLabel } from "../../domain/util/filterSalesByStatus";
    import { formatSaleMoney } from "../../domain/util/formatSaleMoney";
    import {
        ArrowLeft,
        BadgeDollarSign,
        CheckCircle2,
        ChevronDown,
        Clock,
        Hash,
        Package,
        ShieldCheck,
        Truck,
        User,
        XCircle,
    } from "lucide-svelte";
    import { userManagementStore } from "../../../auth/presentation/viewmodel/user-management.store";
    import { productStore } from "../../../product/presentation/viewmodel/product.store";
    import { availableStock } from "../../../product/domain/entity/Product";
    import { sales } from "../../../../infrastructure/presentation/navigation/nested.router";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ id?: string }>;

    const saleId = navBackStackEntry?.args?.id ?? "";
    let loading = false;
    let confirming = false;
    let rejecting = false;
    let showDetails = false;

    $: sale = saleId ? $saleStore.items.find((s) => s.id === saleId) ?? null : null;
    $: user = sale ? $userManagementStore.items.find((u) => u.id === sale.userId) : null;
    $: busy = confirming || rejecting;
    $: canDecide = sale?.verified === BuyState.UNVERIFIED && !busy;

    onMount(() => {
        if (!saleId) return;
        loading = true;
        Promise.all([
            saleStore.syncAll(),
            userManagementStore.syncAll(),
            productStore.syncAll(),
        ])
            .catch((e) => logger.error(e?.message ?? e, e?.stack))
            .finally(() => {
                loading = false;
            });
    });

    function formatIso(value: string | number | Date | null | undefined): string {
        if (value == null || value === "") return "—";
        try {
            const d = value instanceof Date ? value : new Date(value);
            if (Number.isNaN(d.getTime())) return String(value);
            return d.toLocaleString();
        } catch {
            return String(value);
        }
    }

    function deliveryLabel(d: DeliveryType | string | null | undefined): string {
        if (d === DeliveryType.PICKUP || d === "PICKUP") return "Recogida en tienda";
        if (d === DeliveryType.DELIVERY || d === "DELIVERY") return "Envío a domicilio";
        return String(d ?? "—");
    }

    function saleStateClass(state: BuyState | string): string {
        if (state === BuyState.VERIFIED || state === "VERIFIED") return "ok";
        if (state === BuyState.DELETED || state === "DELETED") return "bad";
        return "pending";
    }

    function productDisplayName(productId: string): string {
        const p = $productStore.items.find((x) => x.id === productId);
        if (p?.name?.trim()) return p.name.trim();
        return "Producto no encontrado en catálogo";
    }

    $: currencyCode = (sale as any)?.currency ?? "";

    async function onConfirm() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        if (!window.confirm("¿Confirmar esta venta?\nSe descontará stock y se registrará la salida.")) return;
        confirming = true;
        try {
            await saleStore.confirmSale(sale.id);
            toastStore.success("Venta confirmada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo confirmar.");
        } finally {
            confirming = false;
        }
    }

    async function onReject() {
        if (!sale || sale.verified !== BuyState.UNVERIFIED) return;
        if (!window.confirm("¿Rechazar esta venta?\nSolo se libera el stock reservado.")) return;
        rejecting = true;
        try {
            await saleStore.rejectSale(sale.id);
            toastStore.success("Venta rechazada.");
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo rechazar.");
        } finally {
            rejecting = false;
        }
    }

    $: lineSum = sale?.products?.reduce((acc, p) => acc + saleLineTotal(p), 0) ?? 0;
</script>

<section class="mgmt-page sale-detail" aria-label="Detalle de venta">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <button class="mgmt-btn ghost" type="button" on:click={() => navController.popOrNavigate(sales.path)}>
                <Icon icon={ArrowLeft} size={18} ariaLabel="Volver" />
                Volver a ventas
            </button>
        </div>
    </header>

    {#if !saleId}
        <div class="mgmt-card"><p class="mgmt-muted">Falta el identificador de la venta.</p></div>
    {:else if loading && !sale}
        <div class="mgmt-card"><p class="mgmt-muted">Cargando detalle del pedido…</p></div>
    {:else if !sale}
        <div class="mgmt-card"><p class="mgmt-muted">No se encontró esta venta.</p></div>
    {:else}
        <div class="detail-card">
            <div class="detail-accent" aria-hidden="true"></div>
            <p class="mgmt-muted">Detalle cargado. Usa Volver a ventas para regresar al listado.</p>
        </div>
    {/if}
</section>
