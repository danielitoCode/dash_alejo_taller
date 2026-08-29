import { ENV } from "../../../../infrastructure/env"
import type { CupExchangeDTO } from "../dto/CupExchangeDTO"

export class ExchangeNetRepository {
    private get baseUrl(): string {
        const url = String(ENV.directorioCubanoApiUrl || "").trim()
        if (!url) {
            throw new Error("VITE_DIRECTORIO_CUBANO_API_URL no está configurado")
        }
        return url.replace(/\/+$/, "")
    }

    async getExchangeToday(): Promise<CupExchangeDTO> {
        const res = await fetch(this.baseUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
        })
        const text = await res.text()
        if (!res.ok) {
            throw new Error(`directorioCubano respondió ${res.status}: ${text || res.statusText}`)
        }
        try {
            return JSON.parse(text || "{}") as CupExchangeDTO
        } catch {
            throw new Error("El servidor de cambio directorioCubano devolvió una respuesta inválida.")
        }
    }
}
