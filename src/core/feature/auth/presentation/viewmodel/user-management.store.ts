import { derived, writable } from "svelte/store";
import { authContainer } from "../../di/auth.container";
import type { User } from "../../domain/entity/User";
import type { BusinessRole } from "../../domain/entity/BusinessRole";
import {
    assertCanAssignRole,
    assignableRoles,
    getRoleLabels,
    resolveBusinessRole,
} from "../../domain/config/RoleConfig";

export type { BusinessRole };

export interface ManagedBusinessUser {
    id: string;
    name: string;
    email: string;
    photoUrl: string;
    role: BusinessRole;
    blocked: boolean;
    verified: boolean;
    passwordResetRequested: boolean;
}

interface UserManagementState {
    items: ManagedBusinessUser[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    managerRole: BusinessRole | null;
}

const initialState: UserManagementState = {
    items: [],
    loading: false,
    saving: false,
    error: null,
    managerRole: null,
};

function mapDomainUserToManagedUser(user: User): ManagedBusinessUser {
    // Core1 3.3: prioriza labels Appwrite sobre role string suelto
    const role = resolveBusinessRole({
        labels: user.labels,
        role: user.role,
    });

    return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        photoUrl: user.photo_url || "",
        role,
        blocked: user.status === false,
        verified: Boolean(user.verification),
        passwordResetRequested: false,
    };
}

/**
 * Visitantes / anónimos de Appwrite (createAnonymousSession) no tienen email.
 * El panel de gestión solo lista cuentas reales de negocio.
 */
function isAnonymousOrGuestUser(user: User): boolean {
    const email = String(user.email ?? "").trim();
    if (!email) return true;
    // Defensa extra: sin email usable y sin nombre (sesión anónima típica)
    const name = String(user.name ?? "").trim();
    if (!name && !email.includes("@")) return true;
    return false;
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createUserManagementStore() {
    const { subscribe, update } = writable<UserManagementState>(initialState);
    let snapshot: UserManagementState = initialState;
    subscribe((s) => (snapshot = s));
    let loadUsersInFlight: Promise<void> | null = null;
    let lastSearch = "";

    async function resolveManagerRole(): Promise<BusinessRole> {
        if (snapshot.managerRole) return snapshot.managerRole;
        const u = await authContainer.useCases.accounts.getCurrentUser();
        const role = resolveBusinessRole({
            labels: (u as any).labels,
            role: u.role,
        });
        update((state) => ({ ...state, managerRole: role }));
        return role;
    }

    async function runSaving<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({ ...state, saving: true, error: null }));
        try {
            return await task();
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, saving: false }));
        }
    }

    async function runLoading<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({ ...state, loading: true, error: null }));
        try {
            return await task();
        } catch (error) {
            update((state) => ({ ...state, error: normalizeError(error) }));
            throw error;
        } finally {
            update((state) => ({ ...state, loading: false }));
        }
    }

    async function syncAll(): Promise<void> {
        await resolveManagerRole();
        await loadUsers(lastSearch);
    }

    async function loadUsers(search?: string): Promise<void> {
        if (loadUsersInFlight) {
            return loadUsersInFlight;
        }

        loadUsersInFlight = runLoading(async () => {
            lastSearch = (search ?? "").trim();
            await resolveManagerRole();
            const res = await authContainer.useCases.accounts.getAllUserCaseUse(lastSearch);
            const users: User[] = res.users.filter((u) => !isAnonymousOrGuestUser(u));
            const managedUsers: ManagedBusinessUser[] = users.map((u) => mapDomainUserToManagedUser(u));
            update((state) => ({ ...state, items: managedUsers }));
        }).finally(() => {
            loadUsersInFlight = null;
        });

        return loadUsersInFlight;
    }

    async function createUser(
        payload: Pick<ManagedBusinessUser, "name" | "email" | "role"> & { password: string }
    ): Promise<void> {
        await runSaving(async () => {
            const managerRole = await resolveManagerRole();
            assertCanAssignRole(managerRole, payload.role);

            await authContainer.useCases.accounts.adminCreateUser({
                name: payload.name,
                email: payload.email,
                password: payload.password,
                labels: getRoleLabels(payload.role),
            });

            await loadUsers(lastSearch);
        });
    }

    async function setRole(id: string, role: BusinessRole): Promise<void> {
        await runSaving(async () => {
            const managerRole = await resolveManagerRole();
            const current = snapshot.items.find((u) => u.id === id);
            assertCanAssignRole(managerRole, role, current?.role ?? null);

            await authContainer.useCases.accounts.adminUpdateLabels(id, getRoleLabels(role));
            update((state) => ({
                ...state,
                items: state.items.map((u) => (u.id === id ? { ...u, role } : u)),
            }));
        });
    }

    async function toggleBlocked(id: string): Promise<void> {
        const current = snapshot.items.find((u) => u.id === id);
        if (!current) return;

        await runSaving(async () => {
            const managerRole = await resolveManagerRole();
            assertCanAssignRole(managerRole, current.role, current.role);

            const nextBlocked = !current.blocked;
            await authContainer.useCases.accounts.adminUpdateStatus(id, !nextBlocked);
            update((state) => ({
                ...state,
                items: state.items.map((u) => (u.id === id ? { ...u, blocked: nextBlocked } : u)),
            }));
        });
    }

    async function requestPasswordReset(id: string, newPassword: string): Promise<void> {
        await runSaving(async () => {
            const current = snapshot.items.find((u) => u.id === id);
            if (!current) throw new Error("Usuario no encontrado");
            const managerRole = await resolveManagerRole();
            assertCanAssignRole(managerRole, current.role, current.role);

            await authContainer.useCases.accounts.adminUpdatePassword(id, newPassword);
            update((state) => ({
                ...state,
                items: state.items.map((u) =>
                    u.id === id ? { ...u, passwordResetRequested: true } : u
                ),
            }));
        });
    }

    /**
     * Borra en Appwrite las cuentas anónimas/visitante (sin email).
     * Útil en plan Free: el cupo de Users cuenta anónimos y, al llenarse, no se crean cuentas nuevas.
     */
    async function purgeAnonymousUsers(): Promise<{ deleted: number; failed: number; found: number }> {
        return await runSaving(async () => {
            const managerRole = await resolveManagerRole();
            if (managerRole !== "owner" && managerRole !== "admin") {
                throw new Error("Solo owner o admin pueden limpiar usuarios anónimos.");
            }

            const res = await authContainer.useCases.accounts.getAllUserCaseUse("");
            const anonymous = res.users.filter((u) => isAnonymousOrGuestUser(u));
            let deleted = 0;
            let failed = 0;

            for (const u of anonymous) {
                if (!u.id) {
                    failed += 1;
                    continue;
                }
                try {
                    await authContainer.useCases.accounts.adminDeleteUser(u.id);
                    deleted += 1;
                } catch {
                    failed += 1;
                }
            }

            await loadUsers(lastSearch);
            return { deleted, failed, found: anonymous.length };
        });
    }

    function getAssignableRoles(): BusinessRole[] {
        const manager = snapshot.managerRole ?? "viewer";
        return assignableRoles(manager);
    }

    const hasUsers = derived({ subscribe }, ($state) => $state.items.length > 0);

    return {
        subscribe,
        hasUsers,
        syncAll,
        createUser,
        setRole,
        toggleBlocked,
        loadUsers,
        requestPasswordReset,
        purgeAnonymousUsers,
        getAssignableRoles,
        resolveManagerRole,
    };
}

export const userManagementStore = createUserManagementStore();
