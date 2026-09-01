export type TransactionId = string | undefined

/**
 * Boundary agnóstica para operaciones de dominio que necesitan atomicidad.
 * La implementación de producción usa Appwrite Client SDK; tests pueden omitirla.
 */
export interface TransactionRunner {
    run<T>(work: (transactionId: string) => Promise<T>): Promise<T>
}
