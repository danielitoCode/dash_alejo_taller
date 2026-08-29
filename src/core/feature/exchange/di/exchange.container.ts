import { ExchangeNetRepository } from "../data/repository/exchange.net.repository"
import { ExchangeOfflineFirstRepository } from "../data/repository/exchange-offline-first.repository"
import { GetTodayExchangeCaseUse } from "../domain/caseuse/GetTodayExchangeCaseUse"
import { GetCachedTodayExchangeCaseUse } from "../domain/caseuse/GetCachedTodayExchangeCaseUse"

const net = new ExchangeNetRepository()
const repo = new ExchangeOfflineFirstRepository(net)

export const exchangeContainer = {
    repositories: { exchange: repo },
    useCases: {
        getToday: new GetTodayExchangeCaseUse(repo),
        getCachedToday: new GetCachedTodayExchangeCaseUse(repo),
    },
}
