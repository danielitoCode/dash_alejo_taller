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

const confirmSaleFromPanelCaseUse = new ConfirmSaleFromPanelCaseUse(
    saleOfflineFirstRepository,
    productNetRepository,
    panelFinance
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
