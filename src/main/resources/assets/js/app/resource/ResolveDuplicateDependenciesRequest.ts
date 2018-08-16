import ContentResourceRequest = api.content.resource.ContentResourceRequest;
import ContentId = api.content.ContentId;

export class ResolveDuplicateDependenciesRequest
    extends ContentResourceRequest<api.content.json.ContentIdBaseItemJson[], ContentId[]> {

    private ids: ContentId[];

    private excludeChildrenIds: ContentId[];

    constructor(builder: ResolveDuplicateDependenciesRequestBuilder) {
        super();
        super.setMethod('POST');
        this.ids = builder.ids;
        this.excludeChildrenIds = builder.excludeChildrenIds;
    }

    static create() {
        return new ResolveDuplicateDependenciesRequestBuilder();
    }

    getParams(): Object {
        return {
            ids: this.ids.map((el) => {
                return el.toString();
            }),
            excludeChildrenIds: this.excludeChildrenIds.map((el) => {
                return el.toString();
            })
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'resolveDuplicateDependencies');
    }

    sendAndParse(): wemQ.Promise<ContentId[]> {

        return this.send().then((response: api.rest.JsonResponse<api.content.json.ContentIdBaseItemJson[]>) => {
            return response.getResult().map((item => new ContentId(item.id)));
        });
    }
}

export class ResolveDuplicateDependenciesRequestBuilder {

    ids: ContentId[] = [];

    excludeChildrenIds: ContentId[] = [];

    public setIds(value: ContentId[]): ResolveDuplicateDependenciesRequestBuilder {
        this.ids = value;
        return this;
    }

    public setExcludeChildrenIds(value: ContentId[]): ResolveDuplicateDependenciesRequestBuilder {
        this.excludeChildrenIds = value;
        return this;
    }

    build() {
        return new ResolveDuplicateDependenciesRequest(this);
    }
}
