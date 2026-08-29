import type { PurchaseEntry } from "../entity/PurchaseEntry"
import type {
    ListPurchaseEntriesOpts,
    PurchaseEntryRepository,
} from "../repository/purchase.repository"

/** Core 3 B2 — listado de facturas de entrada. */
export class ListPurchaseEntriesCaseUse {
    constructor(private readonly repo: PurchaseEntryRepository) {}

    execute(opts?: ListPurchaseEntriesOpts): Promise<PurchaseEntry[]> {
        return this.repo.listEntries(opts ?? { limit: 50 })
    }
}
