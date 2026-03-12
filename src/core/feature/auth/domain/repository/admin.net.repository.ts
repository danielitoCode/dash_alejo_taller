import type {User} from "../entity/User";

export interface AdminNetRepository {
    listUsers(): Promise<User[]>
}