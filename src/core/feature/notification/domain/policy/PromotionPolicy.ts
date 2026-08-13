import type { Promotion } from "../entity/Promotion"

/**
 * Política B — promociones (canónica 2026-08-13).
 * Ver `.policies/notification/PROMOTION_POLICY.md`.
 */

export type PromotionKind = "product_discount" | "banner"

export function discountPercent(oldPrice: number, promoPrice: number): number {
    const oldP = Number(oldPrice)
    const promo = Number(promoPrice)
    if (!Number.isFinite(oldP) || oldP <= 0) return 0
    if (!Number.isFinite(promo) || promo < 0) return 0
    if (promo >= oldP) return 0
    return ((oldP - promo) / oldP) * 100
}

/** Infer kind until Appwrite field `kind` is universal. */
export function resolvePromotionKind(promo: Pick<Promotion, "productId"> & { kind?: string }): PromotionKind {
    if (promo.kind === "banner" || promo.kind === "product_discount") {
        return promo.kind
    }
    const pid = promo.productId
    if (pid === undefined || pid === null || String(pid).trim() === "") {
        return "banner"
    }
    return "product_discount"
}

export function isPromotionWindowActive(
    promo: Pick<Promotion, "validFromEpochMillis" | "validUntilEpochMillis">,
    nowEpochMillis: number
): boolean {
    const now = Number(nowEpochMillis)
    return (
        now >= Number(promo.validFromEpochMillis) &&
        now <= Number(promo.validUntilEpochMillis)
    )
}

/**
 * Promo que puede afectar precio de un producto.
 */
export function isActiveProductDiscount(
    promo: Promotion & { kind?: string; status?: string },
    nowEpochMillis: number
): boolean {
    if (resolvePromotionKind(promo) !== "product_discount") return false
    const status = promo.status
    if (status === "cancelled" || status === "ended" || status === "draft") return false
    if (!promo.productId || String(promo.productId).trim() === "") return false
    return isPromotionWindowActive(promo, nowEpochMillis)
}

/**
 * Banner informativo activo (sin mutar precio).
 */
export function isActiveBanner(
    promo: Promotion & { kind?: string; status?: string },
    nowEpochMillis: number
): boolean {
    if (resolvePromotionKind(promo) !== "banner") return false
    const status = promo.status
    if (status === "cancelled" || status === "ended" || status === "draft") return false
    return isPromotionWindowActive(promo, nowEpochMillis)
}

/**
 * Precio de venta efectivo (política B).
 * listPrice = product.price (catálogo).
 */
export function effectivePrice(
    listPrice: number,
    productId: string,
    promos: Array<Promotion & { kind?: string; status?: string }>,
    nowEpochMillis: number = Date.now()
): number {
    const list = Number(listPrice)
    const base = Number.isFinite(list) && list >= 0 ? list : 0
    const pid = String(productId || "").trim()
    if (!pid) return base

    const active = promos.filter(
        (p) =>
            isActiveProductDiscount(p, nowEpochMillis) &&
            String(p.productId).trim() === pid
    )
    if (active.length === 0) return base

    active.sort((a, b) => {
        const pa = Number(a.currentPrice)
        const pb = Number(b.currentPrice)
        if (Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb) return pa - pb
        return Number(b.validFromEpochMillis) - Number(a.validFromEpochMillis)
    })
    const chosen = Number(active[0].currentPrice)
    if (!Number.isFinite(chosen) || chosen < 0) return base
    return chosen
}

export interface PromotionValidationError {
    code: string
    message: string
}

/**
 * Validación al crear/activar desde el panel.
 * - product_discount: precios + productId + unicidad
 * - banner: sin productId
 */
export function validatePromotionForSave(
    input: Promotion & { kind?: string },
    existing: Array<Promotion & { kind?: string; status?: string }>,
    nowEpochMillis: number = Date.now()
): PromotionValidationError[] {
    const errors: PromotionValidationError[] = []
    const kind = resolvePromotionKind(input)

    if (!String(input.title || "").trim()) {
        errors.push({ code: "title", message: "El título es obligatorio" })
    }
    if (!String(input.message || "").trim()) {
        errors.push({ code: "message", message: "El mensaje es obligatorio" })
    }
    if (Number(input.validFromEpochMillis) > Number(input.validUntilEpochMillis)) {
        errors.push({ code: "window", message: "La fecha de inicio no puede ser posterior al fin" })
    }

    if (kind === "banner") {
        if (input.productId && String(input.productId).trim() !== "") {
            errors.push({
                code: "banner_product",
                message: "Una promo banner no debe llevar productId",
            })
        }
        return errors
    }

    // product_discount
    const pid = String(input.productId || "").trim()
    if (!pid) {
        errors.push({ code: "productId", message: "product_discount requiere productId" })
    }

    const oldP = Number(input.oldPrice)
    const promoP = Number(input.currentPrice)
    if (!Number.isFinite(oldP) || oldP <= 0) {
        errors.push({ code: "oldPrice", message: "oldPrice debe ser > 0" })
    }
    if (!Number.isFinite(promoP) || promoP < 0) {
        errors.push({ code: "promoPrice", message: "promoPrice debe ser >= 0" })
    }
    if (Number.isFinite(oldP) && Number.isFinite(promoP) && promoP >= oldP) {
        errors.push({
            code: "promoPrice",
            message: "promoPrice debe ser menor que oldPrice",
        })
    }

    if (pid) {
        const conflict = existing.find(
            (p) =>
                p.id !== input.id &&
                isActiveProductDiscount(p, nowEpochMillis) &&
                String(p.productId).trim() === pid
        )
        if (conflict) {
            errors.push({
                code: "unique_active",
                message: `Ya existe una promo activa para este producto (${conflict.id})`,
            })
        }
    }

    return errors
}
