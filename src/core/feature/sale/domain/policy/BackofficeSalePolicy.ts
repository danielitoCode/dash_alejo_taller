/**
 * Core1 — competencia del panel vs tienda B2C (4.4 + 6.1).
 *
 * Soft-hold y alta de pedido `UNVERIFIED` solo ocurren en clientes
 * (web/Android). El back-office supervisa; no origina pedidos ni soft-hold.
 *
 * 6.1: no segundo hold — el panel no incrementa `reserved` por “venta admin”.
 */

export const BACKOFFICE_NO_B2C_CREATE_MESSAGE =
    "Core1 6.1: el panel back-office no puede crear ventas B2C. " +
    "Los pedidos se originan solo en la tienda (web/Android) con soft-hold."

export const BACKOFFICE_NO_SOFT_HOLD_MESSAGE =
    "Core1 6.1: el panel no ejecuta soft-hold (reserved +=). " +
    "Solo clientes al crear UNVERIFIED."

export const BACKOFFICE_USE_CONFIRM_REJECT_MESSAGE =
    "Core1 6.1: no usar updateVerified directo a VERIFIED/DELETED. " +
    "Usar ConfirmSaleFromPanelCaseUse / RejectSaleFromPanelCaseUse (aplican stock)."

export class BackofficeCannotCreateB2cSaleError extends Error {
    readonly code = "BACKOFFICE_NO_B2C_CREATE" as const

    constructor(message: string = BACKOFFICE_NO_B2C_CREATE_MESSAGE) {
        super(message)
        this.name = "BackofficeCannotCreateB2cSaleError"
    }
}

export class BackofficeCannotSoftHoldError extends Error {
    readonly code = "BACKOFFICE_NO_SOFT_HOLD" as const

    constructor(message: string = BACKOFFICE_NO_SOFT_HOLD_MESSAGE) {
        super(message)
        this.name = "BackofficeCannotSoftHoldError"
    }
}

export class BackofficeMustUseConfirmRejectError extends Error {
    readonly code = "BACKOFFICE_USE_CONFIRM_REJECT" as const

    constructor(message: string = BACKOFFICE_USE_CONFIRM_REJECT_MESSAGE) {
        super(message)
        this.name = "BackofficeMustUseConfirmRejectError"
    }
}

/** Siempre lanza: la política es absoluta en Core 1. */
export function assertBackofficeCannotCreateB2cSale(): never {
    throw new BackofficeCannotCreateB2cSaleError()
}

/** El panel no hace reserved += (soft-hold). */
export function assertBackofficeCannotSoftHold(): never {
    throw new BackofficeCannotSoftHoldError()
}

/**
 * Bloquea transiciones de estado terminal vía el path anémico (sin stock).
 * Permitido solo caminos que no mutan stock de forma definitiva.
 */
export function assertNotTerminalBuyStateWithoutStockPath(nextVerified: string): void {
    const v = String(nextVerified || "").trim().toUpperCase()
    if (v === "VERIFIED" || v === "DELETED") {
        throw new BackofficeMustUseConfirmRejectError()
    }
}

export function isBackofficeCannotCreateB2cSaleError(e: unknown): boolean {
    return (
        e instanceof BackofficeCannotCreateB2cSaleError ||
        (e instanceof Error &&
            (e.message.includes("Core1 4.4") || e.message.includes("Core1 6.1")) &&
            e.message.toLowerCase().includes("crear ventas"))
    )
}
