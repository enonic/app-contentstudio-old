import TaskIdJson = api.task.TaskIdJson;
import TaskId = api.task.TaskId;
import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';

export class UnpublishContentRequest
    extends ContentResourceRequest<TaskIdJson, TaskId> {

    private ids: ContentId[] = [];

    private includeChildren: boolean;

    constructor(contentId?: ContentId) {
        super();
        this.setHeavyOperation(true);
        super.setMethod('POST');
        if (contentId) {
            this.addId(contentId);
        }
    }

    setIds(contentIds: ContentId[]): UnpublishContentRequest {
        this.ids = contentIds;
        return this;
    }

    addId(contentId: ContentId): UnpublishContentRequest {
        this.ids.push(contentId);
        return this;
    }

    setIncludeChildren(include: boolean): UnpublishContentRequest {
        this.includeChildren = include;
        return this;
    }

    getParams(): Object {
        return {
            includeChildren: this.includeChildren,
            ids: this.ids.map((el) => {
                return el.toString();
            })
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'unpublish');
    }

    sendAndParse(): wemQ.Promise<api.task.TaskId> {
        return this.send().then((response: api.rest.JsonResponse<api.task.TaskIdJson>) => {
            return api.task.TaskId.fromJson(response.getResult());
        });
    }
}
