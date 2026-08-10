import type { Sale } from "../entity/Sale"
import { assertBackofficeCannotCreateB2cSale } from "../policy/BackofficeSalePolicy"

/**
 * Core1 6.1 — caso de uso explícito de “crear venta desde panel”.
 * Siempre rechaza: no hay alta B2C ni soft-hold en el dash.
 */
export class CreateSaleFromPanelCaseUse {
    async execute(_sale: Sale): Promise<Sale> {
        assertBackofficeCannotCreateB2cSale()
    }
}
