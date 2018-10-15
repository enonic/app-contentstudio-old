import PropertyTree = api.data.PropertyTree;
import DescriptorKey = api.content.page.DescriptorKey;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';
import {Regions} from './Regions';
import {ComponentPropertyChangedEvent} from './ComponentPropertyChangedEvent';
import {Region} from './Region';
import {ComponentPath} from './ComponentPath';
import {Component} from './Component';
import {LayoutComponentJson} from './LayoutComponentJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {LayoutComponentType} from './LayoutComponentType';
import {ComponentName} from './ComponentName';

export class LayoutComponent
    extends DescriptorBasedComponent
    implements api.Equitable, api.Cloneable {

    public static debug: boolean = false;

    private regions: Regions;

    private componentPropertyChangedListeners: { (event: ComponentPropertyChangedEvent): void }[] = [];

    private componentPropertyChangedEventHandler: (event: any) => void;

    private regionsChangedEventHandler: (event: any) => void;

    constructor(builder: LayoutComponentBuilder) {
        super(builder);

        if (builder.regions) {
            this.regions = builder.regions;
            this.regions.getRegions().forEach((region: Region) => {
                region.setParentPath(this.getPath());
            });
        } else {
            this.regions = Regions.create().build();
        }

        this.componentPropertyChangedEventHandler = (event: any) => this.forwardComponentPropertyChangedEvent(event);
        this.regionsChangedEventHandler = (event: any) => {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].onChanged: ', event);
            }
            this.notifyPropertyValueChanged('regions');
        };

        this.registerRegionsListeners(this.regions);
    }

    public getComponent(path: ComponentPath): Component {
        return this.regions.getComponent(path);
    }

    public getRegions(): Regions {
        return this.regions;
    }

    public setRegions(value: Regions) {

        let oldValue = this.regions;
        if (oldValue) {
            this.unregisterRegionsListeners(oldValue);
        }

        this.regions = value;
        this.registerRegionsListeners(this.regions);

        if (!api.ObjectHelper.equals(oldValue, value)) {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].regions reassigned: ', event);
            }
            this.notifyPropertyChanged('regions');
        }
    }

    setDescriptor(descriptorKey: DescriptorKey, descriptor?: LayoutDescriptor) {

        super.setDescriptor(descriptorKey, descriptor);
        if (descriptor) {
            this.addRegions(descriptor);
        }
    }

    addRegions(layoutDescriptor: LayoutDescriptor) {
        let sourceRegions = this.getRegions();
        let mergedRegions = sourceRegions.mergeRegions(layoutDescriptor.getRegions(), this);
        this.setRegions(mergedRegions);
    }

    isEmpty(): boolean {
        return !this.hasDescriptor();
    }

    public toJson(): ComponentTypeWrapperJson {
        let json: LayoutComponentJson = <LayoutComponentJson>super.toComponentJson();
        json.regions = this.regions.toJson();

        return <ComponentTypeWrapperJson> {
            LayoutComponent: json
        };
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, LayoutComponent)) {
            return false;
        }

        let other = <LayoutComponent>o;

        if (!super.equals(o)) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.regions, other.regions)) {
            return false;
        }

        return true;
    }

    clone(): LayoutComponent {
        return new LayoutComponentBuilder(this).build();
    }

    private registerRegionsListeners(regions: Regions) {
        regions.onChanged(this.regionsChangedEventHandler);
        regions.onComponentPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    private unregisterRegionsListeners(regions: Regions) {
        regions.unChanged(this.regionsChangedEventHandler);
        regions.unComponentPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    onComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
        this.componentPropertyChangedListeners.push(listener);
    }

    unComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
        this.componentPropertyChangedListeners =
            this.componentPropertyChangedListeners.filter((curr: (event: ComponentPropertyChangedEvent) => void) => {
                return listener !== curr;
            });
    }

}

export class LayoutComponentBuilder
    extends DescriptorBasedComponentBuilder<LayoutComponent> {

    regions: Regions;

    constructor(source?: LayoutComponent) {

        super(source);

        if (source) {
            this.regions = source.getRegions().clone();
        }

        this.setType(LayoutComponentType.get());
    }

    public fromJson(json: LayoutComponentJson, region: Region): LayoutComponent {

        if (json.descriptor) {
            this.setDescriptor(api.content.page.DescriptorKey.fromString(json.descriptor));
        }
        this.setName(json.name ? new ComponentName(json.name) : null);
        if (json.config) {
            this.setConfig(PropertyTree.fromJson(json.config));
        }
        this.setParent(region);

        let layoutComponent = this.build();
        let layoutRegions = Regions.fromJson(json.regions, layoutComponent);
        layoutComponent.setRegions(layoutRegions);
        return layoutComponent;
    }

    public setRegions(value: Regions): LayoutComponentBuilder {
        this.regions = value;
        return this;
    }

    public build(): LayoutComponent {
        return new LayoutComponent(this);
    }
}
