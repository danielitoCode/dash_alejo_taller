import {infrastructureContainer} from "../../../infrastructure/di/infrastructure.container";
import {AuthNetRepository} from "../data/repository/user.net.repository";
import {SessionNetManager} from "../data/repository/session.net.manager";
import {CreateAccountCaseUse} from "../domain/caseuse/CreateAccountCaseUse";
import {GetCurrentUserCaseUse} from "../domain/caseuse/GetCurrentUserCaseUse";
import {UpdateNameCaseUse} from "../domain/caseuse/UpdateNameCaseUse";
import {UpdatePasswordCaseUse} from "../domain/caseuse/UpdatePasswordCaseUse";
import {UpdatePhotoUrlCaseUse} from "../domain/caseuse/UpdatePhotoUrlCaseUse";
import {UpdatePhoneCaseUse} from "../domain/caseuse/UpdatePhoneCaseUse";
import {UpdateRoleCaseUse} from "../domain/caseuse/UpdateRoleCaseUse";
import {DeleteUserCaseUse} from "../domain/caseuse/DeleteUserCaseUse";
import {GetAllUsersCaseUse} from "../domain/caseuse/GetAllUsersCaseUse";
import {OpenSessionCaseUse} from "../domain/caseuse/OpenSessionCaseUse";
import {CloseSessionCaseUse} from "../domain/caseuse/CloseSessionCaseUse";
import {AdminNetManagerImpl} from "../data/repository/admin.repository";
import {CreateManagedUserCaseUse} from "../domain/caseuse/CreateManagedUserCaseUse";
import {UpdateManagedUserLabelsCaseUse} from "../domain/caseuse/UpdateManagedUserCaseUses";
import {UpdateManagedUserStatusCaseUse} from "../domain/caseuse/UpdateManagedUserStatusCaseUse";
import {UpdateManagedUserPasswordCaseUse} from "../domain/caseuse/UpdateManagedUserPasswordCaseUse";
import {GoogleAuthNetRepository} from "../data/repository/google.auth.net.repository";
import {LinkGoogleAccountCaseUse} from "../domain/caseuse/LinkGoogleAccountCaseUse";
import {ExchangeGoogleCredentialCaseUse} from "../domain/caseuse/ExchangeGoogleCredentialCaseUse";
import {PasswordResetNetRepository} from "../data/repository/password-reset.net.repository";
import {RequestPasswordResetCodeCaseUse} from "../domain/caseuse/RequestPasswordResetCodeCaseUse";
import {ConfirmPasswordResetCodeCaseUse} from "../domain/caseuse/ConfirmPasswordResetCodeCaseUse";

const account = infrastructureContainer.appwrite.account
const functions = infrastructureContainer.appwrite.functions

const authNetRepository = new AuthNetRepository(account)
const sessionNetManager = new SessionNetManager(account)
const adminNetRepository = new AdminNetManagerImpl(functions)
const googleAuthNetRepository = new GoogleAuthNetRepository()
const passwordResetNetRepository = new PasswordResetNetRepository()

const createAccountCaseUse = new CreateAccountCaseUse(authNetRepository)
const getCurrentUserCaseUse = new GetCurrentUserCaseUse(authNetRepository)
const updateNameCaseUse = new UpdateNameCaseUse(authNetRepository)
const updatePasswordCaseUse = new UpdatePasswordCaseUse(authNetRepository)
const updatePhotoUrlCaseUse = new UpdatePhotoUrlCaseUse(authNetRepository)
const updatePhoneCaseUse = new UpdatePhoneCaseUse(authNetRepository)
const updateRoleCaseUse = new UpdateRoleCaseUse(authNetRepository)
const deleteUserCaseUse = new DeleteUserCaseUse(authNetRepository)
const getAllUserCaseUse = new GetAllUsersCaseUse(adminNetRepository)
const opeSessionCaseUse = new OpenSessionCaseUse(sessionNetManager)
const closeSessionCaseUSe = new CloseSessionCaseUse(sessionNetManager)
const requestPasswordResetCodeCaseUse = new RequestPasswordResetCodeCaseUse(passwordResetNetRepository)
const confirmPasswordResetCodeCaseUse = new ConfirmPasswordResetCodeCaseUse(passwordResetNetRepository)
const createManagedUserCaseUse = new CreateManagedUserCaseUse(adminNetRepository)
const updateManagedUserLabelsCaseUse = new UpdateManagedUserLabelsCaseUse(adminNetRepository)
const updateManagedUserStatusCaseUse = new UpdateManagedUserStatusCaseUse(adminNetRepository)
const updateManagedUserPasswordCaseUse = new UpdateManagedUserPasswordCaseUse(adminNetRepository)

export const authContainer = {
    repositories: {
        accounts: authNetRepository,
        sessions: sessionNetManager,
        adminNetRepository: adminNetRepository,
        googleAuthNetRepository,
        passwordResetNetRepository
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
            adminCreateUser: createManagedUserCaseUse.execute.bind(createManagedUserCaseUse),
            adminUpdateLabels: updateManagedUserLabelsCaseUse.execute.bind(updateManagedUserLabelsCaseUse),
            adminUpdateStatus: updateManagedUserStatusCaseUse.execute.bind(updateManagedUserStatusCaseUse),
            adminUpdatePassword: updateManagedUserPasswordCaseUse.execute.bind(updateManagedUserPasswordCaseUse),
            adminDeleteUser: (userId: string) => adminNetRepository.deleteUser({ userId }),
            linkGoogleAccount: linkGoogleAccountCaseUse.execute.bind(linkGoogleAccountCaseUse),
            exchangeGoogleCredential: exchangeGoogleCredentialCaseUse.execute.bind(exchangeGoogleCredentialCaseUse),
            requestPasswordResetCode: requestPasswordResetCodeCaseUse.execute.bind(requestPasswordResetCodeCaseUse),
            confirmPasswordResetCode: confirmPasswordResetCodeCaseUse.execute.bind(confirmPasswordResetCodeCaseUse),
        },
        sessions: {
            openSession: opeSessionCaseUse,
            closeSession: closeSessionCaseUSe,
        }
    }
}
