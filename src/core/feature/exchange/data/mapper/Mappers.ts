import { createCupExchange, type CupExchange } from "../../domain/entity/CupExchange"
import type { CupExchangeDTO } from "../dto/CupExchangeDTO"

export function toDomain(dto: CupExchangeDTO): CupExchange {
    const usdReference = dto.tasas?.USD?.CUP
    const euroReference = dto.tasas?.EUR?.CUP

    if (typeof usdReference !== "number" || !Number.isFinite(usdReference) || usdReference <= 0) {
        throw new Error("No se pudo obtener la tasa USD/CUP del Directorio Cubano.")
    }

    const updatedAt = dto.actualizado ?? new Date().toISOString()
    const day = updatedAt.slice(0, 10)

    return createCupExchange({
        id: `directorioCubano-${day}`,
        usdReference,
        euroReference:
            typeof euroReference === "number" && euroReference > 0 ? euroReference : undefined,
        updatedAt,
        source: "DIRECTORIO_CUBANO",
    })
}
