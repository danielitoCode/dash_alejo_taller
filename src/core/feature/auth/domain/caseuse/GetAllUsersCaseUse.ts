import type {UserNetRepository} from "../repository/user.net.repository";
import type {UserDTO} from "../../data/dto/UserDTO";
import type {AdminNetRepository} from "../repository/admin.net.repository";
import type {User} from "../entity/User";

export class GetAllUsersCaseUse {
    constructor(private readonly adminRepo: AdminNetRepository) {}

    async execute(): Promise<User[]> {
        return await this.adminRepo.listUsers()
    }
}