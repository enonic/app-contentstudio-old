import '../../../../../api.ts';
import {ContentDependencyGroupJson} from '../../../../resource/json/ContentDependencyGroupJson';
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentSummary = api.content.ContentSummary;

export enum DependencyType {
    INBOUND,
    OUTBOUND
}

export class DependencyGroup implements api.Equitable {

    private iconUrl: string;

    private contentType: ContentTypeName;

    private type: DependencyType;

    private dependencies: ContentSummary[];

    constructor(builder: DependencyGroupBuilder) {
        this.iconUrl = builder.iconUrl;
        this.contentType = builder.contentType;
        this.type = builder.type;
        this.dependencies = builder.dependencies;
    }

    getItemCount(): number {
        return this.dependencies.length;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    getContentType(): ContentTypeName {
        return this.contentType;
    }

    getName(): string {
        return this.contentType.toString();
    }

    getType(): string {
        return DependencyType[this.type];
    }

    getDependencies(): ContentSummary[] {
        return this.dependencies;
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, DependencyGroup)) {
            return false;
        }

        let other = <DependencyGroup>o;

        if (!api.ObjectHelper.numberEquals(this.dependencies.length, other.dependencies.length)) {
            return false;
        }
        if (!api.ObjectHelper.equals(this.contentType, other.contentType)) {
            return false;
        }
        if (!api.ObjectHelper.stringEquals(DependencyType[this.type], DependencyType[other.type])) {
            return false;
        }

        return true;
    }

    static fromDependencyGroupJson(type: DependencyType, jsonItems: ContentDependencyGroupJson[]): DependencyGroup[] {
        let array: DependencyGroup[] = [];
        jsonItems.forEach((obj: ContentDependencyGroupJson) => {
            array.push(new DependencyGroupBuilder().fromJson(obj).setType(type).build());
        });
        return array;
    }

}

export class DependencyGroupBuilder {

    iconUrl: string;

    contentType: api.schema.content.ContentTypeName;

    type: DependencyType;

    dependencies: ContentSummary[];

    constructor(source?: DependencyGroup) {
        if (source) {
            this.iconUrl = source.getIconUrl();
            this.contentType = source.getContentType();
            this.dependencies = source.getDependencies();
        }
    }

    fromJson(json: ContentDependencyGroupJson): DependencyGroupBuilder {
        this.iconUrl = json.iconUrl;
        this.contentType = new ContentTypeName(json.type);
        this.dependencies = json.contents.map(contentSummaryJson => ContentSummary.fromJson(contentSummaryJson));

        return this;
    }

    setType(value: DependencyType): DependencyGroupBuilder {
        this.type = value;
        return this;
    }

    build(): DependencyGroup {
        return new DependencyGroup(this);
    }
}
