import type { Sale } from "../entity/Sale"
import type { SaleRepository } from "../repository/SaleRepository"
import { assertNotTerminalBuyStateWithoutStockPath } from "../policy/BackofficeSalePolicy"

/**
 * Path legacy: solo escritura de buy_state.
 *
 * Core1 6.1: **no** permite VERIFIED ni DELETED (eso requiere stock vía
 * ConfirmSaleFromPanelCaseUse / RejectSaleFromPanelCaseUse).
 * Conservado por compatibilidad de firma; no usar desde UI de decisión.
 */
export class UpdateSaleVerifiedCaseUse {
    constructor(private salesRepository: SaleRepository) {}

    async execute(id: string, verified: string): Promise<Sale> {
        assertNotTerminalBuyStateWithoutStockPath(verified)
        return await this.salesRepository.updateVerified(id, verified)
    }
}
