import { derived, writable } from "svelte/store";
import { authContainer } from "../../di/auth.container";
import type { UserDTO } from "../../data/dto/UserDTO";
import type {User} from "../../domain/entity/User";
import type {Role} from "../../domain/entity/Role";

export type BusinessRole = "owner" | "admin" | "sales" | "viewer";

export interface ManagedBusinessUser {
    id: string;
    name: string;
    email: string;
    photoUrl: string;
    role: BusinessRole;
    blocked: boolean;
    passwordResetRequested: boolean;
}

interface UserManagementState {
    items: ManagedBusinessUser[];
    loading: boolean;
    saving: boolean;
    error: string | null;
}

const initialState: UserManagementState = {
    items: [],
    loading: false,
    saving: false,
    error: null
};

function mapRole(role: unknown): BusinessRole {
    if (role === "owner" || role === "admin" || role === "sales" || role === "viewer") {
        return role;
    }

    return "viewer";
}

function mapDomainUserToManagedUser(user: User): ManagedBusinessUser {
    return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        photoUrl: user.photo_url || "",
        role: mapRole(user.role),
        blocked: false,
        passwordResetRequested: false,
    };
}

function normalizeError(error: unknown): string {
    return error instanceof Error ? error.message : "Unexpected error";
}

function createUserManagementStore() {
    const {subscribe, update} = writable<UserManagementState>(initialState);
    let loadUsersInFlight: Promise<void> | null = null;

    async function runSaving<T>(task: () => Promise<T>): Promise<T> {
        update((state) => ({...state, saving: true, error: null}));
        try {
            return await task();
        } catch (error) {
            update((state) => ({...state, error: normalizeError(error)}));
            throw error;
        } finally {
            update((state) => ({...state, saving: false}));
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
        await loadUsers();
    }

    async function loadUsers(): Promise<void> {
        if (loadUsersInFlight) {
            return loadUsersInFlight;
        }

        loadUsersInFlight = runLoading(async () => {
            const users: User[] = await authContainer.useCases.accounts.getAllUserCaseUse();

            // Mapear User → ManagedUser para el store
            const managedUsers: ManagedBusinessUser[] = users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                photoUrl: u.photo_url ?? "",
                role: mapRole(u.role),
                blocked: false,
                passwordResetRequested: false
            }));

            update((state) => ({ ...state, items: managedUsers }));
        }).finally(() => {
            loadUsersInFlight = null;
        });

        return loadUsersInFlight;
    }

    async function createUser(payload: Pick<ManagedBusinessUser, "name" | "email" | "role"> & { password: string }): Promise<void> {
        await runSaving(async () => {
            await authContainer.useCases.accounts.createAccount({
                name: payload.name,
                email: payload.email,
                password: payload.password,
                role: payload.role,
                phone: "",
                photo_url: "",
                sub: "",
                verification: false
            });

            await loadUsers();
        });
    }

    async function setRole(id: string, role: BusinessRole): Promise<void> {
        await runSaving(async () => {
            await authContainer.useCases.accounts.updateRole(role);
            update((state) => ({ ...state, items: state.items.map((u) => (u.id === id ? { ...u, role } : u)) }));
        });
    }

    function toggleBlocked(id: string): void {
        update((state) => ({ ...state, items: state.items.map((u) => (u.id === id ? { ...u, blocked: !u.blocked } : u)) }));
    }

    function requestPasswordReset(id: string): void {
        update((state) => ({ ...state, items: state.items.map((u) => (u.id === id ? { ...u, passwordResetRequested: true } : u)) }));
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
        requestPasswordReset
    };
}

export const userManagementStore = createUserManagementStore();