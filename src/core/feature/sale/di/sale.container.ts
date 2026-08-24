import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container";
import { SaleNetRepository } from "../data/repository/sale.net.repository";
import { SaleOfflineFirstRepository } from "../data/repository/sale.offline-first.repository";
import { GetSalesCaseUse } from "../domain/caseuse/GetSalesCaseUse";
import { UpdateSaleVerifiedCaseUse } from "../domain/caseuse/UpdateSaleVerifiedCaseUse";
import { ConfirmSaleFromPanelCaseUse } from "../domain/caseuse/ConfirmSaleFromPanelCaseUse";
import { RejectSaleFromPanelCaseUse } from "../domain/caseuse/RejectSaleFromPanelCaseUse";
import ProductNetRepository from "../../product/data/repository/product.net.repository";
import { financeContainer } from "../../finance/di/finance.container";
import { productContainer } from "../../product/di/product.container";
import { inventoryContainer } from "../../inventory/di/inventory.container";
import { authContainer } from "../../auth/di/auth.container";
import { createStockMovement } from "../../inventory/domain/entity/StockMovement";
import type { Sale } from "../domain/entity/Sale";
import { logger } from "../../../infrastructure/presentation/util/logger.service";

const netDatabases = infrastructureContainer.appwrite.databases;

const saleNetRepository = new SaleNetRepository(netDatabases);
const saleOfflineFirstRepository = new SaleOfflineFirstRepository(saleNetRepository);
const productNetRepository = new ProductNetRepository(netDatabases);

const getSalesCaseUse = new GetSalesCaseUse(saleOfflineFirstRepository);
const updateSaleVerifiedCaseUse = new UpdateSaleVerifiedCaseUse(saleOfflineFirstRepository);

const panelFinance = {
    async registerFromVerifiedSale(sale: Sale): Promise<void> {
        const costMap: Record<string, number> = {};
        for (const line of sale.products ?? []) {
            if (!line.productId || line.productId in costMap) continue;
            try {
                const p = await productContainer.repositories.offlineFirst.getById(line.productId);
                costMap[line.productId] = Number(p?.lastUnitCost) || 0;
            } catch (e: any) {
                logger.warn(
                    `[panelFinance] cost lookup failed productId=${line.productId}: ${e?.message ?? e}`
                );
                costMap[line.productId] = 0;
            }
        }
        await financeContainer.useCases.registerFromVerified.execute(
            sale,
            (id) => costMap[id] ?? 0
        );
    },
};

const panelSalidaMovements = {
    async recordSalidaVenta(input: {
        productId: string;
        quantity: number;
        balanceAfter: number;
        saleId: string;
        userId: string;
    }): Promise<void> {
        const movement = createStockMovement({
            id: crypto.randomUUID(),
            productId: input.productId,
            type: "salida_venta",
            quantity: input.quantity,
            balanceAfter: input.balanceAfter,
            reason: "confirm_panel",
            userId: input.userId || "staff",
            saleId: input.saleId,
        });
        await inventoryContainer.repositories.stockMovement.create(movement);
    },
};

async function resolvePanelUserId(): Promise<string> {
    try {
        const user = await authContainer.useCases.accounts.getCurrentUser();
        const id = String(
            (user as { $id?: string })?.$id || (user as { id?: string })?.id || ""
        ).trim();
        return id || "staff";
    } catch {
        return "staff";
    }
}

const confirmSaleFromPanelCaseUse = new ConfirmSaleFromPanelCaseUse(
    saleOfflineFirstRepository,
    productNetRepository,
    panelFinance,
    panelSalidaMovements,
    resolvePanelUserId
);
const rejectSaleFromPanelCaseUse = new RejectSaleFromPanelCaseUse(
    saleOfflineFirstRepository,
    productNetRepository
);

export const saleContainer = {
    repositories: {
        net: saleNetRepository,
        offlineFirst: saleOfflineFirstRepository,
    },
    useCases: {
        getAll: getSalesCaseUse,
        /** @deprecated Prefer confirmFromPanel / rejectFromPanel (Fase 5) — no aplica stock. */
        updateVerified: updateSaleVerifiedCaseUse,
        confirmFromPanel: confirmSaleFromPanelCaseUse,
        rejectFromPanel: rejectSaleFromPanelCaseUse,
    },
};
