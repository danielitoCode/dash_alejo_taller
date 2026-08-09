/**
 * Core1 4.3 — formateo de importes del documento Sale.
 * Usa `currency` del pedido del cliente; si falta, no inventa USD.
 */
export function formatSaleMoney(
    amount: number,
    currency: string | null | undefined
): string {
    const n = Number(amount)
    const value = Number.isFinite(n) ? n : 0
    const code = (currency || "").trim().toUpperCase()

    if (code) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: code,
                maximumFractionDigits: 2,
            }).format(value)
        } catch {
            return `${value.toFixed(2)} ${code}`
        }
    }

    return value.toFixed(2)
}

export function saleCurrencyCode(currency: string | null | undefined): string | null {
    const code = (currency || "").trim().toUpperCase()
    return code || null
}
