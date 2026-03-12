import type {AdminNetRepository} from "../../domain/repository/admin.net.repository";
import {ExecutionMethod, type Functions, type Models} from "appwrite";
import type {User} from "../../domain/entity/User";
import {ENV} from "../../../../infrastructure/env";
import {logger} from "../../../../infrastructure/presentation/util/logger.service";
import type {UserDTO} from "../dto/UserDTO";
import {userFromDTO} from "../mapper/Mapper";

type UsersFunctionResult = {
    success?: boolean;
    users?: UserDTO[];
    error?: string;
    code?: string | number;
};


export class AdminNetManagerImpl implements AdminNetRepository {
    constructor(private readonly functionsClient: Functions) {
    }

    async listUsers(): Promise<User[]> {
        try {
            const functionId = ENV.adminFunctionUsers || "";
            if (!functionId) {
                throw new Error("Falta configurar VITE_APPWRITE_USERS_FUNCTION");
            }

            const execution = await this.functionsClient.createExecution(functionId);
            const status = execution.responseStatusCode ?? execution.status ?? "unknown";

            let result: UsersFunctionResult = {};

            try {
                result = JSON.parse(execution.responseBody || "{}");
            } catch {
                const preview = (execution.responseBody || "").slice(0, 300);
                throw new Error(`La Function devolvió una respuesta inválida (no JSON). status=${status}. body=${preview}`);
            }

            if (!result.success) {
                const backendMessage = result.error || "Error al obtener usuarios desde la Function";
                const backendCode = result.code ? ` code=${result.code}` : "";
                throw new Error(`${backendMessage} (status=${status}${backendCode})`);
            }

            return (result.users ?? []).map(userFromDTO);

        } catch (err: any) {
            console.error("Error ejecutando la Function:", err.message || err);
            throw err;
        }
    }
}
