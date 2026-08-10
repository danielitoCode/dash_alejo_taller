import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container";
import { SaleNetRepository } from "../data/repository/sale.net.repository";
import { SaleOfflineFirstRepository } from "../data/repository/sale.offline-first.repository";
import { GetSalesCaseUse } from "../domain/caseuse/GetSalesCaseUse";
import { UpdateSaleVerifiedCaseUse } from "../domain/caseuse/UpdateSaleVerifiedCaseUse";
import { ConfirmSaleFromPanelCaseUse } from "../domain/caseuse/ConfirmSaleFromPanelCaseUse";
import { RejectSaleFromPanelCaseUse } from "../domain/caseuse/RejectSaleFromPanelCaseUse";
import ProductNetRepository from "../../product/data/repository/product.net.repository";

const netDatabases = infrastructureContainer.appwrite.databases;

const saleNetRepository = new SaleNetRepository(netDatabases);
const saleOfflineFirstRepository = new SaleOfflineFirstRepository(saleNetRepository);
const productNetRepository = new ProductNetRepository(netDatabases);

const getSalesCaseUse = new GetSalesCaseUse(saleOfflineFirstRepository);
const updateSaleVerifiedCaseUse = new UpdateSaleVerifiedCaseUse(saleOfflineFirstRepository);
const confirmSaleFromPanelCaseUse = new ConfirmSaleFromPanelCaseUse(
    saleOfflineFirstRepository,
    productNetRepository
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
