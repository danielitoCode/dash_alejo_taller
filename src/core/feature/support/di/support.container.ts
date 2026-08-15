import { databases } from "../../../infrastructure/di/appwrite.config";
import { SupportAppwriteRepository } from "../data/repository/support.appwrite.repository";
import { CreateSupportThreadCaseUse } from "../domain/caseuse/CreateSupportThreadCaseUse";
import { GetAllSupportMessagesCaseUse } from "../domain/caseuse/GetAllSupportMessagesCaseUse";
import { ListSupportMessagesCaseUse } from "../domain/caseuse/ListSupportMessagesCaseUse";
import { MarkThreadReadCaseUse } from "../domain/caseuse/MarkThreadReadCaseUse";
import { PostSupportMessageCaseUse } from "../domain/caseuse/PostSupportMessageCaseUse";
import { SubscribeSupportInboxCaseUse } from "../domain/caseuse/SubscribeSupportInboxCaseUse";
import { UpdateSupportStatusCaseUse } from "../domain/caseuse/UpdateSupportStatusCaseUse";

const repo = new SupportAppwriteRepository(databases);

const getAll = new GetAllSupportMessagesCaseUse(repo);
const subscribeInbox = new SubscribeSupportInboxCaseUse(repo);
const updateStatus = new UpdateSupportStatusCaseUse(repo);
const listMessages = new ListSupportMessagesCaseUse(repo);
const postMessage = new PostSupportMessageCaseUse(repo);
const createThread = new CreateSupportThreadCaseUse(repo);
const markRead = new MarkThreadReadCaseUse(repo);

export const supportContainer = {
    repositories: { net: repo },
    useCases: {
        inbox: {
            getAll: getAll.execute.bind(getAll),
            subscribe: subscribeInbox.execute.bind(subscribeInbox),
            updateStatus: updateStatus.execute.bind(updateStatus)
        },
        threads: {
            create: createThread.execute.bind(createThread),
            listMessages: listMessages.execute.bind(listMessages),
            postMessage: postMessage.execute.bind(postMessage),
            markRead: markRead.execute.bind(markRead)
        }
    }
};
