import {JsonResourceRequest} from './JsonResourceRequest';
import {PageTemplate} from '../content/PageTemplate';
import {ContentJson} from '../content/ContentJson';

export class PageTemplateResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: api.rest.Path;

    constructor() {
        super();
        this.resourcePath = api.rest.Path.fromParent(super.getRestPath(), 'content', 'page', 'template');
    }

    getResourcePath(): api.rest.Path {
        return this.resourcePath;
    }

    fromJsonToContent(json: ContentJson): PageTemplate {
        return <PageTemplate>super.fromJsonToContent(json);
    }
}
