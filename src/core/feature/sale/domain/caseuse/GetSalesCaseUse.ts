import type {Databases} from "appwrite";
import type {SaleRepository} from "../repository/SaleRepository";
import type {Sale} from "../entity/Sale";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

export class GetSalesCaseUse {
    constructor(private salesRepository: SaleRepository) {}
    async execute(): Promise<Sale[]> {
        let response = await this.salesRepository.getAllSales()
        logger.log(`GetSalesCaseUse.execute() ${response}`)
        return response
    }
}