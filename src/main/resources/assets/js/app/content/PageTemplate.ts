import ContentTypeName = api.schema.content.ContentTypeName;
import Property = api.data.Property;
import PropertyTree = api.data.PropertyTree;
import DescriptorKey = api.content.page.DescriptorKey;
import {Content, ContentBuilder} from './Content';
import {ContentJson} from './ContentJson';
import {PageMode} from '../page/PageMode';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {Regions} from '../page/region/Regions';

export class PageTemplate
    extends Content
    implements api.Equitable {

    private canRender: ContentTypeName[];

    constructor(builder: PageTemplateBuilder) {

        super(builder);

        this.canRender = [];
        this.getContentData().forEachProperty('supports', (property: Property) => {
            this.canRender.push(new ContentTypeName(property.getString()));
        });
    }

    getKey(): PageTemplateKey {

        return <PageTemplateKey>this.getContentId();
    }

    getPageMode(): PageMode {

        if (this.isPage()) {
            if (this.getPage().hasController()) {
                return PageMode.FORCED_CONTROLLER;
            } else {
                throw new Error(`Illegal state: A PageTemplate's Page must a controller set`);
            }
        } else {
            return PageMode.NO_CONTROLLER;
        }
    }

    getController(): DescriptorKey {

        return this.getPage().getController();
    }

    isCanRender(pattern: ContentTypeName): boolean {
        return this.getCanRender().some((name: ContentTypeName) => {
            return name.equals(pattern);
        });
    }

    getCanRender(): ContentTypeName[] {

        return this.canRender;
    }

    hasRegions(): boolean {
        if (!this.isPage()) {
            return false;
        }
        return this.getPage().hasRegions();
    }

    getRegions(): Regions {
        if (!this.isPage()) {
            return null;
        }
        return this.getPage().getRegions();
    }

    hasConfig(): boolean {
        if (!this.isPage()) {
            return false;
        }
        return this.getPage().hasConfig();
    }

    getConfig(): PropertyTree {
        if (!this.isPage()) {
            return null;
        }
        return this.getPage().getConfig();
    }

    equals(o: api.Equitable, ignoreEmptyValues: boolean = false): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, PageTemplate)) {
            return false;
        }

        return super.equals(o, ignoreEmptyValues);
    }

    clone(): PageTemplate {

        return this.newBuilder().build();
    }

    newBuilder(): PageTemplateBuilder {
        return new PageTemplateBuilder(this);
    }
}

export class PageTemplateBuilder
    extends ContentBuilder {

    constructor(source?: PageTemplate) {
        super(source);
    }

    fromContentJson(contentJson: ContentJson): PageTemplateBuilder {
        super.fromContentJson(contentJson);
        return this;
    }

    public build(): PageTemplate {
        return new PageTemplate(this);
    }
}
