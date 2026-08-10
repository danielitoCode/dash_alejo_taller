/**
 * Core1 5.x — misma aritmética que `ApplyOperatorStockDecisionCaseUse` (operador).
 *
 * VERIFIED (confirm): existence -= qty, reserved -= qty (floor 0)
 * DELETED  (reject):  existence sin cambio, reserved -= qty (floor 0)
 */

export function clampNonNegative(n: number): number {
    const v = Number(n)
    if (!Number.isFinite(v)) return 0
    return Math.max(0, Math.trunc(v))
}

export function nextStockAfterConfirm(
    existence: number,
    reserved: number,
    qty: number
): { existence: number; reserved: number } {
    const q = clampNonNegative(qty)
    const ex = clampNonNegative(existence)
    const rs = clampNonNegative(reserved)
    return {
        existence: clampNonNegative(ex - q),
        reserved: clampNonNegative(rs - q),
    }
}

export function nextStockAfterReject(
    existence: number,
    reserved: number,
    qty: number
): { existence: number; reserved: number } {
    const q = clampNonNegative(qty)
    const ex = clampNonNegative(existence)
    const rs = clampNonNegative(reserved)
    return {
        existence: ex,
        reserved: clampNonNegative(rs - q),
    }
}
