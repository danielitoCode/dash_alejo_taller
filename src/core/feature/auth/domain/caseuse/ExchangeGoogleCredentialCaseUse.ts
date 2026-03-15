import type { GoogleAuthExchangeResult, GoogleAuthNetRepository } from "../repository/google-auth.net.repository";

export class ExchangeGoogleCredentialCaseUse {
    constructor(private readonly googleAuthRepo: GoogleAuthNetRepository) {}

    async execute(params: { credential: string; allowCreate?: boolean }): Promise<GoogleAuthExchangeResult> {
        return await this.googleAuthRepo.exchangeCredential(params);
    }
}

