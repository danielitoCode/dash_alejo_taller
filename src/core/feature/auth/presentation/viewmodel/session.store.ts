import { derived, writable } from "svelte/store";
import { infrastructureContainer } from "../../../../infrastructure/di/infrastructure.container";
import { getAuthPort, isExternalAuthProvider } from "../../di/authPort.factory";
import { userLikeFromAuthSession } from "../../domain/util/authSessionBridge";

interface SessionState {
    loading: boolean;
    error: string | null;
    lastAction: string | null;
}

const initialState: SessionState = {
    loading: false,
    error: null,
    lastAction: null,
};

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createSessionStore() {
    const { subscribe, update } = writable<SessionState>(initialState);

    async function runAction<T>(actionName: string, task: () => Promise<T>): Promise<T> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            const result = await task();
            update((state) => ({ ...state, lastAction: actionName }));
            return result;
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    async function getCurrentUser(): Promise<Record<string, unknown>> {
        return runAction("getCurrentUser", async () => {
            if (isExternalAuthProvider()) {
                const auth = getAuthPort();
                if (!auth) throw new Error("Clerk no configurado");
                await auth.init();
                const session = await auth.getSession();
                if (!session) throw new Error("No hay sesión autenticada");
                const u = userLikeFromAuthSession(session);
                return {
                    ...u,
                    $id: u.id,
                    id: u.id,
                };
            }
            return infrastructureContainer.appwrite.account.get() as Promise<
                Record<string, unknown>
            >;
        });
    }

    function clearError(): void {
        update((state) => ({ ...state, error: null }));
    }

    function reset(): void {
        update(() => initialState);
    }

    const hasError = derived({ subscribe }, ($state) => $state.error !== null);

    return {
        subscribe,
        hasError,
        getCurrentUser,
        clearError,
        reset,
    };
}

export const sessionStore = createSessionStore();
