import {PageCUDRequest} from '../resource/PageCUDRequest';
import {PageResourceRequest} from '../resource/PageResourceRequest';
import {Content} from '../content/Content';
import {ContentJson} from '../content/ContentJson';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {Regions} from '../page/region/Regions';
import {Component} from '../page/region/Component';

export class CreatePageRequest
    extends PageResourceRequest<ContentJson, Content>
    implements PageCUDRequest {

    private contentId: api.content.ContentId;

    private controller: api.content.page.DescriptorKey;

    private template: PageTemplateKey;

    private config: api.data.PropertyTree;

    private regions: Regions;

    private fragment: Component;

    private customized: boolean;

    constructor(contentId: api.content.ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
    }

    setController(controller: api.content.page.DescriptorKey): CreatePageRequest {
        this.controller = controller;
        return this;
    }

    setPageTemplateKey(pageTemplateKey: PageTemplateKey): CreatePageRequest {
        this.template = pageTemplateKey;
        return this;
    }

    setConfig(config: api.data.PropertyTree): CreatePageRequest {
        this.config = config;
        return this;
    }

    setRegions(value: Regions): CreatePageRequest {
        this.regions = value;
        return this;
    }

    setFragment(value: Component): CreatePageRequest {
        this.fragment = value;
        return this;
    }

    setCustomized(value: boolean): CreatePageRequest {
        this.customized = value;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            controller: this.controller ? this.controller.toString() : null,
            template: this.template ? this.template.toString() : null,
            config: this.config ? this.config.toJson() : null,
            regions: this.regions != null ? this.regions.toJson() : null,
            customized: this.customized,
            fragment: this.fragment != null ? this.fragment.toJson() : null
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'create');
    }

    sendAndParse(): wemQ.Promise<Content> {

        return this.send().then((response: api.rest.JsonResponse<ContentJson>) => {
            return response.isBlank() ? null : this.fromJsonToContent(response.getResult());
        });
    }
}