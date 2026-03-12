import {UserNetRepositoryImpl} from "../data/repository/user.net.repository";
import {infrastructureContainer} from "../../../infrastructure/di/infrastructure.container";
import {CreateAccountCaseUse} from "../domain/caseuse/CreateAccountCaseUse";
import {UpdateNameCaseUse} from "../domain/caseuse/UpdateNameCaseUse";
import {UpdatePasswordCaseUse} from "../domain/caseuse/UpdatePasswordCaseUse";
import {DeleteUserCaseUse} from "../domain/caseuse/DeleteUserCaseUse";
import {UpdateRoleCaseUse} from "../domain/caseuse/UpdateRoleCaseUse";
import {UpdatePhotoCaseUse} from "../domain/caseuse/UpdatePhotoCaseUse";
import {UpdatePhoneCaseUse} from "../domain/caseuse/UpdatePhoneCaseUse";
import {SessionNetManagerImpl} from "../data/repository/session.net.manager";
import {OpenSessionCaseUse} from "../domain/caseuse/OpenSessionCaseUse";
import {CloseSessionsCaseUSe} from "../domain/caseuse/CloseSessionsCaseUSe";
import {GetCurrentUserCaseUse} from "../domain/caseuse/GetCurrentUserCaseUse";
import {AdminNetManagerImpl} from "../data/repository/admin.repository";
import {GetAllUsersCaseUse} from "../domain/caseuse/GetAllUsersCaseUse";
import {LinkGoogleAccountCaseUse} from "../domain/caseuse/LinkGoogleAccountCaseUse";

// Account instance
const accounts = infrastructureContainer.appwrite.account
const functions = infrastructureContainer.appwrite.functions

// Data
const authNetRepository = new UserNetRepositoryImpl(accounts)
const sessionNetManager = new SessionNetManagerImpl(accounts)
const adminNetRepository = new AdminNetManagerImpl(functions)

// Domain
const createAccountCaseUse = new CreateAccountCaseUse(authNetRepository)
const updateNameCaseUse = new UpdateNameCaseUse(authNetRepository)
const updatePasswordCaseUse = new UpdatePasswordCaseUse(authNetRepository)
const updatePhotoUrlCaseUse = new UpdatePhotoCaseUse(authNetRepository)
const updatePhoneCaseUse = new UpdatePhoneCaseUse(authNetRepository)
const updateRoleCaseUse = new UpdateRoleCaseUse(authNetRepository)
const deleteUserCaseUse = new DeleteUserCaseUse(authNetRepository)
const opeSessionCaseUse = new OpenSessionCaseUse(sessionNetManager)
const closeSessionCaseUSe = new CloseSessionsCaseUSe(sessionNetManager)
const getCurrentUserCaseUse = new GetCurrentUserCaseUse(authNetRepository)
const getAllUserCaseUse = new GetAllUsersCaseUse(adminNetRepository)
const linkGoogleAccountCaseUse = new LinkGoogleAccountCaseUse(authNetRepository, sessionNetManager)

export const authContainer = {
    repositories: {
        accounts: authNetRepository,
        sessions: sessionNetManager,
        adminNetRepository: adminNetRepository,
    },
    useCases: {
        accounts: {
            createAccount: createAccountCaseUse.execute.bind(createAccountCaseUse),
            getCurrentUser: getCurrentUserCaseUse.execute.bind(getCurrentUserCaseUse),
            updateName: updateNameCaseUse.execute.bind(updateNameCaseUse),
            updatePassword: updatePasswordCaseUse.execute.bind(updatePasswordCaseUse),
            updatePhotoUrl: updatePhotoUrlCaseUse.execute.bind(updatePhotoUrlCaseUse),
            updatePhone: updatePhoneCaseUse.execute.bind(updatePhoneCaseUse),
            updateRole: updateRoleCaseUse.execute.bind(updateRoleCaseUse),
            deleteUser: deleteUserCaseUse.execute.bind(deleteUserCaseUse),
            getAllUserCaseUse: getAllUserCaseUse.execute.bind(getAllUserCaseUse),
            linkGoogleAccount: linkGoogleAccountCaseUse.execute.bind(linkGoogleAccountCaseUse),
        },
        sessions: {
            openSession: opeSessionCaseUse,
            closeSession: closeSessionCaseUSe,
        }
    }
}
