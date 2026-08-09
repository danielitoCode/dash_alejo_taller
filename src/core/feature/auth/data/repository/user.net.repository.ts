import type { UserDTO } from "../dto/UserDTO";
import type { UserNetRepository } from "../../domain/repository/user.net.repository";
import { type Account, ID } from "appwrite";
import {
    normalizeAppwriteLabels,
    resolveBusinessRole,
} from "../../domain/config/RoleConfig";

export class UserNetRepositoryImpl implements UserNetRepository {
    constructor(private readonly account: Account) {}

    async getCurrentUser(): Promise<Partial<UserDTO>> {
        const current = await this.account.get();

        // Core1 3.3: labels Appwrite → BusinessRole (misma lógica que admin list)
        const labels = normalizeAppwriteLabels((current as any)?.labels);
        const rawPrefRole =
            typeof current.prefs?.role === "string" ? current.prefs.role : null;

        const role = resolveBusinessRole({
            labels,
            prefsRole: rawPrefRole,
        });

        return {
            id: current.$id,
            name: current.name,
            email: current.email,
            phone: current.phone ?? "",
            photo_url: typeof current.prefs?.photo_url === "string" ? current.prefs.photo_url : "",
            role,
            sub: typeof current.prefs?.sub === "string" ? current.prefs.sub : "",
            verification: current.emailVerification,
            labels,
        };
    }

    async createAccount(user: Partial<UserDTO>) {
        await this.account.create(
            ID.unique(),
            user.email as string,
            user.password as string,
            user.name as string
        );

        await this.account.createEmailPasswordSession(
            user.email as string,
            user.password as string
        );

        const preferences = new Map<string, any>();
        preferences.set("photo_url", user.photo_url as string);
        preferences.set("sub", user.sub as string);
        preferences.set("name", user.name as string);
        preferences.set("role", user.role as string);
        preferences.set("phone", user.phone as string);

        await this.account.updatePrefs(preferences);
    }

    async updateName(newName: string): Promise<void> {
        await this.account.updateName(newName);
    }

    async updatePassword(newPassword: string, oldPassword?: string): Promise<void> {
        await this.account.updatePassword(newPassword, oldPassword);
    }

    async updatePhotoUrl(newPhotoUrl: string): Promise<void> {
        const photoPreference = new Map<string, string>();
        photoPreference.set("photo_url", newPhotoUrl);
        await this.account.updatePrefs(photoPreference);
    }

    async linkGoogle(sub: string, photoUrl: string, name: string): Promise<void> {
        const prefs = new Map<string, any>();
        prefs.set("sub", sub);
        prefs.set("photo_url", photoUrl);
        prefs.set("name", name);
        prefs.set("google_linked", true);
        await this.account.updatePrefs(prefs);
    }

    async updatePhone(newPhone: string): Promise<void> {
        const photoPreference = new Map<string, string>();
        photoPreference.set("phone", newPhone);
        await this.account.updatePrefs(photoPreference);
    }

    async updateRole(newRole: string): Promise<void> {
        // Preferencias locales (staff gestionado usa labels vía Admin Function)
        const photoPreference = new Map<string, string>();
        photoPreference.set("role", newRole);
        await this.account.updatePrefs(photoPreference);
    }

    async deleteUser(user: Partial<UserDTO>) {
        await this.account.deleteIdentity(user.id as string);
    }
}
