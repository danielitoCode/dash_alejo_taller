import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { SaleFinanceNetRepository } from "../data/repository/sale-finance.net.repository"
import type { SaleFinanceRepository } from "../domain/repository/sale-finance.repository"

const saleFinanceNet = new SaleFinanceNetRepository(
    infrastructureContainer.appwrite.databases
)

export const financeContainer = {
    repositories: {
        saleFinance: saleFinanceNet as SaleFinanceRepository,
    },
}
