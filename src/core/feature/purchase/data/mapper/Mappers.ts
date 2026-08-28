import type { Supplier } from "../../domain/entity/Supplier"
import { createSupplier } from "../../domain/entity/Supplier"
import type {
    PurchaseEntry,
    PurchaseEntryLine,
} from "../../domain/entity/PurchaseEntry"
import {
    createPurchaseEntry,
    createPurchaseEntryLine,
} from "../../domain/entity/PurchaseEntry"
import { isPurchaseLineConcept } from "../../domain/entity/enums"
import type { SupplierDTO } from "../dto/SupplierDTO"
import type {
    PurchaseEntryDTO,
    PurchaseEntryLineDTO,
} from "../dto/PurchaseEntryDTO"

/** Payload de escritura: `contact` siempre string (Appwrite required). */
export type SupplierWriteDTO = {
    $id?: string
    name: string
    contact: string
    notes?: string
}

export function supplierFromDTO(dto: SupplierDTO): Supplier {
    return createSupplier({
        id: dto.$id,
        name: dto.name,
        contact: dto.contact ?? "",
        notes: dto.notes ?? undefined,
    })
}

export function supplierToDTO(s: Supplier): SupplierWriteDTO {
    const contact =
        s.contact != null && String(s.contact).trim() !== ""
            ? String(s.contact).trim()
            : ""
    const dto: SupplierWriteDTO = {
        $id: s.id,
        name: s.name,
        contact,
    }
    if (s.notes != null && String(s.notes).trim() !== "") {
        dto.notes = String(s.notes).trim()
    }
    return dto
}

export type PurchaseEntryWriteDTO = Pick<
    PurchaseEntryDTO,
    | "supplier_id"
    | "reference"
    | "entry_date"
    | "total_cost"
    | "currency"
    | "user_id"
    | "notes"
    | "line_count"
    | "exchange_rate"
    | "exchange_rate_at"
    | "exchange_rate_source"
> & { $id?: string }

export type PurchaseEntryLineWriteDTO = Pick<
    PurchaseEntryLineDTO,
    | "entry_id"
    | "product_id"
    | "quantity"
    | "unit_cost"
    | "concept"
    | "line_cost"
> & { $id?: string }

export function purchaseEntryFromDTO(dto: PurchaseEntryDTO): PurchaseEntry {
    const currency = (dto.currency || "USD").toUpperCase() === "CUP" ? "CUP" : "USD"
    const rate =
        dto.exchange_rate != null && Number.isFinite(Number(dto.exchange_rate))
            ? Number(dto.exchange_rate)
            : undefined

    if (currency === "CUP" && rate != null && rate > 0) {
        return createPurchaseEntry({
            id: dto.$id,
            supplierId: dto.supplier_id,
            reference: dto.reference,
            entryDateIso: dto.entry_date,
            totalCost: Number(dto.total_cost) || 0,
            currency,
            userId: dto.user_id,
            notes: dto.notes,
            lineCount: Math.trunc(Number(dto.line_count) || 0),
            exchangeRate: rate,
            exchangeRateAt: dto.exchange_rate_at,
            exchangeRateSource:
                dto.exchange_rate_source === "manual" ? "manual" : "DIRECTORIO_CUBANO",
        })
    }

    return {
        id: dto.$id,
        supplierId: dto.supplier_id,
        reference: dto.reference,
        entryDateIso: dto.entry_date,
        totalCost: Number(dto.total_cost) || 0,
        currency,
        userId: dto.user_id,
        notes: dto.notes,
        lineCount: Math.trunc(Number(dto.line_count) || 0),
        exchangeRate: currency === "CUP" ? rate : undefined,
        exchangeRateAt: dto.exchange_rate_at,
        exchangeRateSource:
            dto.exchange_rate_source === "manual" ? "manual" : undefined,
    }
}

export function purchaseEntryToDTO(e: PurchaseEntry): PurchaseEntryWriteDTO {
    const dto: PurchaseEntryWriteDTO = {
        $id: e.id,
        entry_date: e.entryDateIso,
        total_cost: e.totalCost,
        currency: e.currency || "USD",
        user_id: e.userId,
        line_count: e.lineCount,
    }
    if (e.supplierId) dto.supplier_id = e.supplierId
    if (e.reference) dto.reference = e.reference
    if (e.notes) dto.notes = e.notes
    if (e.currency === "CUP" && e.exchangeRate != null && e.exchangeRate > 0) {
        dto.exchange_rate = e.exchangeRate
        if (e.exchangeRateAt) dto.exchange_rate_at = e.exchangeRateAt
        if (e.exchangeRateSource) dto.exchange_rate_source = e.exchangeRateSource
    }
    return dto
}

export function purchaseEntryLineFromDTO(dto: PurchaseEntryLineDTO): PurchaseEntryLine {
    const concept = isPurchaseLineConcept(dto.concept) ? dto.concept : "other"
    return createPurchaseEntryLine({
        id: dto.$id,
        entryId: dto.entry_id,
        productId: dto.product_id,
        quantity: Math.trunc(Number(dto.quantity) || 0),
        unitCost: Number(dto.unit_cost) || 0,
        concept,
        lineCost: Number(dto.line_cost) || 0,
    })
}

export function purchaseEntryLineToDTO(line: PurchaseEntryLine): PurchaseEntryLineWriteDTO {
    return {
        $id: line.id,
        entry_id: line.entryId,
        product_id: line.productId,
        quantity: line.quantity,
        unit_cost: line.unitCost,
        concept: line.concept,
        line_cost: line.lineCost,
    }
}
