import type { SupportMessage } from "../entity/SupportMessage";
import type { SupportRepository } from "../repository/support.repository";

/** Inbox panel: lista de hilos como filas SupportMessage. */
export class GetAllSupportMessagesCaseUse {
    constructor(private readonly repo: SupportRepository) {}

    async execute(): Promise<SupportMessage[]> {
        return await this.repo.getAll();
    }
}
