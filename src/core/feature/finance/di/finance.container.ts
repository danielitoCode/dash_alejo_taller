import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { authContainer } from "../../auth/di/auth.container"
import { SaleFinanceNetRepository } from "../data/repository/sale-finance.net.repository"
import type { SaleFinanceRepository } from "../domain/repository/sale-finance.repository"
import { RegisterSaleFinanceFromVerifiedCaseUse } from "../domain/caseuse/RegisterSaleFinanceFromVerifiedCaseUse"

const saleFinanceNet = new SaleFinanceNetRepository(
    infrastructureContainer.appwrite.databases
)

async function resolveStaffUserId(): Promise<string> {
    try {
        const user = await authContainer.useCases.accounts.getCurrentUser()
        const id = String(
            (user as { $id?: string })?.$id || (user as { id?: string })?.id || ""
        ).trim()
        return id || "staff"
    } catch {
        return "staff"
    }
}

const registerFromVerified = new RegisterSaleFinanceFromVerifiedCaseUse(
    saleFinanceNet as SaleFinanceRepository,
    resolveStaffUserId
)

export const financeContainer = {
    repositories: {
        saleFinance: saleFinanceNet as SaleFinanceRepository,
    },
    useCases: {
        registerFromVerified,
    },
}
