import '../../../../../api.ts';
import {WidgetItemView} from '../../WidgetItemView';
import {DependencyGroup, DependencyType} from './DependencyGroup';
import {ResolveDependenciesRequest} from '../../../../resource/ResolveDependenciesRequest';
import {ContentDependencyJson} from '../../../../resource/json/ContentDependencyJson';
import {ResolveDependencyResult} from '../../../../resource/ResolveDependencyResult';
import {ResolveDependenciesResult} from '../../../../resource/ResolveDependenciesResult';
import {ShowDependenciesEvent} from '../../../../browse/ShowDependenciesEvent';
import {Content} from '../../../../content/Content';
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import NamesAndIconView = api.app.NamesAndIconView;
import NamesAndIconViewSize = api.app.NamesAndIconViewSize;
import NamesAndIconViewBuilder = api.app.NamesAndIconViewBuilder;
import i18n = api.util.i18n;

export class DependenciesWidgetItemView
    extends WidgetItemView {

    private mainContainer: api.dom.DivEl;
    private nameAndIcon: api.app.NamesAndIconView;

    private noInboundDependencies: api.dom.DivEl;
    private noOutboundDependencies: api.dom.DivEl;

    private item: Content;
    private inboundDependencies: DependencyGroup[];
    private outboundDependencies: DependencyGroup[];

    private inboundButton: ActionButton;
    private outboundButton: ActionButton;

    constructor() {
        super('dependency-widget-item-view');

        this.inboundButton = this.appendButton(i18n('field.details.showInbound'), 'btn-inbound');
        this.appendMainContainer();
        this.outboundButton = this.appendButton(i18n('field.details.showOutbound'), 'btn-outbound');
        this.manageButtonClick();
    }

    private manageButtonClick() {
        this.inboundButton.getAction().onExecuted(() => {
            new ShowDependenciesEvent(this.item.getContentId(), true).fire();
        });

        this.outboundButton.getAction().onExecuted(() => {
            new ShowDependenciesEvent(this.item.getContentId(), false).fire();
        });
    }

    private setButtonDecoration(button: ActionButton, dependencies: DependencyGroup[]) {
        if (dependencies.length === 0) {
            button.hide();
        } else {
            button.setLabel(button.getAction().getLabel() + ' (' + this.getTotalItemCount(dependencies) + ')');
            button.show();
        }
    }

    private appendButton(label: string, cls: string): ActionButton {
        const action = new Action(label);
        const button = new ActionButton(action);

        button.addClass(cls);
        this.appendChild(button);

        return button;
    }

    public setContentAndUpdateView(item: Content): wemQ.Promise<any> {
        if (DependenciesWidgetItemView.debug) {
            console.debug('DependenciesWidgetItemView.setItem: ', item);
        }

        this.item = item;
        return this.resolveDependencies(item);
    }

    private resetContainers() {
        this.mainContainer.removeChildren();

        this.removeClass('no-inbound');
        this.removeClass('no-outbound');
    }

    private appendMainContainer() {
        this.mainContainer = new api.dom.DivEl('main-container');
        this.appendChild(this.mainContainer);
    }

    private appendContentNamesAndIcon(item: Content) {
        this.nameAndIcon =
            new api.app.NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium))
                .setIconUrl(item.getIconUrl())
                .setMainName(item.getDisplayName())
                .setSubName(item.getPath().toString());

        this.nameAndIcon.addClass('main-content');

        this.mainContainer.appendChild(this.nameAndIcon);
    }

    private createDependenciesContainer(type: DependencyType, dependencies: DependencyGroup[]): api.dom.DivEl {
        const typeAsString = DependencyType[type].toLowerCase();
        const div = new api.dom.DivEl('dependencies-container ' + typeAsString);

        if (dependencies.length === 0) {
            this.addClass('no-' + typeAsString);
            div.addClass('no-dependencies');
            div.setHtml(i18n('field.widget.noDependencies.' + typeAsString));
        } else {
            this.appendDependencies(div, dependencies);
        }

        this.mainContainer.appendChild(div);

        return div;
    }

    private renderContent(item: Content) {
        this.resetContainers();

        this.noInboundDependencies = this.createDependenciesContainer(DependencyType.INBOUND, this.inboundDependencies);
        this.appendContentNamesAndIcon(item);
        this.noOutboundDependencies = this.createDependenciesContainer(DependencyType.OUTBOUND, this.outboundDependencies);

        this.setButtonDecoration(this.inboundButton, this.inboundDependencies);
        this.setButtonDecoration(this.outboundButton, this.outboundDependencies);
    }

    private getTotalItemCount(dependencies: DependencyGroup[]): number {
        let sum = 0;
        dependencies.forEach((dependencyGroup: DependencyGroup) => {
            sum += dependencyGroup.getItemCount();
        });

        return sum;
    }

    private appendDependencies(container: api.dom.DivEl, dependencies: DependencyGroup[]) {
        dependencies.forEach((dependencyGroup: DependencyGroup) => {
            container.appendChild(this.createDependencyGroupView(dependencyGroup));
        });
    }

    private createDependencyGroupView(dependencyGroup: DependencyGroup): NamesAndIconView {
        const dependencyGroupView = new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small))
            .setIconUrl(dependencyGroup.getIconUrl())
            .setMainName('(' + dependencyGroup.getItemCount().toString() + ')');

        this.handleDependencyGroupClick(dependencyGroupView, dependencyGroup);

        return dependencyGroupView;
    }

    private handleDependencyGroupClick(dependencyGroupView: NamesAndIconView, dependencyGroup: DependencyGroup) {
        dependencyGroupView.getIconImageEl().onClicked(() => {
            new ShowDependenciesEvent(this.item.getContentId(), dependencyGroup.getType() === DependencyType.INBOUND,
                dependencyGroup.getContentType()).fire();
        });
    }

    /**
     * Perform request to resolve dependency items of given item.
     */
    private resolveDependencies(item: Content): wemQ.Promise<any> {

        const resolveDependenciesRequest = new ResolveDependenciesRequest([item.getContentId()]);

        return resolveDependenciesRequest.sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];
            if (dependencyEntry) {
                this.initResolvedDependenciesItems(dependencyEntry.getDependency());
                this.renderContent(item);
            }
        });
    }

    /**
     * Inits arrays of properties that store results of performing resolve request.
     */
    private initResolvedDependenciesItems(json: ContentDependencyJson) {
        this.inboundDependencies = DependencyGroup.fromDependencyGroupJson(DependencyType.INBOUND, json.inbound);
        this.outboundDependencies = DependencyGroup.fromDependencyGroupJson(DependencyType.OUTBOUND, json.outbound);
    }

}
