import type { UserDTO } from "../../../../../../../core/feature/auth/data/dto/UserDTO";
import type { UserNetRepository } from "../../../../../../../core/feature/auth/domain/repository/user.net.repository";

export class FakeUserNetRepository implements UserNetRepository {
    public readonly calls = {
        linkGoogle: [] as Array<{ sub: string; photoUrl: string; name: string }>
    };

    async getCurrentUser(): Promise<Partial<UserDTO>> {
        return {};
    }

    async createAccount(_user: Partial<UserDTO>): Promise<void> {}

    async updateName(_newName: string): Promise<void> {}

    async updatePassword(_newPassword: string, _oldPassword?: string): Promise<void> {}

    async updatePhotoUrl(_newPhotoUrl: string): Promise<void> {}

    async linkGoogle(sub: string, photoUrl: string, name: string): Promise<void> {
        this.calls.linkGoogle.push({ sub, photoUrl, name });
    }

    async updatePhone(_newPhone: string): Promise<void> {}

    async updateRole(_newRole: string): Promise<void> {}

    async deleteUser(_user: Partial<UserDTO>): Promise<void> {}
}
