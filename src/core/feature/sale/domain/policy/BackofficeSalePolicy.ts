/**
 * Core1 4.4 — competencia del panel vs tienda B2C.
 *
 * Soft-hold y alta de pedido `UNVERIFIED` solo ocurren en clientes
 * (web/Android). El back-office supervisa; no origina pedidos de tienda.
 */

export const BACKOFFICE_NO_B2C_CREATE_MESSAGE =
    "Core1 4.4: el panel back-office no puede crear ventas B2C. " +
    "Los pedidos se originan solo en la tienda (web/Android) con soft-hold."

export class BackofficeCannotCreateB2cSaleError extends Error {
    readonly code = "BACKOFFICE_NO_B2C_CREATE" as const

    constructor(message: string = BACKOFFICE_NO_B2C_CREATE_MESSAGE) {
        super(message)
        this.name = "BackofficeCannotCreateB2cSaleError"
    }
}

/**
 * Llamar antes de cualquier intento de persistir una venta nueva desde el panel.
 * Siempre lanza: la política es absoluta en Core 1.
 */
export function assertBackofficeCannotCreateB2cSale(): never {
    throw new BackofficeCannotCreateB2cSaleError()
}

/** true si el error es la política 4.4 (tests / UI). */
export function isBackofficeCannotCreateB2cSaleError(e: unknown): boolean {
    return (
        e instanceof BackofficeCannotCreateB2cSaleError ||
        (e instanceof Error && e.message.includes("Core1 4.4"))
    )
}
