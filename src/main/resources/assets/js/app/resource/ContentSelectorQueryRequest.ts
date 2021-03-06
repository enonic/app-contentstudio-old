import OrderExpr = api.query.expr.OrderExpr;
import FieldOrderExpr = api.query.expr.FieldOrderExpr;
import OrderDirection = api.query.expr.OrderDirection;
import FieldExpr = api.query.expr.FieldExpr;
import Expression = api.query.expr.Expression;
import QueryField = api.query.QueryField;
import QueryExpr = api.query.expr.QueryExpr;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ContentSummary = api.content.ContentSummary;
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentQueryResultJson} from './json/ContentQueryResultJson';
import {ContentJson} from '../content/ContentJson';

export class ContentSelectorQueryRequest<CONTENT_JSON extends ContentSummaryJson, CONTENT extends ContentSummary>
    extends ContentResourceRequest<ContentQueryResultJson<CONTENT_JSON>, CONTENT[]> {

    public static DEFAULT_SIZE: number = 15;

    public static MODIFIED_TIME_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC);

    public static SCORE_DESC: FieldOrderExpr = new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC);

    public static DEFAULT_ORDER: OrderExpr[] = [ContentSelectorQueryRequest.SCORE_DESC, ContentSelectorQueryRequest.MODIFIED_TIME_DESC];

    private queryExpr: api.query.expr.QueryExpr;

    private from: number = 0;

    private loadingFrom: number;

    private size: number = ContentSelectorQueryRequest.DEFAULT_SIZE;

    private expand: api.rest.Expand = api.rest.Expand.SUMMARY;

    private content: ContentSummary;

    private inputName: string;

    private contentTypeNames: string[] = [];

    private allowedContentPaths: string[] = [];

    private relationshipType: string;

    private loaded: boolean;

    private results: CONTENT[] = [];

    constructor() {
        super();
        super.setMethod('POST');

        this.setSearchString();
    }

    setInputName(name: string) {
        this.inputName = name;
    }

    getInputName(): string {
        return this.inputName;
    }

    setContent(content: ContentSummary) {
        this.content = content;
    }

    getContent(): ContentSummary {
        return this.content;
    }

    setFrom(from: number) {
        this.from = from;
    }

    getFrom(): number {
        return this.from;
    }

    setSize(size: number) {
        this.size = size;
    }

    getSize(): number {
        return this.size;
    }

    setContentTypeNames(contentTypeNames: string[]) {
        this.contentTypeNames = contentTypeNames;
    }

    setAllowedContentPaths(allowedContentPaths: string[]) {
        this.allowedContentPaths = allowedContentPaths;
    }

    setRelationshipType(relationshipType: string) {
        this.relationshipType = relationshipType;
    }

    setExpand(expand: api.rest.Expand) {
        this.expand = expand;
    }

    getExpand(): api.rest.Expand {
        return this.expand;
    }

    setSearchString(searchString: string = '') {
        let fulltextExpression = this.createSearchExpression(searchString);

        this.queryExpr = new QueryExpr(fulltextExpression, ContentSelectorQueryRequest.DEFAULT_ORDER);
    }

    setQueryExpr(queryExpr: api.query.expr.QueryExpr) {
        this.queryExpr = queryExpr;
    }

    private createSearchExpression(searchString: string): Expression {
        return new api.query.PathMatchExpressionBuilder()
            .setSearchString(searchString)
            .setPath(this.content ? this.content.getPath().toString() : '')
            .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
            .addField(new QueryField(QueryField.NAME, 3))
            .addField(new QueryField(QueryField.ALL))
            .build();
    }

    getQueryExpr(): api.query.expr.QueryExpr {
        return this.queryExpr;
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'selectorQuery');
    }

    isPartiallyLoaded(): boolean {
        return this.results.length > 0 && !this.loaded;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    resetParams() {
        this.from = 0;
        this.loaded = false;
    }

    getParams(): Object {
        let queryExprAsString = this.getQueryExpr() ? this.getQueryExpr().toString() : '';

        return {
            queryExpr: queryExprAsString,
            from: this.getFrom(),
            size: this.getSize(),
            expand: this.expandAsString(),
            contentId: this.content ? this.content.getId().toString() : null,
            inputName: this.getInputName(),
            contentTypeNames: this.contentTypeNames,
            allowedContentPaths: this.allowedContentPaths,
            relationshipType: this.relationshipType
        };
    }

    private isConcurrentLoad() {
        return this.from === this.loadingFrom;
    }

    sendAndParse(): wemQ.Promise<CONTENT[]> {

        if (this.isConcurrentLoad()) {
            return wemQ(this.results);
        }

        this.loadingFrom = this.from;
        return this.send().then((response: api.rest.JsonResponse<ContentQueryResultJson<CONTENT_JSON>>) => {

            let responseResult: ContentQueryResultJson<CONTENT_JSON> = response.getResult();

            let contentsAsJson: ContentSummaryJson[] = responseResult.contents;

            let contents: CONTENT[];

            if (this.expand === api.rest.Expand.SUMMARY) {
                contents = <any[]> this.fromJsonToContentSummaryArray(<ContentSummaryJson[]>contentsAsJson);
            } else {
                contents = <any[]>this.fromJsonToContentArray(<ContentJson[]>contentsAsJson);
            }

            if (this.from === 0) {
                this.results = [];
            }
            this.loadingFrom = undefined;
            this.from += responseResult.metadata['hits'];
            this.loaded = this.from >= responseResult.metadata['totalHits'];

            this.results = this.results.concat(contents);

            return this.results;
        }).catch(() => {
            return [];
        });
    }

    private expandAsString(): string {
        switch (this.expand) {
        case api.rest.Expand.FULL:
            return 'full';
        case api.rest.Expand.SUMMARY:
            return 'summary';
        case api.rest.Expand.NONE:
            return 'none';
        default:
            return 'summary';
        }
    }
}
