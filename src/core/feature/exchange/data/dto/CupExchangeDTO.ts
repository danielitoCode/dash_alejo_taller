export interface CurrencyRateDTO {
    CUP: number | null
    MLC?: number | null
    USD?: number | null
}

/** Payload Directorio Cubano / widgets.directoriocubano.info/api/tasas */
export interface CupExchangeDTO {
    ok?: boolean
    fecha?: string
    hora?: string
    actualizado?: string
    tasas: Record<string, CurrencyRateDTO>
}
